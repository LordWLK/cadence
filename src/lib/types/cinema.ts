export interface UgcCinema {
  id: string;
  name: string;
  city: string;
}

export interface CinemaShowtime {
  time: string;       // "14:30"
  room: string;       // "Salle 5"
  version: string;    // "VF" | "VOSTF"
}

export interface CinemaMovie {
  id: string;
  title: string;
  director: string;
  duration: string;     // "2h15"
  genres: string[];
  synopsis: string;
  casting: string[];
  releaseDate: string;
  posterUrl: string | null;
  rating: string | null;   // note UGC or press
  label: string | null;    // "UGC Aime", "UGC Decouvre"
  showtimes: CinemaShowtime[];
}

export interface CinemaFeedResponse {
  cinemaId: string;
  cinemaName: string;
  date: string;
  movies: CinemaMovie[];
}
