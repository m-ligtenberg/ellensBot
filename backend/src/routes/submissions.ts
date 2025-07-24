// @ts-nocheck
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/connection';
import { 
  CreateSubmissionRequest, 
  ReviewSubmissionRequest, 
  VoteSubmissionRequest,
  UserSubmission,
  SubmissionListResponse,
  AdminDashboardStats
} from '../models/UserSubmission';

const router = express.Router();
const db = Database.getInstance();

// Helper function to calculate community engagement score
async function calculateCommunityEngagement(): Promise<number> {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT s.user_session_id) as unique_contributors,
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN s.submission_status = 'approved' THEN 1 END) as approved_count,
        COALESCE(AVG(s.upvotes + s.downvotes), 0) as avg_votes_per_submission,
        COUNT(DISTINCT v.user_session_id) as unique_voters
      FROM user_submissions s
      LEFT JOIN submission_votes v ON s.id = v.submission_id
      WHERE s.created_at > NOW() - INTERVAL '7 days'
    `);
    
    const stats = result.rows[0];
    const uniqueContributors = parseInt(stats.unique_contributors) || 0;
    const totalSubmissions = parseInt(stats.total_submissions) || 0;
    const approvedCount = parseInt(stats.approved_count) || 0;
    const avgVotes = parseFloat(stats.avg_votes_per_submission) || 0;
    const uniqueVoters = parseInt(stats.unique_voters) || 0;
    
    // Calculate engagement score based on multiple factors
    let engagementScore = 0;
    
    // Factor 1: Contributor diversity (0-30 points)
    engagementScore += Math.min(30, uniqueContributors * 3);
    
    // Factor 2: Approval rate (0-25 points)
    const approvalRate = totalSubmissions > 0 ? approvedCount / totalSubmissions : 0;
    engagementScore += approvalRate * 25;
    
    // Factor 3: Voting activity (0-25 points)
    engagementScore += Math.min(25, avgVotes * 5);
    
    // Factor 4: Community participation (voters vs contributors) (0-20 points)
    const participationRatio = uniqueContributors > 0 ? uniqueVoters / uniqueContributors : 0;
    engagementScore += Math.min(20, participationRatio * 10);
    
    // Normalize to 0-1 scale
    return Math.min(1, engagementScore / 100);
  } catch (error) {
    console.error('Error calculating community engagement:', error);
    return 0.5; // Default neutral score
  }
}

// Submit new content from users
router.post('/submit', async (req, res): Promise<void> => {
  try {
    const { 
      submission_type, 
      submitted_text, 
      context_description, 
      category, 
      user_session_id 
    }: CreateSubmissionRequest = req.body;

    // Validation
    if (!submission_type || !submitted_text) {
      return res.status(400).json({ 
        error: 'submission_type and submitted_text are required' 
      });
    }

    if (submitted_text.length > 500) {
      return res.status(400).json({ 
        error: 'Submission text too long (max 500 characters)' 
      });
    }

    const submission_id = uuidv4();
    const session_id = user_session_id || req.ip || 'anonymous';

    await db.query(`
      INSERT INTO user_submissions (
        submission_id, user_session_id, submission_type, 
        submitted_text, context_description, category
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [submission_id, session_id, submission_type, submitted_text, context_description, category]);

    // Get the inserted submission (SQLite compatible)
    const result = await db.query(`
      SELECT * FROM user_submissions WHERE submission_id = $1
    `, [submission_id]);

    const submission = result.rows[0];

    res.status(201).json({
      success: true,
      submission: {
        id: submission.submission_id,
        type: submission.submission_type,
        text: submission.submitted_text,
        status: submission.submission_status,
        created_at: submission.created_at
      },
      message: 'Thanks for contributing to Ellens\' personality! Your submission will be reviewed.'
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    return res.status(500).json({ error: 'Failed to submit content' });
  }
});

// Get submissions for public viewing (with pagination)
router.get('/public', async (req, res): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    const status = req.query.status as string || 'approved';

    const result = await db.query(`
      SELECT 
        submission_id, submission_type, submitted_text, 
        context_description, category, upvotes, downvotes,
        quality_score, times_used, created_at, is_featured
      FROM user_submissions 
      WHERE submission_status = $1 AND NOT is_offensive
      ORDER BY 
        CASE WHEN is_featured THEN 0 ELSE 1 END,
        quality_score DESC NULLS LAST,
        upvotes DESC,
        created_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as total 
      FROM user_submissions 
      WHERE submission_status = $1 AND NOT is_offensive
    `, [status]);

    const total = parseInt(countResult.rows[0].total);
    const hasMore = offset + limit < total;

    const response: SubmissionListResponse = {
      submissions: result.rows,
      total,
      page,
      limit,
      hasMore
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching public submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Vote on submissions
router.post('/:submissionId/vote', async (req, res): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { vote_type }: VoteSubmissionRequest = req.body;
    const user_session_id = req.body.user_session_id || req.ip || 'anonymous';

    if (!['up', 'down', 'report'].includes(vote_type)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Check if user already voted
    const existingVote = await db.query(`
      SELECT vote_type FROM submission_votes 
      WHERE submission_id = (
        SELECT id FROM user_submissions WHERE submission_id = $1
      ) AND user_session_id = $2
    `, [submissionId, user_session_id]);

    if (existingVote.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You have already voted on this submission',
        existing_vote: existingVote.rows[0].vote_type
      });
    }

    // Insert vote
    await db.query(`
      INSERT INTO submission_votes (submission_id, user_session_id, vote_type)
      SELECT id, $2, $3 FROM user_submissions WHERE submission_id = $1
    `, [submissionId, user_session_id, vote_type]);

    // Update vote counts on submission
    if (vote_type === 'up') {
      await db.query(`
        UPDATE user_submissions 
        SET upvotes = upvotes + 1 
        WHERE submission_id = $1
      `, [submissionId]);
    } else if (vote_type === 'down') {
      await db.query(`
        UPDATE user_submissions 
        SET downvotes = downvotes + 1 
        WHERE submission_id = $1
      `, [submissionId]);
    } else if (vote_type === 'report') {
      await db.query(`
        UPDATE user_submissions 
        SET auto_flagged = true, flag_reason = 'Reported by community'
        WHERE submission_id = $1 AND submission_status = 'approved'
      `, [submissionId]);
    }

    // Recalculate quality score
    await db.query(`
      UPDATE user_submissions 
      SET quality_score = calculate_submission_quality_score(id)
      WHERE submission_id = $1
    `, [submissionId]);

    res.json({ 
      success: true, 
      message: `Vote recorded: ${vote_type}` 
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Admin endpoints
router.get('/admin/pending', async (req, res): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT * FROM user_submissions 
      WHERE submission_status IN ('pending', 'flagged')
      ORDER BY 
        CASE WHEN submission_status = 'flagged' THEN 0 ELSE 1 END,
        created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as total 
      FROM user_submissions 
      WHERE submission_status IN ('pending', 'flagged')
    `);

    const total = parseInt(countResult.rows[0].total);
    const hasMore = offset + limit < total;

    const response: SubmissionListResponse = {
      submissions: result.rows,
      total,
      page,
      limit,
      hasMore
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
});

// Admin review submission
router.post('/admin/:submissionId/review', async (req, res): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { action, reason, admin_notes }: ReviewSubmissionRequest = req.body;
    const admin_session_id = req.body.admin_session_id || 'admin-' + req.ip;

    if (!['approve', 'reject', 'flag', 'unflag', 'feature', 'unfeature'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get current submission
    const currentSubmission = await db.query(`
      SELECT * FROM user_submissions WHERE submission_id = $1
    `, [submissionId]);

    if (currentSubmission.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = currentSubmission.rows[0];
    const previous_status = submission.submission_status;
    let new_status = previous_status;

    // Determine new status based on action
    switch (action) {
      case 'approve':
        new_status = 'approved';
        break;
      case 'reject':
        new_status = 'rejected';
        break;
      case 'flag':
        new_status = 'flagged';
        break;
      case 'unflag':
        new_status = 'pending';
        break;
      case 'feature':
        new_status = 'approved'; // featured content must be approved
        break;
      case 'unfeature':
        new_status = 'approved'; // stay approved, just not featured
        break;
    }

    // Update submission
    await db.query(`
      UPDATE user_submissions 
      SET 
        submission_status = $1,
        admin_notes = COALESCE($2, admin_notes),
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP,
        is_featured = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE submission_id = $5
    `, [
      new_status, 
      admin_notes, 
      admin_session_id,
      action === 'feature' ? 1 : (action === 'unfeature' ? 0 : submission.is_featured),
      submissionId
    ]);

    // Log admin action
    await db.query(`
      INSERT INTO submission_reviews (
        submission_id, admin_session_id, action, reason, 
        previous_status, new_status
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [submission.id, admin_session_id, action, reason, previous_status, new_status]);

    // If approved, add to approved_content table
    if (action === 'approve') {
      await db.query(`
        INSERT INTO approved_content (
          submission_id, content_type, response_text, 
          trigger_keywords, mood_requirement, weight
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        submission.id,
        submission.submission_type,
        submission.submitted_text,
        [submission.category || submission.submission_type], // basic keyword array
        submission.category,
        submission.quality_score || 1.0
      ]);
    }

    res.json({
      success: true,
      action,
      previous_status,
      new_status,
      message: `Submission ${action}d successfully`
    });

  } catch (error) {
    console.error('Error reviewing submission:', error);
    return res.status(500).json({ error: 'Failed to review submission' });
  }
});

// Admin dashboard stats
router.get('/admin/stats', async (req, res): Promise<void> => {
  try {
    // Get basic counts
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE submission_status = 'pending') as total_pending,
        COUNT(*) FILTER (WHERE submission_status = 'flagged') as total_flagged,
        COUNT(*) FILTER (WHERE submission_status = 'approved' AND DATE(reviewed_at) = CURRENT_DATE) as total_approved_today,
        COUNT(*) FILTER (WHERE submission_status = 'rejected' AND DATE(reviewed_at) = CURRENT_DATE) as total_rejected_today,
        AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600.0) FILTER (WHERE reviewed_at IS NOT NULL AND DATE(reviewed_at) = CURRENT_DATE) as avg_review_time_hours
      FROM user_submissions
    `);

    // Get most active category
    const categoryResult = await db.query(`
      SELECT submission_type, COUNT(*) as count
      FROM user_submissions 
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY submission_type
      ORDER BY count DESC
      LIMIT 1
    `);

    // Get top contributors
    const contributorsResult = await db.query(`
      SELECT 
        user_session_id,
        COUNT(*) as submission_count,
        ROUND(
          COUNT(*) FILTER (WHERE submission_status = 'approved')::FLOAT / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        ) as approval_rate
      FROM user_submissions 
      WHERE user_session_id IS NOT NULL
        AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY user_session_id
      HAVING COUNT(*) >= 3
      ORDER BY approval_rate DESC, submission_count DESC
      LIMIT 5
    `);

    const stats: AdminDashboardStats = {
      total_pending: parseInt(statsResult.rows[0].total_pending) || 0,
      total_flagged: parseInt(statsResult.rows[0].total_flagged) || 0,
      total_approved_today: parseInt(statsResult.rows[0].total_approved_today) || 0,
      total_rejected_today: parseInt(statsResult.rows[0].total_rejected_today) || 0,
      avg_review_time_hours: parseFloat(statsResult.rows[0].avg_review_time_hours) || 0,
      most_active_category: categoryResult.rows[0]?.submission_type || 'none',
      community_engagement_score: await calculateCommunityEngagement(),
      top_contributors: contributorsResult.rows.map(row => ({
        session_id: row.user_session_id.substring(0, 8) + '...', // anonymize
        submission_count: parseInt(row.submission_count),
        approval_rate: parseFloat(row.approval_rate)
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get approved content for personality engine
router.get('/approved-content', async (req, res): Promise<void> => {
  try {
    const mood = req.query.mood as string;
    const chaos_level = parseInt(req.query.chaos_level as string) || 50;

    let query = `
      SELECT ac.*, us.submitted_text, us.context_description
      FROM approved_content ac
      JOIN user_submissions us ON ac.submission_id = us.id
      WHERE ac.is_active = true
        AND ac.chaos_level_min <= $1 
        AND ac.chaos_level_max >= $1
    `;
    
    const params: (number | string)[] = [chaos_level];

    if (mood) {
      query += ` AND (ac.mood_requirement IS NULL OR ac.mood_requirement = $2)`;
      params.push(mood);
    }

    query += ` ORDER BY ac.weight DESC, RANDOM()`;

    const result = await db.query(query, params);

    res.json({
      content: result.rows,
      chaos_level,
      mood: mood || 'any'
    });

  } catch (error) {
    console.error('Error fetching approved content:', error);
    return res.status(500).json({ error: 'Failed to fetch approved content' });
  }
});

export default router;