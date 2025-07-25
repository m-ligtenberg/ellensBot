import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface LocalSubmission {
  id: string;
  submission_id: string;
  user_session_id: string;
  submission_type: string;
  submitted_text: string;
  context_description?: string;
  category?: string;
  submission_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  upvotes: number;
  downvotes: number;
  is_featured: boolean;
  is_offensive: boolean;
  quality_score?: number;
  times_used: number;
  created_at: string;
  updated_at: string;
}

interface LocalSubmissionStats {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  total_flagged: number;
}

class LocalSubmissionStorage {
  private submissionsFile: string;
  private submissions: LocalSubmission[] = [];

  constructor() {
    // Store submissions in backend directory
    this.submissionsFile = path.join(__dirname, '../../local-submissions.json');
    this.loadSubmissions();
  }

  private loadSubmissions(): void {
    try {
      if (fs.existsSync(this.submissionsFile)) {
        const data = fs.readFileSync(this.submissionsFile, 'utf-8');
        this.submissions = JSON.parse(data);
        console.log(`📂 Loaded ${this.submissions.length} local submissions`);
      } else {
        this.submissions = [];
        console.log('📂 No existing submissions file - starting fresh');
      }
    } catch (error) {
      console.error('Error loading local submissions:', error);
      this.submissions = [];
    }
  }

  private saveSubmissions(): void {
    try {
      fs.writeFileSync(this.submissionsFile, JSON.stringify(this.submissions, null, 2));
      console.log(`💾 Saved ${this.submissions.length} submissions to local file`);
    } catch (error) {
      console.error('Error saving local submissions:', error);
    }
  }

  public createSubmission(data: {
    submission_id: string;
    user_session_id: string;
    submission_type: string;
    submitted_text: string;
    context_description?: string;
    category?: string;
  }): LocalSubmission {
    const submission: LocalSubmission = {
      id: uuidv4(),
      submission_id: data.submission_id,
      user_session_id: data.user_session_id,
      submission_type: data.submission_type,
      submitted_text: data.submitted_text,
      context_description: data.context_description,
      category: data.category,
      submission_status: 'pending',
      upvotes: 0,
      downvotes: 0,
      is_featured: false,
      is_offensive: false,
      quality_score: 1.0,
      times_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.submissions.push(submission);
    this.saveSubmissions();
    
    console.log(`✅ Created local submission: "${data.submitted_text.substring(0, 50)}..."`);
    return submission;
  }

  public getSubmissions(options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): { submissions: LocalSubmission[], total: number } {
    let filtered = this.submissions;

    if (options.status) {
      filtered = filtered.filter(s => s.submission_status === options.status);
    }

    const total = filtered.length;
    
    // Sort by created_at desc
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (options.offset || options.limit) {
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      filtered = filtered.slice(offset, offset + limit);
    }

    return { submissions: filtered, total };
  }

  public getPendingSubmissions(limit: number = 20, offset: number = 0): { submissions: LocalSubmission[], total: number } {
    return this.getSubmissions({ 
      status: 'pending',
      limit,
      offset 
    });
  }

  public getApprovedSubmissions(limit: number = 20, offset: number = 0): { submissions: LocalSubmission[], total: number } {
    return this.getSubmissions({ 
      status: 'approved',
      limit,
      offset 
    });
  }

  public updateSubmissionStatus(submission_id: string, status: 'pending' | 'approved' | 'rejected' | 'flagged', admin_notes?: string): boolean {
    const submission = this.submissions.find(s => s.submission_id === submission_id);
    if (!submission) return false;

    submission.submission_status = status;
    submission.updated_at = new Date().toISOString();
    
    this.saveSubmissions();
    console.log(`🔄 Updated submission ${submission_id} status to: ${status}`);
    
    return true;
  }

  public voteOnSubmission(submission_id: string, vote_type: 'up' | 'down'): boolean {
    const submission = this.submissions.find(s => s.submission_id === submission_id);
    if (!submission) return false;

    if (vote_type === 'up') {
      submission.upvotes += 1;
    } else {
      submission.downvotes += 1;
    }

    // Simple quality score calculation
    submission.quality_score = (submission.upvotes + 1) / (submission.upvotes + submission.downvotes + 2);
    submission.updated_at = new Date().toISOString();
    
    this.saveSubmissions();
    console.log(`👍 Voted ${vote_type} on submission: ${submission_id}`);
    
    return true;
  }

  public getStats(): LocalSubmissionStats {
    const stats: LocalSubmissionStats = {
      total_pending: this.submissions.filter(s => s.submission_status === 'pending').length,
      total_approved: this.submissions.filter(s => s.submission_status === 'approved').length,
      total_rejected: this.submissions.filter(s => s.submission_status === 'rejected').length,
      total_flagged: this.submissions.filter(s => s.submission_status === 'flagged').length,
    };

    return stats;
  }

  public getApprovedContent(mood?: string, chaos_level: number = 50): LocalSubmission[] {
    return this.submissions.filter(s => 
      s.submission_status === 'approved' && 
      !s.is_offensive &&
      (!mood || !s.category || s.category === mood)
    ).sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
  }

  public getTopContributors(limit: number = 5): Array<{
    session_id: string;
    submission_count: number;
    approval_rate: number;
  }> {
    const contributorMap = new Map<string, { total: number; approved: number }>();

    this.submissions.forEach(submission => {
      const sessionId = submission.user_session_id;
      if (!contributorMap.has(sessionId)) {
        contributorMap.set(sessionId, { total: 0, approved: 0 });
      }
      const stats = contributorMap.get(sessionId)!;
      stats.total += 1;
      if (submission.submission_status === 'approved') {
        stats.approved += 1;
      }
    });

    return Array.from(contributorMap.entries())
      .filter(([_, stats]) => stats.total >= 1) // At least 1 submission
      .map(([sessionId, stats]) => ({
        session_id: sessionId.substring(0, 8) + '...',
        submission_count: stats.total,
        approval_rate: Math.round((stats.approved / stats.total) * 100)
      }))
      .sort((a, b) => b.approval_rate - a.approval_rate || b.submission_count - a.submission_count)
      .slice(0, limit);
  }

  public clearAllSubmissions(): void {
    this.submissions = [];
    this.saveSubmissions();
    console.log('🗑️ Cleared all local submissions');
  }

  public exportSubmissions(): LocalSubmission[] {
    return [...this.submissions]; // Return copy
  }

  public getSubmissionCount(): number {
    return this.submissions.length;
  }
}

// Create singleton instance
export const localSubmissionStorage = new LocalSubmissionStorage();