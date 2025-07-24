import React, { useState, useEffect } from 'react';

interface UserSubmission {
  id: number;
  submission_id: string;
  user_session_id: string;
  submission_type: 'phrase' | 'response' | 'denial' | 'interruption' | 'slang';
  submitted_text: string;
  context_description?: string;
  category?: string;
  submission_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  upvotes: number;
  downvotes: number;
  quality_score?: number;
  times_used: number;
  is_featured: boolean;
  is_offensive: boolean;
  auto_flagged: boolean;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}

interface AdminStats {
  total_pending: number;
  total_flagged: number;
  total_approved_today: number;
  total_rejected_today: number;
  avg_review_time_hours: number;
  most_active_category: string;
  community_engagement_score: number;
}

const SubmissionsPanel: React.FC = () => {
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<UserSubmission | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<'pending' | 'flagged' | 'all'>('pending');

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions/admin/pending');
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/submissions/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubmissions(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleReview = async (submissionId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      const response = await fetch(`/api/submissions/admin/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: reviewReason,
          admin_notes: adminNotes,
          admin_session_id: 'admin-panel'
        }),
      });

      if (response.ok) {
        // Refresh submissions list
        await fetchSubmissions();
        await fetchStats();
        setSelectedSubmission(null);
        setReviewReason('');
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Failed to review submission:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      denial: 'bg-red-100 text-red-800 border-red-200',
      phrase: 'bg-blue-100 text-blue-800 border-blue-200',
      interruption: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      slang: 'bg-green-100 text-green-800 border-green-200',
      response: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      flagged: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800">Pending Review</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.total_pending}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800">Flagged</h3>
            <p className="text-2xl font-bold text-red-900">{stats.total_flagged}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800">Approved Today</h3>
            <p className="text-2xl font-bold text-green-900">{stats.total_approved_today}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800">Active Category</h3>
            <p className="text-lg font-bold text-blue-900 capitalize">{stats.most_active_category}</p>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Content Submissions</h2>
          <p className="text-gray-400">Review community-submitted Ellens content</p>
        </div>

        <div className="divide-y divide-gray-700">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No submissions pending review
            </div>
          ) : (
            submissions.map((submission) => (
              <div key={submission.submission_id} className="p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(submission.submission_type)}`}>
                        {submission.submission_type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.submission_status)}`}>
                        {submission.submission_status}
                      </span>
                      {submission.auto_flagged && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Auto-flagged
                        </span>
                      )}
                    </div>
                    
                    <blockquote className="text-white text-lg mb-2 font-medium">
                      "{submission.submitted_text}"
                    </blockquote>
                    
                    {submission.context_description && (
                      <p className="text-gray-400 text-sm mb-2">
                        Context: {submission.context_description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Submitted: {new Date(submission.created_at).toLocaleDateString()}</span>
                      <span>👍 {submission.upvotes}</span>
                      <span>👎 {submission.downvotes}</span>
                      {submission.flag_reason && (
                        <span className="text-orange-400">⚠️ {submission.flag_reason}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Review Submission</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Submitted Content:</label>
                  <blockquote className="bg-gray-800 p-4 rounded border-l-4 border-green-400 text-white">
                    "{selectedSubmission.submitted_text}"
                  </blockquote>
                </div>
                
                {selectedSubmission.context_description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Context:</label>
                    <p className="text-gray-400">{selectedSubmission.context_description}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Review Reason:</label>
                  <textarea
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                    rows={3}
                    placeholder="Why are you approving/rejecting this submission?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes:</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                    rows={2}
                    placeholder="Internal notes about this submission..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReview(selectedSubmission.submission_id, 'approve')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleReview(selectedSubmission.submission_id, 'reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => handleReview(selectedSubmission.submission_id, 'flag')}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors font-medium"
                  >
                    🚩 Flag
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setReviewReason('');
                    setAdminNotes('');
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsPanel;