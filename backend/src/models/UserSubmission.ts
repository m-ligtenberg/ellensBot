export interface UserSubmission {
  id: number;
  submission_id: string;
  user_session_id?: string;
  submission_type: 'phrase' | 'response' | 'denial' | 'interruption' | 'slang';
  
  // Content
  submitted_text: string;
  context_description?: string;
  category?: string;
  
  // Status
  submission_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  
  // Metrics
  upvotes: number;
  downvotes: number;
  quality_score?: number;
  ellens_appropriateness_score?: number;
  
  // Usage
  times_used: number;
  effectiveness_score?: number;
  last_used_at?: Date;
  
  // Flags
  is_featured: boolean;
  is_offensive: boolean;
  auto_flagged: boolean;
  flag_reason?: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface SubmissionReview {
  id: number;
  submission_id: number;
  admin_session_id: string;
  action: 'approve' | 'reject' | 'flag' | 'unflag' | 'feature' | 'unfeature';
  reason?: string;
  previous_status: string;
  new_status: string;
  created_at: Date;
}

export interface ApprovedContent {
  id: number;
  submission_id: number;
  content_type: string;
  trigger_keywords: string[];
  response_text: string;
  context_rules?: string;
  mood_requirement?: string;
  chaos_level_min: number;
  chaos_level_max: number;
  weight: number;
  is_active: boolean;
  created_at: Date;
}

export interface SubmissionVote {
  id: number;
  submission_id: number;
  user_session_id: string;
  vote_type: 'up' | 'down' | 'report';
  created_at: Date;
}

export interface SubmissionAnalytics {
  id: number;
  date: Date;
  total_submissions: number;
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  flagged_submissions: number;
  avg_review_time_hours?: number;
  top_submission_category?: string;
  community_engagement_score?: number;
  created_at: Date;
}

// DTOs for API requests/responses
export interface CreateSubmissionRequest {
  submission_type: 'phrase' | 'response' | 'denial' | 'interruption' | 'slang';
  submitted_text: string;
  context_description?: string;
  category?: string;
  user_session_id?: string;
}

export interface ReviewSubmissionRequest {
  action: 'approve' | 'reject' | 'flag' | 'unflag' | 'feature' | 'unfeature';
  reason?: string;
  admin_notes?: string;
}

export interface VoteSubmissionRequest {
  vote_type: 'up' | 'down' | 'report';
}

export interface SubmissionListResponse {
  submissions: UserSubmission[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AdminDashboardStats {
  total_pending: number;
  total_flagged: number;
  total_approved_today: number;
  total_rejected_today: number;
  avg_review_time_hours: number;
  most_active_category: string;
  community_engagement_score: number;
  top_contributors: Array<{
    session_id: string;
    submission_count: number;
    approval_rate: number;
  }>;
}