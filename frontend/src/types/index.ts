export interface Question {
  id: number;
  question_text: string;
  field_key: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  options?: string[];
  is_required: boolean;
  order_index: number;
  version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionsResponse {
  version: number;
  questions: Question[];
}

export interface PasteEvent {
  field: string;
  initialHash: string;
  pasteAt: number;
  initialLength: number;
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
  questions_snapshot: {
    version: number;
    questions: Question[];
  };
  suspicion_score: number;
  status: 'new' | 'review' | 'accepted' | 'rejected';
  admin_note?: string;
  reviewed_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationsListResponse {
  applications: Application[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApplicationStats {
  total: number;
  new: number;
  review: number;
  accepted: number;
  rejected: number;
  avgSuspicionScore: number;
  pastedCount: number;
}

export interface User {
  id: number;
  discord_id: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'admin';
  created_at: string;
}

export interface AuthUser {
  userId: number;
  role: 'owner' | 'admin';
}
