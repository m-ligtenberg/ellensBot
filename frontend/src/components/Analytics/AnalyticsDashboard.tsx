import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  overview: {
    activeConversations: number;
    totalMessages: number;
    avgConversationDepth: number;
    avgChaosLevel: number;
    uptime: number;
  };
  personality: {
    moodDistribution: Record<string, number>;
    chaosDistribution: Record<number, number>;
    drugAnalysis: {
      totalDrugMentions: number;
      totalDenials: number;
      denialSuccessRate: string;
    };
    topicAnalysis: {
      mostDiscussed: string[];
      totalUniqueTopics: number;
    };
  };
  performance: {
    totalResponses: number;
    avgEffectiveness: number;
    highQuality: number;
    qualityPercentage: number;
  };
  realtime: {
    timestamp: string;
    activeUsers: number;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics B-Negar 😅');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
          Young Ellens Analytics Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Real-time insights into personality performance B-Negar! 📊
        </p>
        <div className="text-sm text-gray-500 mt-1">
          Last updated: {new Date(analytics.realtime.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-green-400 text-sm font-semibold mb-2">ACTIVE CONVERSATIONS</h3>
          <div className="text-3xl font-bold">{analytics.overview.activeConversations}</div>
          <div className="text-gray-500 text-sm">{analytics.realtime.activeUsers} users online</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-yellow-400 text-sm font-semibold mb-2">TOTAL MESSAGES</h3>
          <div className="text-3xl font-bold">{analytics.overview.totalMessages}</div>
          <div className="text-gray-500 text-sm">Avg {analytics.overview.avgConversationDepth} per convo</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-red-400 text-sm font-semibold mb-2">CHAOS LEVEL</h3>
          <div className="text-3xl font-bold">{analytics.overview.avgChaosLevel}%</div>
          <div className="text-gray-500 text-sm">Average across all</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-blue-400 text-sm font-semibold mb-2">UPTIME</h3>
          <div className="text-3xl font-bold">{formatUptime(analytics.overview.uptime)}</div>
          <div className="text-gray-500 text-sm">Server online</div>
        </div>
      </div>

      {/* Drug Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-red-400 text-xl font-bold mb-4">🚫 Drug Denial Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Drug Mentions</span>
              <span className="text-2xl font-bold text-red-400">
                {analytics.personality.drugAnalysis.totalDrugMentions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Denials</span>
              <span className="text-2xl font-bold text-green-400">
                {analytics.personality.drugAnalysis.totalDenials}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-gray-300">Denial Success Rate</span>
              <span className="text-2xl font-bold text-yellow-400">
                {analytics.personality.drugAnalysis.denialSuccessRate}%
              </span>
            </div>
            <div className="text-sm text-gray-500 italic">
              "Alleen me wietje en me henny!" - consistency is key OWO
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-green-400 text-xl font-bold mb-4">🎭 Mood Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.personality.moodDistribution).map(([mood, count]) => (
              <div key={mood} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${
                    mood === 'chill' ? 'bg-blue-400' :
                    mood === 'chaotic' ? 'bg-red-400' :
                    mood === 'done' ? 'bg-yellow-400' : 'bg-purple-400'
                  }`}></span>
                  <span className="capitalize text-gray-300">{mood}</span>
                </div>
                <span className="text-xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-purple-400 text-xl font-bold mb-4">📈 Response Quality</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {analytics.performance.qualityPercentage}%
            </div>
            <div className="text-gray-400 text-sm">High Quality Responses</div>
            <div className="text-gray-500 text-xs mt-2">
              {analytics.performance.highQuality} / {analytics.performance.totalResponses} responses
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-cyan-400 text-xl font-bold mb-4">💬 Popular Topics</h3>
          <div className="space-y-2">
            {analytics.personality.topicAnalysis.mostDiscussed.slice(0, 5).map((topic, index) => (
              <div key={topic} className="flex items-center justify-between">
                <span className="text-gray-300">#{index + 1} {topic}</span>
                <span className="text-xs bg-cyan-600 px-2 py-1 rounded">HOT</span>
              </div>
            ))}
          </div>
          <div className="text-gray-500 text-xs mt-3">
            {analytics.personality.topicAnalysis.totalUniqueTopics} unique topics discussed
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-orange-400 text-xl font-bold mb-4">⚡ Chaos Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analytics.personality.chaosDistribution)
              .sort(([a], [b]) => Number(b) - Number(a))
              .slice(0, 5)
              .map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-gray-300">{level}% - {Number(level) + 20}%</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-orange-400 h-2 rounded-full" 
                        style={{ width: `${Math.min(count * 20, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-6">
        <p>Young Ellens Analytics Dashboard - "Alleen me analytics en me data!" B-Negar 📊</p>
        <p className="mt-1">Real-time insights into Rotterdam's finest rapper AI OWO</p>
      </div>
    </div>
  );
}