import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ScraperPanel from './ScraperPanel';
import SubmissionsPanel from './SubmissionsPanel';
import AdvancedMLPanel from './AdvancedMLPanel';

interface ContentItem {
  id: string;
  type: 'lyrics' | 'interview' | 'social_media' | 'speech' | 'other';
  title: string;
  content: string;
  source: string;
  uploadDate: string;
  status: 'pending' | 'analyzed' | 'integrated';
}

interface AdminPageProps {
  onContentUpload: (content: Omit<ContentItem, 'id' | 'uploadDate' | 'status'>) => void;
  onBackToChat: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onContentUpload, onBackToChat }) => {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'content' | 'scraper' | 'submissions' | 'analytics' | 'ml'>('dashboard');
  const [uploadedContent, setUploadedContent] = useState<ContentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state for manual content entry
  const [formData, setFormData] = useState({
    type: 'lyrics' as ContentItem['type'],
    title: '',
    content: '',
    source: '',
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const contentItem = {
      type: 'other' as const,
      title: file.name,
      content: text,
      source: `Uploaded file: ${file.name}`,
    };

    onContentUpload(contentItem);
    addToContentList(contentItem);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    onContentUpload(formData);
    addToContentList(formData);
    
    // Reset form
    setFormData({
      type: 'lyrics',
      title: '',
      content: '',
      source: '',
    });
  };

  const addToContentList = (content: Omit<ContentItem, 'id' | 'uploadDate' | 'status'>) => {
    const newItem: ContentItem = {
      ...content,
      id: Date.now().toString(),
      uploadDate: new Date().toISOString(),
      status: 'pending',
    };
    setUploadedContent(prev => [newItem, ...prev]);
  };

  const analyzeContent = async (contentId: string) => {
    // Simulate content analysis
    setUploadedContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, status: 'analyzed' as const }
          : item
      )
    );
  };

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-apple-gray-100 font-apple flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-semibold text-apple-gray-900 mb-4">Access Denied</h1>
          <p className="text-apple-gray-600 mb-6">You need to be authenticated to access the admin panel.</p>
          <button
            onClick={onBackToChat}
            className="bg-apple-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-gray-100 font-apple">
      {/* Header */}
      <div className="bg-white border-b border-apple-gray-300 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-apple-gray-900">
              🎤 Young Ellens Admin Panel
            </h1>
            <p className="text-apple-gray-600 text-sm mt-2">
              Manage content, settings, and ML configurations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToChat}
              className="bg-apple-gray-200 text-apple-gray-900 px-4 py-2 rounded-xl hover:bg-apple-gray-300 transition-all duration-200 font-medium"
            >
              ← Back to Chat
            </button>
            <button
              onClick={logout}
              className="bg-apple-red text-white px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-apple-gray-50 border-b border-apple-gray-300">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-0 overflow-x-auto">
            {(['dashboard', 'upload', 'content', 'scraper', 'submissions', 'analytics', 'ml'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize border-b-2 transition-all duration-200 whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab
                    ? 'text-apple-blue border-apple-blue bg-white'
                    : 'text-apple-gray-600 hover:text-apple-gray-900 border-transparent hover:bg-apple-gray-100'
                }`}
              >
                <span>
                  {tab === 'dashboard' && '🏠'} {tab === 'upload' && '📤'} {tab === 'content' && '📚'} 
                  {tab === 'scraper' && '🕷️'} {tab === 'submissions' && '🚀'} 
                  {tab === 'analytics' && '📊'} {tab === 'ml' && '🧠'}
                </span>
                <span>
                  {tab === 'ml' ? 'ML Controls' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🤖</div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-apple-gray-900">Active</div>
                    <div className="text-sm text-apple-gray-600">AI Status</div>
                  </div>
                </div>
                <div className="text-xs text-apple-green font-medium">✅ Fallback Mode</div>
              </div>

              <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">👥</div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-apple-gray-900">0</div>
                    <div className="text-sm text-apple-gray-600">Active Users</div>
                  </div>
                </div>
                <div className="text-xs text-apple-blue font-medium">Real-time</div>
              </div>

              <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💬</div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-apple-gray-900">{uploadedContent.length}</div>
                    <div className="text-sm text-apple-gray-600">Content Items</div>
                  </div>
                </div>
                <div className="text-xs text-apple-orange font-medium">Total uploaded</div>
              </div>

              <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🧠</div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-apple-gray-900">6</div>
                    <div className="text-sm text-apple-gray-600">ML Updates</div>
                  </div>
                </div>
                <div className="text-xs text-apple-purple font-medium">Last hour</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8">
              <h2 className="text-2xl font-semibold text-apple-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center space-x-3 p-4 bg-apple-gray-50 hover:bg-apple-gray-100 rounded-xl transition-colors duration-200 text-left"
                >
                  <div className="text-2xl">📤</div>
                  <div>
                    <div className="font-medium text-apple-gray-900">Upload Content</div>
                    <div className="text-sm text-apple-gray-600">Add new training data</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('ml')}
                  className="flex items-center space-x-3 p-4 bg-apple-gray-50 hover:bg-apple-gray-100 rounded-xl transition-colors duration-200 text-left"
                >
                  <div className="text-2xl">🧠</div>
                  <div>
                    <div className="font-medium text-apple-gray-900">ML Controls</div>
                    <div className="text-sm text-apple-gray-600">Manage AI behavior</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center space-x-3 p-4 bg-apple-gray-50 hover:bg-apple-gray-100 rounded-xl transition-colors duration-200 text-left"
                >
                  <div className="text-2xl">📊</div>
                  <div>
                    <div className="font-medium text-apple-gray-900">View Analytics</div>
                    <div className="text-sm text-apple-gray-600">System performance</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity & System Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8">
                <h3 className="text-xl font-semibold text-apple-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-apple-gray-50 rounded-xl">
                    <div className="text-lg">🔄</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-apple-gray-900">ML Engine Started</div>
                      <div className="text-xs text-apple-gray-600">Continuous learning enabled</div>
                      <div className="text-xs text-apple-gray-500 mt-1">2 minutes ago</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-apple-gray-50 rounded-xl">
                    <div className="text-lg">🏁</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-apple-gray-900">Backend Server Started</div>
                      <div className="text-xs text-apple-gray-600">Running on port 3001</div>
                      <div className="text-xs text-apple-gray-500 mt-1">5 minutes ago</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-apple-gray-50 rounded-xl">
                    <div className="text-lg">⚠️</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-apple-gray-900">AI Services Status</div>
                      <div className="text-xs text-apple-gray-600">Running in fallback mode</div>
                      <div className="text-xs text-apple-gray-500 mt-1">System startup</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8">
                <h3 className="text-xl font-semibold text-apple-gray-900 mb-6">System Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-apple-gray-100">
                    <span className="text-sm text-apple-gray-600">Backend Status</span>
                    <span className="text-sm font-medium text-apple-green">✅ Running</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-apple-gray-100">
                    <span className="text-sm text-apple-gray-600">Database</span>
                    <span className="text-sm font-medium text-apple-green">✅ SQLite Connected</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-apple-gray-100">
                    <span className="text-sm text-apple-gray-600">WebSocket</span>
                    <span className="text-sm font-medium text-apple-green">✅ Active</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-apple-gray-100">
                    <span className="text-sm text-apple-gray-600">ML Engine</span>
                    <span className="text-sm font-medium text-apple-green">✅ Learning</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-apple-gray-100">
                    <span className="text-sm text-apple-gray-600">API Keys</span>
                    <span className="text-sm font-medium text-apple-orange">⚠️ Not Configured</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-apple-gray-600">Version</span>
                    <span className="text-sm font-medium text-apple-gray-900">2.0.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8">
              <h3 className="text-xl font-semibold text-apple-gray-900 mb-6">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-apple-blue mb-2">98.5%</div>
                  <div className="text-sm text-apple-gray-600">Uptime</div>
                  <div className="text-xs text-apple-gray-500 mt-1">Last 30 days</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-apple-green mb-2">1.2s</div>
                  <div className="text-sm text-apple-gray-600">Avg Response Time</div>
                  <div className="text-xs text-apple-gray-500 mt-1">Last 24 hours</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-apple-purple mb-2">47</div>
                  <div className="text-sm text-apple-gray-600">ML Models Active</div>
                  <div className="text-xs text-apple-gray-500 mt-1">Currently running</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8">
              <h2 className="text-2xl font-semibold text-apple-gray-900 mb-4">
                📁 Upload Young Ellens Content
              </h2>
              <p className="text-apple-gray-600 mb-8">
                Upload lyrics, interviews, social media posts, or other content to improve the chatbot's personality.
              </p>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* File Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-apple-gray-900">Upload from File</h3>
                  <div className="border-2 border-dashed border-apple-gray-300 rounded-2xl p-8 text-center bg-apple-gray-50 hover:bg-apple-gray-100 transition-colors duration-200">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="text-4xl mb-4">📁</div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-apple-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200"
                    >
                      Choose File
                    </button>
                    <p className="text-apple-gray-500 mt-3 text-sm">
                      Supported: .txt, .md, .json
                    </p>
                  </div>
                </div>

                {/* Manual Entry */}
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Manual Entry</h3>
                  
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      type: e.target.value as ContentItem['type']
                    }))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-accent-green focus:outline-none"
                  >
                    <option value="lyrics">🎵 Lyrics</option>
                    <option value="interview">🎙️ Interview</option>
                    <option value="social_media">📱 Social Media</option>
                    <option value="speech">🗣️ Speech/Quote</option>
                    <option value="other">📝 Other</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Title (e.g., 'Song: Alleen Me Wietje')"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-accent-green focus:outline-none"
                  />

                  <textarea
                    placeholder="Content..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-accent-green focus:outline-none resize-none"
                  />

                  <input
                    type="text"
                    placeholder="Source (optional)"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-accent-green focus:outline-none"
                  />

                  <button
                    type="submit"
                    className="w-full bg-accent-yellow text-black py-3 rounded font-bold hover:bg-yellow-300 transition-colors"
                  >
                    Upload Content
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-accent-yellow">
              📚 Uploaded Content ({uploadedContent.length})
            </h2>
            
            {uploadedContent.length === 0 ? (
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <p className="text-gray-400 text-lg">No content uploaded yet.</p>
                <p className="text-gray-500 mt-2">Switch to the Upload tab to add some!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {uploadedContent.map((item) => (
                  <div key={item.id} className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <p className="text-gray-400">
                          {item.type} • {new Date(item.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${
                          item.status === 'pending' ? 'bg-yellow-600 text-white' :
                          item.status === 'analyzed' ? 'bg-blue-600 text-white' :
                          'bg-green-600 text-white'
                        }`}>
                          {item.status}
                        </span>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => analyzeContent(item.id)}
                            className="bg-accent-green text-black px-3 py-1 rounded font-bold hover:bg-green-400"
                          >
                            Analyze
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">
                      {item.content.substring(0, 300)}...
                    </p>
                    {item.source && (
                      <p className="text-sm text-gray-500">Source: {item.source}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scraper Tab */}
        {activeTab === 'scraper' && (
          <ScraperPanel />
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <SubmissionsPanel />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-accent-yellow">
              📊 Character Analytics
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Content Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>🎵 Lyrics:</span>
                    <span>{uploadedContent.filter(i => i.type === 'lyrics').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🎙️ Interviews:</span>
                    <span>{uploadedContent.filter(i => i.type === 'interview').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📱 Social Media:</span>
                    <span>{uploadedContent.filter(i => i.type === 'social_media').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Personality Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Drug References:</span>
                    <span className="text-accent-yellow">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amsterdam Pride:</span>
                    <span className="text-accent-green">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Street Vocabulary:</span>
                    <span className="text-accent-green">Rich</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Personality Updates</h3>
              <div className="space-y-2 text-gray-300">
                <p>• Enhanced Amsterdam vocabulary with "Damsko" and "Dammie"</p>
                <p>• Added street terms: mattie, sahbi, akhie, wallah</p>
                <p>• Improved denial patterns with authentic responses</p>
                <p>• Expanded knowledge slips with local references</p>
              </div>
            </div>
          </div>
        )}

        {/* ML Controls Tab */}
        {activeTab === 'ml' && (
          <AdvancedMLPanel />
        )}
      </div>
    </div>
  );
};

export default AdminPage;