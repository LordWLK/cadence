export const ACTIVITY_CATEGORIES = [
  { id: 'sport_play',       label: 'Sport (jouer)',   icon: 'Dumbbell',  color: 'text-sport-football',   hex: '#16a34a' },
  { id: 'sport_watch',      label: 'Sport (regarder)',icon: 'Tv',         color: 'text-sport-basketball', hex: '#ea580c' },
  { id: 'social',           label: 'Social',          icon: 'Users',      color: 'text-primary',          hex: '#7c3aed' },
  { id: 'personal_project', label: 'Projet perso',    icon: 'Lightbulb',  color: 'text-accent',           hex: '#4f46e5' },
  { id: 'relax',            label: 'Détente',         icon: 'Coffee',     color: 'text-warning',          hex: '#d97706' },
  { id: 'other',            label: 'Autre',           icon: 'Sparkles',   color: 'text-text-muted',       hex: '#6b6355' },
] as const;

export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number]['id'];

export const SPORT_COLORS: Record<string, string> = {
  football: 'sport-football',
  basketball: 'sport-basketball',
  mma: 'sport-mma',
};

// Hex values for inline styles (Tailwind can't resolve dynamic class names like `border-${var}`)
export const SPORT_HEX: Record<string, string> = {
  football: '#16a34a',
  basketball: '#ea580c',
  mma: '#dc2626',
};

export const MOOD_HEX = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'] as const;

export const MOOD_EMOJIS = ['😔', '😕', '😐', '🙂', '😊'] as const;
export const MOOD_LABELS = ['Pas bien', 'Bof', 'Neutre', 'Bien', 'Super'] as const;

// TheSportsDB league IDs for major football competitions
export const FOOTBALL_LEAGUES: Record<string, { id: string; name: string }> = {
  ligue1: { id: '4334', name: 'Ligue 1' },
  premierLeague: { id: '4328', name: 'Premier League' },
  laLiga: { id: '4335', name: 'La Liga' },
  bundesliga: { id: '4331', name: 'Bundesliga' },
  serieA: { id: '4332', name: 'Serie A' },
  championsLeague: { id: '4480', name: 'Champions League' },
  europaLeague: { id: '4481', name: 'Europa League' },
};

// Known top teams by TheSportsDB ID per league (for "big match" detection)
export const TOP_FOOTBALL_TEAMS: Record<string, string[]> = {
  '4334': ['133712', '133811', '133816', '134032', '133821', '133815', '134007', '133819', '133820', '133710'], // Ligue 1: PSG, Monaco, Lille, Lens, Marseille, Lyon, Nice, Rennes, Brest, Strasbourg
  '4328': ['133602', '133610', '133612', '133613', '133604', '133616', '133614', '133632', '133615', '133601'], // PL: Man City, Arsenal, Liverpool, Chelsea, Man Utd, Tottenham, Newcastle, Aston Villa, Brighton, West Ham
  '4335': ['133738', '133739', '134462', '133750', '133743', '133749', '134521', '133745', '133747', '133742'], // La Liga: Barcelona, Real Madrid, Atletico, Real Sociedad, Villarreal, Athletic Bilbao, Girona, Betis, Sevilla, Valencia
  '4331': ['133600', '133621', '134938', '133620', '134937', '133624', '133619', '133626', '133622', '133628'], // Bundesliga: Bayern, Dortmund, Leverkusen, Leipzig, Union Berlin, Frankfurt, Wolfsburg, Freiburg, Gladbach, Stuttgart
  '4332': ['133676', '133692', '133691', '133604', '133672', '133681', '133679', '133686', '133685', '133680'], // Serie A: Napoli, Inter, AC Milan, Juventus, Roma, Atalanta, Lazio, Fiorentina, Bologna, Torino
};

// Known derbies (pairs of TheSportsDB team IDs)
export const KNOWN_DERBIES: [string, string][] = [
  ['133738', '133739'], // El Clasico: Barca vs Real Madrid
  ['133602', '133604'], // Manchester derby
  ['133610', '133612'], // North London: Arsenal vs Tottenham... wait Arsenal vs Liverpool
  ['133613', '133610'], // Chelsea vs Arsenal
  ['133612', '133613'], // Liverpool vs Chelsea
  ['133610', '133616'], // Arsenal vs Tottenham
  ['133676', '133692'], // Napoli vs Inter
  ['133691', '133692'], // Milan derby: AC Milan vs Inter
  ['133600', '133621'], // Der Klassiker: Bayern vs Dortmund
  ['133712', '133821'], // Le Classique: PSG vs Marseille
  ['133815', '133821'], // Olympico: Lyon vs Marseille
  ['133749', '133738'], // Athletic vs Barca
  ['133672', '133679'], // Roma vs Lazio (Derby della Capitale)
];

// Champions League knockout stage identifiers
export const CL_KNOCKOUT_KEYWORDS = ['final', 'semi-final', 'quarter-final', 'round of 16', 'knockout'];

// NBA big match keywords (via TheSportsDB)
export const NBA_BIG_MATCH_KEYWORDS = ['playoff', 'finals', 'semi-final', 'conference final', 'all-star'];

// UFC/MMA keywords for big match detection
export const MMA_BIG_MATCH_KEYWORDS = ['title', 'championship', 'main event', 'main card', 'ppv'];
