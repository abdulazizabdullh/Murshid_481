export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_role: 'student' | 'specialist' | 'admin';
  author_university?: string;
  author_major?: string;
  author_academic_level?: string;
  post_type: 'question' | 'discussion' | 'announcement';
  tags: string[];
  major_tags?: string[];
  university_tags?: string[];
  likes_count: number;
  answers_count: number;
  views_count: number;
  is_solved: boolean;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
}

export interface Answer {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_role: 'student' | 'specialist' | 'admin';
  author_university?: string;
  author_major?: string;
  author_academic_level?: string;
  likes_count: number;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  post_type: 'question' | 'discussion' | 'announcement';
  tags: string[];
  major_tags?: string[];
  university_tags?: string[];
}

export interface CreateAnswerRequest {
  post_id: string;
  content: string;
}

export interface Comment {
  id: string;
  answer_id: string;
  parent_comment_id?: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_role: 'student' | 'specialist' | 'admin';
  author_university?: string;
  author_major?: string;
  author_academic_level?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
  // Nested replies (for threaded display)
  replies?: Comment[];
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface AnswerLike {
  id: string;
  answer_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateCommentRequest {
  answer_id: string;
  parent_comment_id?: string;
  content: string;
}

export interface UpdatePostRequest {
  title: string;
  content: string;
  tags: string[];
  major_tags?: string[];
  university_tags?: string[];
}

export interface UpdateAnswerRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ============================================================================
// REPORTING SYSTEM
// ============================================================================

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'misinformation';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';
export type ReportContentType = 'post' | 'answer' | 'comment';

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reported_content_type: ReportContentType;
  reported_content_id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  reported_content_type: ReportContentType;
  reported_content_id: string;
  reason: ReportReason;
  description?: string;
}

export interface UpdateReportRequest {
  status: ReportStatus;
  resolution_notes?: string;
}

export interface ReportWithContent extends Report {
  content_preview?: string;
  content_title?: string;
  content_author_id?: string;
  content_author_name?: string;
}