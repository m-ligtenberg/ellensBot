import React, { useState, useEffect } from 'react';

interface DiscoveredSource {
  url: string;
  domain: string;
  title: string;
  description: string;
  contentType: 'lyrics' | 'video' | 'news' | 'interview' | 'social_media' | 'other';
  relevanceScore: number;
  discoveredAt: string;
  discoveryMethod: string;
  confidence: number;
}

interface DiscoveryStats {
  isScanning: boolean;
  totalSourcesDiscovered: number;
  averageRelevanceScore: number;
  contentTypeDistribution: Record<string, number>;
  topDomains: Array<{ domain: string; count: number }>;
  searchPatterns: number;
}

interface MLInsights {
  discoveryEffectiveness: {
    totalSources: number;
    highQualitySources: number;
    averageQuality: number;
    recommendation: string;
  };
  contentTypeInsights: {
    distribution: Record<string, number>;
    recommendation: string;
  };
  topPerformingDomains: {
    domains: Array<{ domain: string; count: number }>;
    recommendation: string;
  };
  nextActions: string[];
}

const MLDiscoveryPanel: React.FC = () => {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [sources, setSources] = useState<DiscoveredSource[]>([]);
  const [insights, setInsights] = useState<MLInsights | null>(null);
  const [testTerm, setTestTerm] = useState('');
  const [testResults, setTestResults] = useState<DiscoveredSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [selectedRelevanceFilter, setSelectedRelevanceFilter] = useState(0);

  useEffect(() => {
    loadStats();
    loadSources();
    loadInsights();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats();
      loadSources();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/scraper/ml/discovery/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load ML discovery stats:', error);
    }
  };

  const loadSources = async () => {
    try {
      const response = await fetch(`/api/scraper/ml/discovery/sources?limit=50&minRelevance=${selectedRelevanceFilter}`);
      const data = await response.json();
      if (data.success) {
        setSources(data.data.sources);
      }
    } catch (error) {
      console.error('Failed to load discovered sources:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/scraper/ml/discovery/insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Failed to load ML insights:', error);
    }
  };

  const startDiscovery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scraper/ml/discovery/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes })
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        alert(`✅ ML Discovery started (${intervalMinutes} minute intervals)`);
      } else {
        alert('❌ Failed to start ML discovery');
      }
    } catch (error) {
      console.error('Failed to start discovery:', error);
      alert('❌ Error starting ML discovery');
    }
    setIsLoading(false);
  };

  const stopDiscovery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scraper/ml/discovery/stop', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        alert('⏹️ ML Discovery stopped');
      }
    } catch (error) {
      console.error('Failed to stop discovery:', error);
    }
    setIsLoading(false);
  };

  const testSearchTerm = async () => {
    if (!testTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/scraper/ml/discovery/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: testTerm })
      });
      const data = await response.json();
      if (data.success) {
        setTestResults(data.data.results);
      } else {
        alert('❌ Test search failed');
      }
    } catch (error) {
      console.error('Test search failed:', error);
      alert('❌ Error testing search term');
    }
    setIsLoading(false);
  };

  const convertToTargets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scraper/ml/discovery/convert-to-targets', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Converted ${data.data.addedTargets} sources to scraping targets!`);
        loadStats(); // Refresh stats
      } else {
        alert('❌ Failed to convert sources');
      }
    } catch (error) {
      console.error('Failed to convert sources:', error);
      alert('❌ Error converting sources');
    }
    setIsLoading(false);
  };

  const getContentTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      lyrics: 'bg-purple-100 text-purple-800',
      video: 'bg-red-100 text-red-800',
      news: 'bg-blue-100 text-blue-800',
      interview: 'bg-green-100 text-green-800',
      social_media: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.7) return 'text-green-600 font-semibold';
    if (score >= 0.5) return 'text-yellow-600 font-medium';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🤖 ML-Powered Source Discovery</h2>
        <p className="text-purple-100">
          Intelligent content discovery using machine learning to find new Young Ellens sources automatically
        </p>
      </div>

      {/* Discovery Control Panel */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          Discovery Control
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className={`font-semibold ${stats?.isScanning ? 'text-green-600' : 'text-gray-600'}`}>
              {stats?.isScanning ? '🟢 Scanning Active' : '⚪ Stopped'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Sources Found</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalSourcesDiscovered || 0}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Quality</div>
            <div className={`text-2xl font-bold ${getRelevanceColor(stats?.averageRelevanceScore || 0)}`}>
              {((stats?.averageRelevanceScore || 0) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Interval (minutes):</label>
            <input
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-20 px-2 py-1 border rounded"
              min="15"
              max="1440"
            />
          </div>
          
          <button
            onClick={startDiscovery}
            disabled={isLoading || stats?.isScanning}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <span>🚀</span>
            {stats?.isScanning ? 'Running' : 'Start Discovery'}
          </button>
          
          <button
            onClick={stopDiscovery}
            disabled={isLoading || !stats?.isScanning}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <span>⏹️</span>
            Stop Discovery
          </button>
          
          <button
            onClick={convertToTargets}
            disabled={isLoading || (stats?.totalSourcesDiscovered || 0) === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <span>🔄</span>
            Convert to Targets
          </button>
        </div>
      </div>

      {/* Test Search */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🧪</span>
          Test Search Discovery
        </h3>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={testTerm}
            onChange={(e) => setTestTerm(e.target.value)}
            placeholder="e.g., 'young ellens tekst', 'mr cocaine nieuws'"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && testSearchTerm()}
          />
          <button
            onClick={testSearchTerm}
            disabled={isLoading || !testTerm.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Search'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Found {testResults.length} results (avg relevance: {((testResults.reduce((sum, r) => sum + r.relevanceScore, 0) / testResults.length) * 100).toFixed(1)}%)
            </div>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getContentTypeColor(result.contentType)}`}>
                        {result.contentType}
                      </span>
                      <span className={`text-sm font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                        {(result.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{result.domain}</span>
                  </div>
                  <div className="font-medium text-sm mb-1 line-clamp-1">{result.title}</div>
                  <div className="text-xs text-gray-600 line-clamp-2">{result.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Discovered Sources */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">📊</span>
            Discovered Sources ({sources.length})
          </h3>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Min Relevance:</label>
            <select
              value={selectedRelevanceFilter}
              onChange={(e) => setSelectedRelevanceFilter(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={0}>All (0%+)</option>
              <option value={0.3}>Good (30%+)</option>
              <option value={0.5}>High (50%+)</option>
              <option value={0.7}>Excellent (70%+)</option>
            </select>
            <button
              onClick={loadSources}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {sources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <div>No sources discovered yet</div>
            <div className="text-sm">Start discovery to find new content sources</div>
          </div>
        ) : (
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {sources.map((source, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getContentTypeColor(source.contentType)}`}>
                      {source.contentType}
                    </span>
                    <span className={`font-semibold ${getRelevanceColor(source.relevanceScore)}`}>
                      {(source.relevanceScore * 100).toFixed(0)}%
                    </span>
                    <span className="text-sm text-gray-500">{source.domain}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(source.discoveredAt)}</span>
                </div>
                
                <div className="font-medium mb-2 line-clamp-1">{source.title}</div>
                <div className="text-sm text-gray-600 mb-3 line-clamp-2">{source.description}</div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 capitalize">
                    via {source.discoveryMethod.replace('_', ' ')}
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    Visit Source →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ML Insights */}
      {insights && (
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            ML Insights & Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Discovery Effectiveness</h4>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="text-sm text-gray-600 mb-1">
                  {insights.discoveryEffectiveness.totalSources} total sources, 
                  {insights.discoveryEffectiveness.highQualitySources} high quality
                </div>
                <div className="text-xs text-blue-600">{insights.discoveryEffectiveness.recommendation}</div>
              </div>
              
              <h4 className="font-medium mb-2">Content Distribution</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="space-y-1 mb-2">
                  {Object.entries(insights.contentTypeInsights.distribution).map(([type, count]) => (
                    <div key={type} className="text-sm flex justify-between">
                      <span className="capitalize">{type}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-blue-600">{insights.contentTypeInsights.recommendation}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Top Domains</h4>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="space-y-1 mb-2">
                  {insights.topPerformingDomains.domains.slice(0, 5).map((domain) => (
                    <div key={domain.domain} className="text-sm flex justify-between">
                      <span>{domain.domain}</span>
                      <span className="font-medium">{domain.count}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-blue-600">{insights.topPerformingDomains.recommendation}</div>
              </div>
              
              <h4 className="font-medium mb-2">Next Actions</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <ul className="text-sm space-y-1">
                  {insights.nextActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLDiscoveryPanel;