import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { CinemaMovie, CinemaShowtime } from '@/lib/types/cinema';
import { UGC_CINEMAS } from '@/lib/config/constants';

// Cache: cinemaId-date -> { data, timestamp }
const cache = new Map<string, { data: CinemaMovie[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  const cinemaId = req.nextUrl.searchParams.get('cinemaId');
  const date = req.nextUrl.searchParams.get('date'); // YYYY-MM-DD

  if (!cinemaId || !date) {
    return NextResponse.json({ error: 'cinemaId and date required' }, { status: 400 });
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
    const url = `https://www.ugc.fr/showingsCinemaAjaxAction!getShowingsForCinemaPage.action?cinemaId=${cinemaId}&date=${date}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'UGC request failed' }, { status: 502 });
    }

    const html = await res.text();
    const movies = parseShowtimesHtml(html);

    cache.set(cacheKey, { data: movies, ts: Date.now() });

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

  // Each film block in UGC HTML
  $('.component--cinema-filmlist-item, .film-list__item, [class*="film"]').each((_, filmEl) => {
    const $film = $(filmEl);

    const title = $film.find('.film-title, .title, h2, h3').first().text().trim();
    if (!title) return;

    // Extract metadata
    const director = $film.find('.director, .realisateur, [class*="director"]').first().text().trim()
      .replace(/^(De|Par)\s+/i, '');
    const duration = $film.find('.duration, .duree, [class*="duration"]').first().text().trim();
    const genre = $film.find('.genre, [class*="genre"]').first().text().trim();
    const synopsis = $film.find('.synopsis, .description, [class*="synopsis"]').first().text().trim();
    const label = $film.find('.label-ugc, [class*="label"]').first().text().trim() || null;
    const posterSrc = $film.find('img').first().attr('src') || $film.find('img').first().attr('data-src') || null;

    // Parse showtimes
    const showtimes: CinemaShowtime[] = [];
    $film.find('.showtime, .seance, [class*="seance"], [class*="showtime"], .hours-list li, .schedule-item').each((_, stEl) => {
      const $st = $(stEl);
      const time = $st.find('.time, .hour, .heure').first().text().trim()
        || $st.text().trim().match(/\d{1,2}[h:]\d{2}/)?.[0]
        || $st.text().trim();
      if (!time || time.length > 20) return;

      const room = $st.find('.room, .salle, [class*="salle"]').first().text().trim() || '';
      const version = $st.find('.version, .lang, [class*="version"]').first().text().trim()
        || (($st.text().includes('VOSTF') || $st.text().includes('VOST')) ? 'VOSTF' : 'VF');

      showtimes.push({ time: time.replace(/\s+/g, ''), room, version });
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
      genres: genre ? genre.split(/[,/]/).map(g => g.trim()).filter(Boolean) : [],
      synopsis,
      casting: [],
      releaseDate: '',
      posterUrl,
      rating: null,
      label,
      showtimes,
    });
  });

  return movies;
}
