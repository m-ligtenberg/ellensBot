import React, { useState, useEffect } from 'react';
import { useScraperWebSocket } from '../../hooks/useScraperWebSocket';

interface ScrapingTarget {
  name: string;
  type: string;
  enabled: boolean;
  keywords: string[];
}

interface ScrapingResult {
  title: string;
  content: string;
  source: string;
  type: string;
  timestamp: string;
}

interface ScraperStats {
  totalTargets: number;
  enabledTargets: number;
  scrapedContent: number;
  isCurrentlyRunning: boolean;
  targets: ScrapingTarget[];
  advanced?: {
    isMonitoring: boolean;
    totalSources: number;
    enabledSources: number;
    activeSources: number;
    totalContentFound: number;
    highQualityContent: number;
    averageQualityScore: number;
    highQualityRate: number;
    sources: ContentSource[];
  };
}

interface ContentSource {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  lastChecked?: string;
  itemsFound: number;
  successRate: number;
}

const ScraperPanel: React.FC = () => {
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'advanced' | 'schedule' | 'manual'>('overview');
  const [advancedContent, setAdvancedContent] = useState<any[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);

  // WebSocket hook for real-time updates
  const {
    isConnected,
    stats: wsStats,
    recentDiscoveries: wsDiscoveries,
    connectToScraper,
    disconnectFromScraper
  } = useScraperWebSocket(
    (newStats) => {
      setStats(newStats as ScraperStats);
      setIsWebSocketConnected(true);
    },
    (discovery) => {
      setRecentDiscoveries(prev => [discovery, ...prev.slice(0, 9)]);
    }
  );
  
  // Form states
  const [newTarget, setNewTarget] = useState({
    name: '',
    baseUrl: '',
    type: 'lyrics' as const,
    keywords: 'young ellens'
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    schedule: '0 */6 * * *' // Every 6 hours
  });

  useEffect(() => {
    // Load initial stats via HTTP
    loadScraperStats();
    
    // Connect to WebSocket for real-time updates
    connectToScraper();
    
    return () => {
      disconnectFromScraper();
    };
  }, [connectToScraper, disconnectFromScraper]);

  const loadScraperStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scraper/status');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load scraper stats:', error);
    }
  };

  const startManualScraping = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/scraper/start', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.data.results || []);
        
        // Reload stats
        await loadScraperStats();
        
        alert(`✅ Scraping completed! Found ${data.data.foundContent} pieces of content.`);
      } else {
        alert('❌ Scraping failed. Check console for details.');
      }
    } catch (error) {
      console.error('Scraping failed:', error);
      alert('❌ Scraping failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTarget = async (name: string, enabled: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/scraper/targets/${encodeURIComponent(name)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await loadScraperStats();
      }
    } catch (error) {
      console.error('Failed to toggle target:', error);
    }
  };

  const addNewTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/scraper/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTarget,
          keywords: newTarget.keywords.split(',').map(k => k.trim()),
          selectors: {}
        }),
      });

      if (response.ok) {
        setNewTarget({
          name: '',
          baseUrl: '',
          type: 'lyrics',
          keywords: 'young ellens'
        });
        await loadScraperStats();
        alert('✅ Target added successfully!');
      }
    } catch (error) {
      console.error('Failed to add target:', error);
      alert('❌ Failed to add target');
    }
  };

  const scheduleAutomatedScraping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/scraper/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleForm),
      });

      if (response.ok) {
        alert('✅ Scheduled scraping successfully!');
        setScheduleForm({
          name: '',
          schedule: '0 */6 * * *'
        });
      }
    } catch (error) {
      console.error('Failed to schedule scraping:', error);
      alert('❌ Failed to schedule scraping');
    }
  };

  const scrapeSpecificPlatform = async (platform: 'youtube' | 'lyrics' | 'social') => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/scraper/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'young ellens' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.data.results || []);
        alert(`✅ ${platform} scraping completed!`);
      }
    } catch (error) {
      console.error(`${platform} scraping failed:`, error);
      alert(`❌ ${platform} scraping failed`);
    } finally {
      setIsLoading(false);
    }
  };

  // Advanced scraper functions
  const startAdvancedMonitoring = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scraper/advanced/start', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadScraperStats();
        alert('✅ Advanced monitoring started!');
      }
    } catch (error) {
      console.error('Failed to start advanced monitoring:', error);
      alert('❌ Failed to start advanced monitoring');
    }
  };

  const stopAdvancedMonitoring = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scraper/advanced/stop', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadScraperStats();
        alert('✅ Advanced monitoring stopped!');
      }
    } catch (error) {
      console.error('Failed to stop advanced monitoring:', error);
      alert('❌ Failed to stop advanced monitoring');
    }
  };

  const toggleContentSource = async (sourceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/scraper/advanced/sources/${sourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await loadScraperStats();
      }
    } catch (error) {
      console.error('Failed to toggle content source:', error);
    }
  };

  const loadAdvancedContent = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scraper/advanced/content?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAdvancedContent(data.data.content || []);
      }
    } catch (error) {
      console.error('Failed to load advanced content:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-accent-yellow">
              🕷️ Web Scraper & Content Crawler
            </h3>
            <p className="text-gray-300 mt-2">
              Automatically discover and collect Young Ellens content from across the web to enhance the chatbot's personality.
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 overflow-x-auto">
          {(['overview', 'targets', 'advanced', 'schedule', 'manual'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'advanced') loadAdvancedContent();
              }}
              className={`px-4 py-2 rounded font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-accent-green text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'overview' && '📊'} {tab === 'targets' && '🎯'} 
              {tab === 'advanced' && '🚀'} {tab === 'schedule' && '⏰'} {tab === 'manual' && '🔧'} {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-4">
            {/* Basic Stats Row */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-sm font-semibold text-gray-400">Total Targets</h4>
                <p className="text-2xl font-bold text-white">{stats.totalTargets}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-sm font-semibold text-gray-400">Active Targets</h4>
                <p className="text-2xl font-bold text-green-400">{stats.enabledTargets}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-sm font-semibold text-gray-400">Content Found</h4>
                <p className="text-2xl font-bold text-blue-400">{stats.scrapedContent}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-sm font-semibold text-gray-400">Status</h4>
                <p className={`text-sm font-bold ${stats.isCurrentlyRunning ? 'text-yellow-400' : 'text-green-400'}`}>
                  {stats.isCurrentlyRunning ? '🔄 Running' : '✅ Ready'}
                </p>
              </div>
            </div>

            {/* Advanced Stats Row */}
            {stats.advanced && (
              <div>
                <h4 className="text-lg font-semibold text-accent-yellow mb-3">🚀 Advanced Monitoring</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-purple-900 p-4 rounded">
                    <h4 className="text-sm font-semibold text-purple-300">Content Sources</h4>
                    <p className="text-2xl font-bold text-white">{stats.advanced.totalSources}</p>
                    <p className="text-xs text-purple-300">{stats.advanced.enabledSources} enabled</p>
                  </div>
                  <div className="bg-indigo-900 p-4 rounded">
                    <h4 className="text-sm font-semibold text-indigo-300">Quality Content</h4>
                    <p className="text-2xl font-bold text-white">{stats.advanced.highQualityContent}</p>
                    <p className="text-xs text-indigo-300">{stats.advanced.highQualityRate}% high quality</p>
                  </div>
                  <div className="bg-teal-900 p-4 rounded">
                    <h4 className="text-sm font-semibold text-teal-300">Avg Quality Score</h4>
                    <p className="text-2xl font-bold text-white">{stats.advanced.averageQualityScore}</p>
                    <p className="text-xs text-teal-300">out of 100</p>
                  </div>
                  <div className="bg-emerald-900 p-4 rounded">
                    <h4 className="text-sm font-semibold text-emerald-300">Monitor Status</h4>
                    <p className={`text-sm font-bold ${stats.advanced.isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
                      {stats.advanced.isMonitoring ? '🔄 Active' : '⏸️ Inactive'}
                    </p>
                    <p className="text-xs text-emerald-300">{stats.advanced.activeSources} active sources</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-white mb-3">Quick Actions</h4>
              <div className="space-y-3">
                {/* Basic Scraping */}
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Basic Scraping</h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={startManualScraping}
                      disabled={isLoading || stats.isCurrentlyRunning}
                      className="bg-accent-green text-black px-3 py-2 rounded font-bold hover:bg-green-400 disabled:opacity-50 text-sm"
                    >
                      {isLoading ? '🔄 Scraping...' : '🚀 Full Scrape'}
                    </button>
                    
                    <button
                      onClick={() => scrapeSpecificPlatform('youtube')}
                      disabled={isLoading}
                      className="bg-red-600 text-white px-3 py-2 rounded font-bold hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      📺 YouTube
                    </button>
                    
                    <button
                      onClick={() => scrapeSpecificPlatform('lyrics')}
                      disabled={isLoading}
                      className="bg-purple-600 text-white px-3 py-2 rounded font-bold hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      🎵 Lyrics
                    </button>
                    
                    <button
                      onClick={() => scrapeSpecificPlatform('social')}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-3 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      📱 Social
                    </button>
                  </div>
                </div>
                
                {/* Advanced Monitoring */}
                {stats.advanced && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Advanced Monitoring</h5>
                    <div className="flex flex-wrap gap-2">
                      {!stats.advanced.isMonitoring ? (
                        <button
                          onClick={startAdvancedMonitoring}
                          className="bg-purple-600 text-white px-3 py-2 rounded font-bold hover:bg-purple-700 text-sm"
                        >
                          🚀 Start Advanced Monitor
                        </button>
                      ) : (
                        <button
                          onClick={stopAdvancedMonitoring}
                          className="bg-orange-600 text-white px-3 py-2 rounded font-bold hover:bg-orange-700 text-sm"
                        >
                          ⏸️ Stop Advanced Monitor
                        </button>
                      )}
                      
                      <button
                        onClick={loadAdvancedContent}
                        className="bg-indigo-600 text-white px-3 py-2 rounded font-bold hover:bg-indigo-700 text-sm"
                      >
                        📊 View Discovered Content
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Content Discoveries */}
            {recentDiscoveries.length > 0 && (
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-semibold text-white mb-3">🎯 Recent Discoveries ({recentDiscoveries.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentDiscoveries.slice(0, 5).map((discovery: any, index: number) => (
                    <div key={index} className="bg-gray-600 p-3 rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-white">{discovery.sourceName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(discovery.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        Found {discovery.contentCount} items • {discovery.totalQualityContent} high quality
                      </p>
                      {discovery.content.slice(0, 2).map((item: any, i: number) => (
                        <div key={i} className="bg-gray-800 p-2 rounded mb-1 last:mb-0">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white truncate flex-1">{item.title}</span>
                            <div className="flex items-center space-x-1 ml-2">
                              <span className="text-xs bg-purple-600 text-white px-1 py-0.5 rounded">
                                {item.qualityScore}
                              </span>
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                item.sentiment === 'positive' ? 'bg-green-600 text-white' :
                                item.sentiment === 'negative' ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-gray-300'
                              }`}>
                                {item.sentiment}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && stats && (
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Scraping Targets</h4>
            
            {stats.targets.map((target, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded flex justify-between items-center">
                <div>
                  <h5 className="font-semibold text-white">{target.name}</h5>
                  <p className="text-sm text-gray-400">
                    {target.type} • Keywords: {target.keywords.join(', ')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    target.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {target.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => toggleTarget(target.name, !target.enabled)}
                    className="bg-accent-yellow text-black px-2 py-1 rounded text-xs font-bold hover:bg-yellow-300"
                  >
                    Toggle
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Target Form */}
            <form onSubmit={addNewTarget} className="bg-gray-700 p-4 rounded space-y-3">
              <h5 className="font-semibold text-white">Add New Target</h5>
              
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Target Name"
                  value={newTarget.name}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                  required
                />
                
                <input
                  type="url"
                  placeholder="Base URL"
                  value={newTarget.baseUrl}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                  required
                />
                
                <select
                  value={newTarget.type}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, type: e.target.value as any }))}
                  className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                >
                  <option value="lyrics">🎵 Lyrics</option>
                  <option value="interview">🎙️ Interview</option>
                  <option value="news">📰 News</option>
                  <option value="video">📺 Video</option>
                  <option value="social_media">📱 Social Media</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Keywords (comma separated)"
                  value={newTarget.keywords}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, keywords: e.target.value }))}
                  className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                />
              </div>
              
              <button
                type="submit"
                className="bg-accent-green text-black px-4 py-2 rounded font-bold hover:bg-green-400"
              >
                Add Target
              </button>
            </form>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && stats && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-white">🚀 Advanced Content Discovery</h4>
              {stats.advanced && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  stats.advanced.isMonitoring ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {stats.advanced.isMonitoring ? '🔄 Active' : '⏸️ Inactive'}
                </span>
              )}
            </div>
            
            {stats.advanced ? (
              <div className="space-y-4">
                {/* Content Sources */}
                <div className="bg-gray-700 p-4 rounded">
                  <h5 className="font-semibold text-white mb-3">📡 Content Sources ({stats.advanced.sources?.length || 0})</h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.advanced.sources?.map((source: any, index: number) => (
                      <div key={index} className="bg-gray-600 p-3 rounded flex justify-between items-center">
                        <div className="flex-1">
                          <h6 className="font-medium text-white text-sm">{source.name}</h6>
                          <p className="text-xs text-gray-300">
                            {source.type} • {source.itemsFound} items • {source.successRate}% success rate
                          </p>
                          {source.lastChecked && (
                            <p className="text-xs text-gray-400">
                              Last: {new Date(source.lastChecked).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            source.enabled ? 'bg-green-600 text-white' : 'bg-gray-500 text-gray-300'
                          }`}>
                            {source.enabled ? 'ON' : 'OFF'}
                          </span>
                          <button
                            onClick={() => toggleContentSource(source.id, !source.enabled)}
                            className="bg-accent-yellow text-black px-2 py-1 rounded text-xs font-bold hover:bg-yellow-300"
                          >
                            Toggle
                          </button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-400 text-center py-4">No content sources configured</p>
                    )}
                  </div>
                </div>

                {/* Discovered Content */}
                <div className="bg-gray-700 p-4 rounded">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-semibold text-white">🎯 High-Quality Discovered Content</h5>
                    <button
                      onClick={loadAdvancedContent}
                      className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-indigo-700"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {advancedContent.length > 0 ? (
                      advancedContent.slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="bg-gray-600 p-3 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h6 className="font-medium text-white text-sm line-clamp-1">{item.title}</h6>
                              <p className="text-xs text-gray-300 mb-1">
                                Source: {item.source} • Language: {item.language || 'unknown'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                                {item.qualityScore?.overallScore || 0}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                item.sentiment === 'positive' ? 'bg-green-600 text-white' :
                                item.sentiment === 'negative' ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-gray-300'
                              }`}>
                                {item.sentiment || 'neutral'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                            {item.content?.substring(0, 120)}...
                          </p>
                          
                          {item.extractedEntities && (
                            <div className="flex flex-wrap gap-1 text-xs">
                              {item.extractedEntities.people?.slice(0, 3).map((person: string, i: number) => (
                                <span key={i} className="bg-blue-700 text-blue-200 px-1 py-0.5 rounded">👤 {person}</span>
                              ))}
                              {item.extractedEntities.places?.slice(0, 2).map((place: string, i: number) => (
                                <span key={i} className="bg-green-700 text-green-200 px-1 py-0.5 rounded">📍 {place}</span>
                              ))}
                              {item.extractedEntities.musicTerms?.slice(0, 2).map((term: string, i: number) => (
                                <span key={i} className="bg-purple-700 text-purple-200 px-1 py-0.5 rounded">🎵 {term}</span>
                              ))}
                            </div>
                          )}
                          
                          {item.qualityScore?.reasons && (
                            <div className="mt-2 text-xs text-gray-400">
                              Quality: {item.qualityScore.reasons.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-400">No high-quality content discovered yet.</p>
                        <button
                          onClick={startAdvancedMonitoring}
                          className="mt-2 bg-purple-600 text-white px-3 py-2 rounded font-bold hover:bg-purple-700 text-sm"
                        >
                          Start Advanced Monitoring
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-700 rounded">
                <p className="text-gray-400 mb-4">Advanced scraping features are not yet initialized.</p>
                <p className="text-sm text-gray-500">
                  Advanced features include RSS monitoring, API integrations, content quality scoring, and real-time discovery.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Automated Scraping</h4>
            
            <form onSubmit={scheduleAutomatedScraping} className="bg-gray-700 p-4 rounded space-y-3">
              <h5 className="font-semibold text-white">Schedule New Job</h5>
              
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Job Name"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                  required
                />
                
                <select
                  value={scheduleForm.schedule}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule: e.target.value }))}
                  className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                >
                  <option value="0 */6 * * *">Every 6 hours</option>
                  <option value="0 */12 * * *">Every 12 hours</option>
                  <option value="0 0 * * *">Daily</option>
                  <option value="0 0 * * 0">Weekly</option>
                  <option value="0 0 1 * *">Monthly</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="bg-accent-yellow text-black px-4 py-2 rounded font-bold hover:bg-yellow-300"
              >
                Schedule Job
              </button>
            </form>

            <div className="bg-gray-700 p-4 rounded">
              <p className="text-sm text-gray-400">
                💡 Tip: Automated scraping will run in the background and automatically upload found content to the learning system.
              </p>
            </div>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Manual Operations</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <h5 className="font-semibold text-white mb-2">Platform-Specific Scraping</h5>
                <div className="space-y-2">
                  <button
                    onClick={() => scrapeSpecificPlatform('youtube')}
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    📺 Scrape YouTube
                  </button>
                  <button
                    onClick={() => scrapeSpecificPlatform('lyrics')}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    🎵 Scrape Lyrics Sites
                  </button>
                  <button
                    onClick={() => scrapeSpecificPlatform('social')}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    📱 Scrape Social Media
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded">
                <h5 className="font-semibold text-white mb-2">System Actions</h5>
                <div className="space-y-2">
                  <button
                    onClick={loadScraperStats}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    🔄 Refresh Stats
                  </button>
                  <button
                    onClick={startManualScraping}
                    disabled={isLoading}
                    className="w-full bg-accent-green text-black px-4 py-2 rounded font-bold hover:bg-green-400 disabled:opacity-50"
                  >
                    {isLoading ? '🔄 Running...' : '🚀 Full Scrape'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results.length > 0 && (
          <div className="mt-6 bg-gray-700 p-4 rounded">
            <h4 className="font-semibold text-white mb-3">Latest Results ({results.length})</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-600 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-white text-sm">{result.title}</h5>
                    <span className="text-xs text-gray-400 bg-gray-500 px-2 py-1 rounded">
                      {result.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {result.content.substring(0, 150)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Source: {result.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScraperPanel;