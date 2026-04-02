export const ACTIVITY_CATEGORIES = [
  { id: 'sport_play',       label: 'Sport (jouer)',   icon: 'Dumbbell',  color: 'text-sport-football',   hex: '#16a34a' },
  { id: 'work',             label: 'Travail',         icon: 'Briefcase',  color: 'text-sport-basketball', hex: '#ea580c' },
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

// All 30 NBA franchises (hardcoded because lookup_all_teams.php returns wrong data with free API key)
export const NBA_TEAMS: { id: string; name: string }[] = [
  { id: '134880', name: 'Atlanta Hawks' },
  { id: '134860', name: 'Boston Celtics' },
  { id: '134861', name: 'Brooklyn Nets' },
  { id: '134881', name: 'Charlotte Hornets' },
  { id: '134870', name: 'Chicago Bulls' },
  { id: '134871', name: 'Cleveland Cavaliers' },
  { id: '134875', name: 'Dallas Mavericks' },
  { id: '134885', name: 'Denver Nuggets' },
  { id: '134872', name: 'Detroit Pistons' },
  { id: '134865', name: 'Golden State Warriors' },
  { id: '134876', name: 'Houston Rockets' },
  { id: '134873', name: 'Indiana Pacers' },
  { id: '134866', name: 'Los Angeles Clippers' },
  { id: '134867', name: 'Los Angeles Lakers' },
  { id: '134877', name: 'Memphis Grizzlies' },
  { id: '134882', name: 'Miami Heat' },
  { id: '134874', name: 'Milwaukee Bucks' },
  { id: '134886', name: 'Minnesota Timberwolves' },
  { id: '134878', name: 'New Orleans Pelicans' },
  { id: '134862', name: 'New York Knicks' },
  { id: '134887', name: 'Oklahoma City Thunder' },
  { id: '134883', name: 'Orlando Magic' },
  { id: '134863', name: 'Philadelphia 76ers' },
  { id: '134868', name: 'Phoenix Suns' },
  { id: '134888', name: 'Portland Trail Blazers' },
  { id: '134869', name: 'Sacramento Kings' },
  { id: '134879', name: 'San Antonio Spurs' },
  { id: '134864', name: 'Toronto Raptors' },
  { id: '134889', name: 'Utah Jazz' },
  { id: '134884', name: 'Washington Wizards' },
];

// NBA big match keywords (via TheSportsDB)
export const NBA_BIG_MATCH_KEYWORDS = ['playoff', 'finals', 'semi-final', 'conference final', 'all-star'];

// MMA organizations (TheSportsDB league IDs)
export const MMA_LEAGUES: Record<string, { id: string; name: string }> = {
  ufc: { id: '4443', name: 'UFC' },
  pfl: { id: '5430', name: 'PFL' },
};

// UFC/MMA keywords for big match detection
export const MMA_BIG_MATCH_KEYWORDS = ['title', 'championship', 'main event', 'main card', 'ppv'];

// UGC Cinemas list (scraped from ugc.fr)
export const UGC_CINEMAS: { id: string; name: string; city: string }[] = [
  // Paris
  { id: '10', name: 'UGC Ciné Cité Les Halles', city: 'Paris' },
  { id: '12', name: 'UGC Ciné Cité Bercy', city: 'Paris' },
  { id: '7', name: 'UGC Ciné Cité Maillot', city: 'Paris' },
  { id: '14', name: 'UGC Montparnasse', city: 'Paris' },
  { id: '15', name: 'UGC Rotonde', city: 'Paris' },
  { id: '13', name: 'UGC Odéon', city: 'Paris' },
  { id: '4', name: 'UGC Danton', city: 'Paris' },
  { id: '11', name: 'UGC Lyon Bastille', city: 'Paris' },
  { id: '5', name: 'UGC Gobelins', city: 'Paris' },
  { id: '9', name: 'UGC Opéra', city: 'Paris' },
  { id: '37', name: 'UGC Ciné Cité Paris 19', city: 'Paris' },
  // Île-de-France
  { id: '20', name: 'UGC Ciné Cité La Défense', city: 'La Défense' },
  { id: '59', name: 'UGC Issy-les-Moulineaux', city: 'Issy-les-Moulineaux' },
  { id: '18', name: 'UGC Ciné Cité Rosny', city: 'Rosny-sous-Bois' },
  { id: '38', name: 'UGC Ciné Cité O Parinor', city: 'Aulnay-sous-Bois' },
  { id: '21', name: 'UGC Ciné Cité Créteil', city: 'Créteil' },
  { id: '19', name: 'UGC Ciné Cité Noisy-le-Grand', city: 'Noisy-le-Grand' },
  { id: '16', name: 'UGC Ciné Cité Cergy-le-Haut', city: 'Cergy' },
  { id: '17', name: 'UGC Enghien', city: 'Enghien-les-Bains' },
  { id: '43', name: 'UGC Ciné Cité Vélizy', city: 'Vélizy' },
  { id: '44', name: 'UGC Ciné Cité Parly', city: 'Le Chesnay' },
  { id: '6', name: 'UGC Ciné Cité SQY Ouest', city: 'Montigny-le-Bretonneux' },
  { id: '40', name: 'UGC Roxane', city: 'Versailles' },
  { id: '41', name: 'UGC Cyrano', city: 'Versailles' },
  { id: '55', name: 'UGC Plaisir', city: 'Plaisir' },
  { id: '47', name: 'Le Central', city: 'Île-de-France' },
  { id: '48', name: 'C2L Saint Germain', city: 'Saint-Germain-en-Laye' },
  { id: '49', name: 'Le Cin\'Hoche', city: 'Île-de-France' },
  { id: '54', name: 'C2L Poissy', city: 'Poissy' },
  { id: '39', name: 'UGC Le Majestic', city: 'Île-de-France' },
  // Bordeaux
  { id: '1', name: 'UGC Ciné Cité Bordeaux Gambetta', city: 'Bordeaux' },
  { id: '57', name: 'UGC Ciné Cité Bassins à Flot', city: 'Bordeaux' },
  { id: '42', name: 'UGC Talence', city: 'Talence' },
  // Caen
  { id: '27', name: 'UGC Ciné Cité Mondeville', city: 'Mondeville' },
  // Lille
  { id: '25', name: 'UGC Ciné Cité Lille', city: 'Lille' },
  { id: '24', name: 'UGC Ciné Cité Villeneuve d\'Ascq', city: 'Villeneuve-d\'Ascq' },
  { id: '45', name: 'Le Métropole', city: 'Lille' },
  { id: '46', name: 'Le Majestic', city: 'Lille' },
  { id: '52', name: 'Les Écrans', city: 'Lille' },
  // Lyon
  { id: '32', name: 'UGC Ciné Cité Internationale', city: 'Lyon' },
  { id: '33', name: 'UGC Ciné Cité Confluence', city: 'Lyon' },
];
