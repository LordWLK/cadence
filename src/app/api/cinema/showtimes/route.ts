import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { CinemaMovie, CinemaShowtime } from '@/lib/types/cinema';
import { UGC_CINEMAS } from '@/lib/config/constants';

// Cache: cinemaId-date -> { data, timestamp }
const cache = new Map<string, { data: CinemaMovie[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Simple rate limiter: IP -> { count, resetTime }
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

// Purge des entrées expirées pour éviter une croissance mémoire non bornée
// (les clés sont pilotables par le client : IP falsifiable, cinemaId/date variés).
function purgeExpired(now: number) {
  for (const [key, v] of rateLimits) {
    if (now >= v.resetTime) rateLimits.delete(key);
  }
  for (const [key, v] of cache) {
    if (now - v.ts >= CACHE_TTL) cache.delete(key);
  }
}

// Ids de cinémas autorisés (on ne relaie que vers des cinémas connus)
const VALID_CINEMA_IDS = new Set(UGC_CINEMAS.map((c) => c.id));

export async function GET(req: NextRequest) {
  const cinemaId = req.nextUrl.searchParams.get('cinemaId');
  const date = req.nextUrl.searchParams.get('date'); // YYYY-MM-DD

  if (!cinemaId || !date) {
    return NextResponse.json({ error: 'cinemaId and date required' }, { status: 400 });
  }

  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  if (!VALID_CINEMA_IDS.has(cinemaId)) {
    return NextResponse.json({ error: 'Unknown cinemaId' }, { status: 400 });
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  purgeExpired(now);
  const rateData = rateLimits.get(clientIp);
  if (rateData && now < rateData.resetTime) {
    if (rateData.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    rateData.count++;
  } else {
    rateLimits.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  const cacheKey = `${cinemaId}-${date}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const cinema = UGC_CINEMAS.find(c => c.id === cinemaId);
    return NextResponse.json({
      cinemaId,
      cinemaName: cinema?.name || 'UGC',
      date,
      movies: cached.data,
    });
  }

  try {
    const url = `https://www.ugc.fr/showingsCinemaAjaxAction!getShowingsForCinemaPage.action?cinemaId=${encodeURIComponent(cinemaId)}&date=${encodeURIComponent(date)}`;
    // Timeout : sans lui, une réponse UGC qui traîne bloque la fonction serverless
    // (et le spinner client) jusqu'au timeout plateforme.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'UGC request failed' }, { status: 502 });
    }

    const html = await res.text();
    const movies = parseShowtimesHtml(html);

    // Si on n'a extrait AUCUN film alors que la page contient manifestement du contenu,
    // c'est probablement un changement de structure UGC ou une page anti-bot/consentement
    // renvoyée en 200. On ne met alors PAS en cache (sinon un feed vide serait figé 1h) et
    // on signale une erreur pour que le client puisse réessayer.
    if (movies.length === 0 && html.length > 2000) {
      return NextResponse.json({ error: 'Aucune séance (structure UGC inattendue)' }, { status: 502 });
    }

    // On ne met en cache que des résultats non vides (un jour réellement sans séance
    // sera re-tenté à la prochaine requête, ce qui est peu coûteux).
    if (movies.length > 0) {
      cache.set(cacheKey, { data: movies, ts: Date.now() });
    }

    const cinema = UGC_CINEMAS.find(c => c.id === cinemaId);
    return NextResponse.json({
      cinemaId,
      cinemaName: cinema?.name || 'UGC',
      date,
      movies,
    });
  } catch (err) {
    console.error('UGC scrape error:', err);
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
  }
}

function parseShowtimesHtml(html: string): CinemaMovie[] {
  const $ = cheerio.load(html);
  const movies: CinemaMovie[] = [];

  // Each film block: .slider-item > .band.component--cinema-list-item
  $('.component--cinema-list-item').each((_, filmEl) => {
    const $film = $(filmEl);

    // Title from .block--title a
    const $titleLink = $film.find('.block--title a').first();
    const title = $titleLink.text().trim();
    if (!title) return;

    // Genres from data-film-kind attribute
    const genreStr = $titleLink.attr('data-film-kind') || '';
    const genres = genreStr ? genreStr.split(',').map(g => g.trim()).filter(Boolean) : [];

    // Label (e.g. "Sélection UGC Family") from data-film-label or .film-tag
    const label = $titleLink.attr('data-film-label')
      || $film.find('.film-tag').first().text().trim()
      || null;

    // Poster from img with data-src (lazy loaded)
    const posterSrc = $film.find('.component--film-presentation img').first().attr('data-src')
      || $film.find('.component--film-presentation img').first().attr('src')
      || null;

    // Metadata from .group-info > p.p--medium.color--grey
    let director = '';
    let synopsis = '';
    let duration = '';
    let casting: string[] = [];
    let releaseDate = '';

    $film.find('.info-wrapper.main .group-info').each((_, gi) => {
      const $gi = $(gi);
      const text = $gi.text().trim();

      if (text.startsWith('De ') || text.startsWith('De\n')) {
        // Director line: "De Nom Du Réalisateur"
        const dirMatch = text.match(/^De\s+([\s\S]+?)(?:\s*Avec|\s*Synopsis|\s*Sortie|$)/);
        if (dirMatch) director = dirMatch[1].trim().split('\n')[0].trim();
      }
      if (text.includes('Avec')) {
        const castMatch = text.match(/Avec\s+([\s\S]+?)(?:\s*Synopsis|\s*Sortie|$)/);
        if (castMatch) casting = castMatch[1].trim().split(',').map(c => c.trim()).filter(Boolean);
      }
      if (text.includes('Synopsis')) {
        const synMatch = text.match(/Synopsis\s+([\s\S]+?)(?:\s*Sortie|$)/);
        if (synMatch) synopsis = synMatch[1].trim().split('\n')[0].trim();
      }
      if (text.startsWith('Sortie le')) {
        const dateMatch = text.match(/Sortie le\s+(.+)/);
        if (dateMatch) releaseDate = dateMatch[1].trim();
      }
    });

    // Also check mobile info-wrapper for metadata if desktop didn't have it
    if (!director) {
      $film.find('.info-wrapper .group-info p').each((_, p) => {
        const pText = $(p).text().trim();
        if (pText.startsWith('De ') && !director) {
          director = pText.replace(/^De\s+/, '').split('\n')[0].trim();
        }
      });
    }

    // Duration from .p--medium (often like "1h 35min" or "2h 20min")
    $film.find('.p--medium').each((_, p) => {
      const pText = $(p).text().trim();
      const durMatch = pText.match(/(\d+h\s*\d*min?)/i);
      if (durMatch && !duration) duration = durMatch[1];
    });

    // Parse showtimes from .component--screening-cards li
    // UGC mise à jour: .screening-start → .screening-time-start, format "HH:MM"
    const showtimes: CinemaShowtime[] = [];
    $film.find('.component--screening-cards li, .component--screening-cards > a').each((_, stEl) => {
      const $st = $(stEl);

      // Support des deux structures (nouvelle + ancienne au cas où)
      const time = (
        $st.find('.screening-time-start').text().trim() ||
        $st.find('.screening-start').text().trim()
      );
      if (!time) return;

      const room = $st.find('.screening-detail').text().trim();
      const version = $st.find('.screening-lang').text().trim() || 'VF';

      showtimes.push({
        time: time.replace(/\s+/g, ''),
        room,
        version,
      });
    });

    // Build poster URL
    let posterUrl: string | null = null;
    if (posterSrc) {
      posterUrl = posterSrc.startsWith('http') ? posterSrc : `https://www.ugc.fr${posterSrc}`;
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    movies.push({
      id,
      title,
      director,
      duration,
      genres,
      synopsis,
      casting,
      releaseDate,
      posterUrl,
      rating: null,
      label,
      showtimes,
    });
  });

  return movies;
}
