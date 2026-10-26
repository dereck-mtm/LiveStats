import type {
  PlayHistoryItem,
  SpotifyArtist,
  SpotifyProfile,
  SpotifyTrack,
} from "./spotify";

export const demoProfile: SpotifyProfile = {
  id: "demo",
  display_name: "Dereck (Demo)",
  email: "demo@livestats.app",
  country: "US",
  product: "premium",
  followers: { total: 42 },
  images: [],
};

export const demoArtists: SpotifyArtist[] = [
  {
    id: "1",
    name: "Tyler, The Creator",
    genres: ["hip hop", "rap"],
    popularity: 88,
    external_urls: { spotify: "https://open.spotify.com" },
    images: [],
  },
  {
    id: "2",
    name: "SZA",
    genres: ["r&b", "pop"],
    popularity: 91,
    external_urls: { spotify: "https://open.spotify.com" },
    images: [],
  },
  {
    id: "3",
    name: "Kaytranada",
    genres: ["electronic", "house"],
    popularity: 74,
    external_urls: { spotify: "https://open.spotify.com" },
    images: [],
  },
  {
    id: "4",
    name: "Frank Ocean",
    genres: ["r&b", "alternative"],
    popularity: 86,
    external_urls: { spotify: "https://open.spotify.com" },
    images: [],
  },
  {
    id: "5",
    name: "FKA twigs",
    genres: ["art pop", "alternative"],
    popularity: 72,
    external_urls: { spotify: "https://open.spotify.com" },
    images: [],
  },
];

export const demoTracks: SpotifyTrack[] = [
  {
    id: "t1",
    name: "See You Again",
    popularity: 85,
    duration_ms: 180000,
    external_urls: { spotify: "https://open.spotify.com" },
    artists: [{ id: "1", name: "Tyler, The Creator" }],
    album: { name: "Flower Boy", images: [] },
  },
  {
    id: "t2",
    name: "Snooze",
    popularity: 90,
    duration_ms: 201000,
    external_urls: { spotify: "https://open.spotify.com" },
    artists: [{ id: "2", name: "SZA" }],
    album: { name: "SOS", images: [] },
  },
  {
    id: "t3",
    name: "10%",
    popularity: 70,
    duration_ms: 195000,
    external_urls: { spotify: "https://open.spotify.com" },
    artists: [{ id: "3", name: "Kaytranada" }],
    album: { name: "Bubba", images: [] },
  },
  {
    id: "t4",
    name: "Ivy",
    popularity: 82,
    duration_ms: 249000,
    external_urls: { spotify: "https://open.spotify.com" },
    artists: [{ id: "4", name: "Frank Ocean" }],
    album: { name: "Blonde", images: [] },
  },
  {
    id: "t5",
    name: "Two Weeks",
    popularity: 68,
    duration_ms: 247000,
    external_urls: { spotify: "https://open.spotify.com" },
    artists: [{ id: "5", name: "FKA twigs" }],
    album: { name: "LP1", images: [] },
  },
];

export const demoRecent: PlayHistoryItem[] = demoTracks.map((track, i) => ({
  played_at: new Date(Date.now() - i * 45 * 60_000).toISOString(),
  track,
}));
