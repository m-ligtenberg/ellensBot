import React, { useState, useEffect } from 'react';
import { serverlessApi } from '../../utils/serverlessApi';

interface DashboardStats {
  submissionTrends: {
    thisWeek: number;
    lastWeek: number;
    growth: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  userEngagement: {
    averageSessionLength: number;
    messagePerSession: number;
    returnRate: number;
  };
  contentQuality: {
    averageQualityScore: string;
    approvalRate: number;
    communityRating: string;
  };
  systemHealth: {
    uptime: number;
    averageResponseTime: number;
    apiErrors: number;
    status: string;
  };
}

interface SubmissionStats {
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

const ServerlessAdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardStats | null>(null);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats | null>(null);
  const [scraperStatus, setScraperStatus] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, submissionsData, scraperData, healthData] = await Promise.all([
        serverlessApi.admin.getAnalytics(),
        serverlessApi.submissions.getStats(),
        serverlessApi.admin.scraper.getStatus(),
        serverlessApi.admin.getHealth()
      ]);

      setAnalytics(analyticsData);
      setSubmissionStats(submissionsData);
      setScraperStatus(scraperData);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !analytics || !submissionStats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-yellow-500 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">🎤 Young Ellens Admin Dashboard</h1>
        <p className="mt-2 opacity-90">Serverless deployment powered by Vercel & GitHub Pages</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
            {systemHealth?.status || 'Healthy'}
          </span>
          <span>Uptime: {systemHealth?.uptime ? Math.floor(systemHealth.uptime / 3600) : 0}h</span>
          <span>Version: {systemHealth?.version || '2.0.0-serverless'}</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{submissionStats.total_pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-gray-900">{submissionStats.total_approved_today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🧠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quality Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.contentQuality.averageQualityScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🕷️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scraper Status</p>
              <p className="text-sm font-bold text-gray-900">
                {scraperStatus?.isRunning ? 'Running' : 'Idle'}
              </p>
              {scraperStatus?.progress && (
                <p className="text-xs text-gray-500">{scraperStatus.progress}% complete</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Categories */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Content Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.topCategories.map((category, index) => (
            <div key={category.category} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">
                {category.category === 'denial' ? '🚫' : 
                 category.category === 'phrase' ? '💬' : 
                 category.category === 'interruption' ? '⚡' : '🎯'}
              </div>
              <p className="text-sm font-medium text-gray-600 capitalize">{category.category}</p>
              <p className="text-xl font-bold text-gray-900">{category.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Engagement & System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 User Engagement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Session</span>
              <span className="font-semibold">{Math.floor(analytics.userEngagement.averageSessionLength / 60)}m {analytics.userEngagement.averageSessionLength % 60}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Messages per Session</span>
              <span className="font-semibold">{analytics.userEngagement.messagePerSession}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Return Rate</span>
              <span className="font-semibold">{analytics.userEngagement.returnRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Community Rating</span>
              <span className="font-semibold">⭐ {analytics.contentQuality.communityRating}/5.0</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ System Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Response Time</span>
              <span className="font-semibold">{analytics.systemHealth.averageResponseTime}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Uptime</span>
              <span className="font-semibold">{analytics.systemHealth.uptime}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Errors (24h)</span>
              <span className="font-semibold">{analytics.systemHealth.apiErrors}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span className={`font-semibold px-2 py-1 rounded text-xs ${
                analytics.systemHealth.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {analytics.systemHealth.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Trends */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Submission Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{analytics.submissionTrends.thisWeek}</p>
            <p className="text-sm text-gray-600">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-400">{analytics.submissionTrends.lastWeek}</p>
            <p className="text-sm text-gray-600">Last Week</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${analytics.submissionTrends.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.submissionTrends.growth >= 0 ? '+' : ''}{analytics.submissionTrends.growth}%
            </p>
            <p className="text-sm text-gray-600">Growth</p>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      {submissionStats.top_contributors.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Contributors</h3>
          <div className="space-y-3">
            {submissionStats.top_contributors.map((contributor, index) => (
              <div key={contributor.session_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-3">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎖️'}
                  </span>
                  <div>
                    <p className="font-medium">{contributor.session_id}</p>
                    <p className="text-sm text-gray-600">{contributor.submission_count} submissions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{contributor.approval_rate}%</p>
                  <p className="text-xs text-gray-500">approval rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          🔄 Refresh Dashboard
        </button>
      </div>
    </div>
  );
};

export default ServerlessAdminDashboard;