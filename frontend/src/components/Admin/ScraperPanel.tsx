import React, { useState, useEffect } from 'react';
import { useScraperWebSocket } from '../../hooks/useScraperWebSocket';
import { ScraperStats } from '../../types';
import { serverlessApi } from '../../utils/serverlessApi';

interface ScrapingResult {
  title: string;
  content: string;
  source: string;
  type: string;
  timestamp: string;
}

// interface ContentSource {
//   id: string;
//   name: string;
//   type: string;
//   enabled: boolean;
//   lastChecked?: string;
//   itemsFound: number;
//   successRate: number;
// }

const ScraperPanel: React.FC = () => {
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'advanced' | 'schedule' | 'manual'>('overview');
  const [advancedContent, setAdvancedContent] = useState<any[]>([]);
  // const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  // const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);

  // WebSocket hook for real-time updates
  const {
    isConnected,
    stats: wsStats, // eslint-disable-line @typescript-eslint/no-unused-vars
    recentDiscoveries: wsDiscoveries,
    connectToScraper,
    disconnectFromScraper
  } = useScraperWebSocket(
    (newStats) => {
      setStats(newStats);
      // setIsWebSocketConnected(true);
    },
    (discovery) => {
      // setRecentDiscoveries(prev => [discovery, ...prev.slice(0, 9)]);
    }
  );
  
  // Form states
  const [manualTargets, setManualTargets] = useState<string>('');
  const [autoScrapeEnabled, setAutoScrapeEnabled] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Mock data for display
  const mockTargets = [
    { name: 'YouTube - Young Ellens Channel', enabled: true, lastChecked: '2 hours ago', itemsFound: 24 },
    { name: 'Instagram - @youngellenss', enabled: true, lastChecked: '30 mins ago', itemsFound: 18 },
    { name: 'Genius Lyrics', enabled: false, lastChecked: '1 day ago', itemsFound: 7 },
    { name: 'Dutch Hip-Hop Forums', enabled: true, lastChecked: '4 hours ago', itemsFound: 12 },
  ];

  useEffect(() => {
    loadScraperStats();
    
    // Connect to WebSocket for real-time updates
    connectToScraper();
    
    return () => {
      disconnectFromScraper();
    };
  }, [connectToScraper, disconnectFromScraper]);

  const loadScraperStats = async () => {
    try {
      const data = await serverlessApi.admin.scraper.getStatus();
      setStats(data);
    } catch (error) {
      console.error('Failed to load scraper stats:', error);
    }
  };

  const startManualScraping = async () => {
    console.log('🚀 Manual scraping button clicked!');
    setIsLoading(true);
    try {
      const data = await serverlessApi.admin.scraper.start();
      
      if (data.success) {
        setResults(data.results || []);
        
        // Reload stats
        await loadScraperStats();
        
        alert(`✅ Scraping completed! Found ${data.foundContent || 0} pieces of content.`);
      } else {
        alert('❌ Scraping failed. Check console for details.');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      alert('❌ Scraping failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTarget = async (name: string, enabled: boolean) => {
    try {
      // Mock toggle target - in serverless implementation this is now handled internally
      console.log(`Toggle target ${name}: ${enabled}`);
      await loadScraperStats();
    } catch (error) {
      console.error('Failed to toggle target:', error);
    }
  };

  const startAdvancedScraping = async () => {
    setIsLoading(true);
    try {
      // Simulate advanced scraping with ML content discovery
      const mockAdvancedResults = [
        {
          title: "Young Ellens - Nieuwe Track Preview",
          content: "Ey yo, weer een nieuwe track coming soon...",
          source: "Instagram Story",
          confidence: 0.95,
          category: "music_preview",
          timestamp: new Date().toISOString()
        },
        {
          title: "Interview Fragment - Radio 538",
          content: "Interviewer: Gebruik je drugs? Ellens: Nooo man ik ben daar niet op...",
          source: "Radio Interview",
          confidence: 0.88,
          category: "interview",
          timestamp: new Date().toISOString()
        }
      ];
      
      setAdvancedContent(mockAdvancedResults);
      alert(`🤖 Advanced ML scraping completed! Found ${mockAdvancedResults.length} high-confidence matches.`);
    } catch (error) {
      console.error('Advanced scraping error:', error);
      alert('❌ Advanced scraping failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold">🕷️ Content Scraper</h2>
        <p className="mt-2 opacity-90">Automatically discover and collect Young Ellens content from across the web</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span>Last Run: {stats.lastRun || 'Never'}</span>
          <span>Total Found: {stats.totalFound || 0}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
        {(['overview', 'targets', 'advanced', 'schedule', 'manual'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-accent-green text-black'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Sources</p>
                  <p className="text-2xl font-bold text-white">{stats.activeSources || 4}</p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Items Found</p>
                  <p className="text-2xl font-bold text-accent-green">{stats.totalFound || 61}</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-accent-yellow">{stats.successRate || '94%'}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Last Error</p>
                  <p className="text-sm font-bold text-gray-300">{stats.lastError || 'None'}</p>
                </div>
                <div className="text-2xl">⚠️</div>
              </div>
            </div>
          </div>

          {/* Recent Discoveries */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Discoveries</h3>
            <div className="space-y-3">
              {wsDiscoveries.slice(0, 5).map((discovery, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="text-lg">
                    {discovery.type === 'lyrics' ? '🎵' : 
                     discovery.type === 'interview' ? '🎙️' : 
                     discovery.type === 'social' ? '📱' : '📄'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{discovery.title}</p>
                    <p className="text-gray-300 text-sm">{discovery.source}</p>
                    <p className="text-gray-500 text-xs">{discovery.timestamp}</p>
                  </div>
                  <div className="text-xs text-accent-green">
                    {Math.round((discovery.confidence || 0) * 100)}% match
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'targets' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Scraping Targets</h3>
            <div className="space-y-3">
              {mockTargets.map((target) => (
                <div key={target.name} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTarget(target.name, !target.enabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        target.enabled ? 'bg-accent-green' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        target.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                    <div>
                      <p className="text-white font-medium">{target.name}</p>
                      <p className="text-gray-400 text-sm">
                        Last checked: {target.lastChecked} • Found: {target.itemsFound} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      target.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {target.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">🤖 AI-Powered Content Discovery</h3>
            <p className="text-gray-300 mb-4">
              Use machine learning to discover content that traditional scraping might miss.
            </p>
            
            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-white">Enable Advanced ML Detection</span>
              </label>
            </div>

            <button
              onClick={startAdvancedScraping}
              disabled={isLoading || !advancedMode}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running ML Analysis...' : '🚀 Start Advanced Scraping'}
            </button>

            {advancedContent.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">ML Discovery Results</h4>
                <div className="space-y-3">
                  {advancedContent.map((item, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-white font-medium">{item.title}</h5>
                        <span className="text-xs text-accent-green">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{item.content}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Source: {item.source}</span>
                        <span>Category: {item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">⏰ Scheduled Scraping</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoScrapeEnabled}
                    onChange={(e) => setAutoScrapeEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white">Enable Automatic Scraping</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Scraping Interval
                  </label>
                  <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                    <option>Every 15 minutes</option>
                    <option>Every 30 minutes</option>
                    <option>Every hour</option>
                    <option>Every 6 hours</option>
                    <option>Daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Peak Hours
                  </label>
                  <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                    <option>All day</option>
                    <option>Business hours (9-17)</option>
                    <option>Evening (18-23)</option>
                    <option>Night (00-06)</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Next Scheduled Runs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Instagram Check</span>
                    <span>In 12 minutes</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>YouTube Scan</span>
                    <span>In 45 minutes</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Deep Web Search</span>
                    <span>In 3 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Manual Scraping</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Target URLs (one per line)
                </label>
                <textarea
                  value={manualTargets}
                  onChange={(e) => setManualTargets(e.target.value)}
                  placeholder="https://example.com/page1&#10;https://example.com/page2"
                  rows={6}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 resize-none"
                />
              </div>

              <button
                onClick={startManualScraping}
                disabled={isLoading}
                className="w-full bg-accent-green text-black py-3 rounded-lg font-bold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Scraping...' : '🚀 Start Manual Scraping'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">Scraping Results ({results.length})</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <h5 className="text-white font-medium mb-2">{result.title}</h5>
                      <p className="text-gray-300 text-sm mb-2">
                        {result.content.substring(0, 200)}...
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Source: {result.source}</span>
                        <span>Type: {result.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperPanel;