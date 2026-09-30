export type GameCategory =
  | 'Racing'
  | 'Arcade'
  | 'Shooting'
  | 'Platformer'
  | 'Tower Defense'
  | 'Puzzle'
  | 'Action'
  | 'Fighting'
  | 'Sports'
  | 'Simulation'
  | 'Exploration'
  | 'Hypercasual'
  | 'Survival'
  | 'Roguelike'
  | 'Card'
  | 'Board'
  | 'Logic'
  | 'Mahjong'
  | 'Solitaire';

export interface GameControlMapping {
  key: string;
  action: string;
}

export interface UserReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  category: GameCategory;
  tagline: string;
  description: string;
  instructions: string[];
  controls: GameControlMapping[];
  thumbnail: string;
  badge?: 'HOT' | 'NEW' | 'TOP RATED';
  rating: number;
  reviewsCount: number;
  playsCount: number;
  maxLevels: number;
  tags: string[];
  releaseDate: string;
}

export type ViewType =
  | 'home'
  | 'all-games'
  | 'popular'
  | 'new'
  | 'game'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'dmca';

export interface ActiveGameContext {
  level: number;
  isPaused: boolean;
  isSoundOn: boolean;
  aspectMode: '16:9' | '9:16';
  isFullscreen: boolean;
  onNextLevel: () => void;
  onRestart: () => void;
  onGameOver: (score: number) => void;
  onLevelComplete: (level: number, score: number) => void;
}
