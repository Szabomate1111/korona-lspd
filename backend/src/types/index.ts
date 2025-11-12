export type UserRole = 'rendszergazda' | 'leader' | 'al-leader' | 'admin' | 'owner';

export interface User {
  id: number;
  discord_id: string;
  username: string;
  avatar?: string;
  discriminator?: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: number;
  category_id?: number;
  question_text: string;
  field_key: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  options?: string[]; // for select/radio/checkbox
  is_required: boolean;
  min_length?: number; // minimum character length for text/textarea
  max_length?: number; // maximum character length for text/textarea
  order_index: number;
  version: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionsSnapshot {
  version: number;
  questions: Question[];
}

export interface PasteMeta {
  pasted: boolean;
  similarity: number;
  pasteCount: number;
  timeToEdit: number;
  lengthChangeRatio: number;
  initialHash: string;
}

export interface Application {
  id: number;
  answers: Record<string, string>;
  paste_meta: Record<string, PasteMeta>;
  questions_snapshot: QuestionsSnapshot;
  suspicion_score: number;
  status: 'new' | 'review' | 'accepted' | 'rejected';
  admin_note?: string;
  reviewed_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PasteEvent {
  field: string;
  initialHash: string;
  pasteAt: number;
  initialLength: number;
}

export interface ClientMeta {
  ua?: string;
  tz?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface ApplyRequest {
  answers: Record<string, string>;
  pastes: PasteEvent[];
  clientMeta?: ClientMeta;
}

export interface AuthPayload {
  userId: number;
  role: UserRole;
  username: string;
  avatar?: string;
}

export interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  discordClientId: string;
  discordClientSecret: string;
  discordRedirectUri: string;
  jwtSecret: string;
  frontendUrl: string;
  suspicionThreshold: number;
  similarityThreshold: number;
  pasteEventWeight: number;
  similarityWeight: number;
  timeToEditWeight: number;
  multiFieldBonus: number;
  minTimeToEdit: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}
