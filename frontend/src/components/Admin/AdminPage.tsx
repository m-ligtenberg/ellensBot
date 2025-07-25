import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ScraperPanel from './ScraperPanel';
import SubmissionsPanel from './SubmissionsPanel';
import AdvancedMLPanel from './AdvancedMLPanel';
import MLDiscoveryPanel from './MLDiscoveryPanel';
import ServerlessAdminDashboard from './ServerlessAdminDashboard';
import CoquiTTSPanel from './CoquiTTSPanel';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'content' | 'scraper' | 'submissions' | 'analytics' | 'ml' | 'discovery' | 'tts'>('dashboard');
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
            {(['dashboard', 'upload', 'content', 'scraper', 'submissions', 'analytics', 'ml', 'discovery', 'tts'] as const).map((tab) => (
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
                  {tab === 'analytics' && '📊'} {tab === 'ml' && '🧠'} {tab === 'discovery' && '🤖'} {tab === 'tts' && '🎤'}
                </span>
                <span>
                  {tab === 'ml' ? 'ML Controls' : tab === 'discovery' ? 'ML Discovery' : tab === 'tts' ? 'Text-to-Speech' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          <ServerlessAdminDashboard />
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
                  <h3 className="text-lg font-semibold text-apple-gray-900">Manual Entry</h3>
                  
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      type: e.target.value as ContentItem['type']
                    }))}
                    className="w-full bg-white text-apple-gray-900 px-4 py-3 rounded-xl border border-apple-gray-300 focus:border-apple-blue focus:outline-none"
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
                    className="w-full bg-white text-apple-gray-900 px-4 py-3 rounded-xl border border-apple-gray-300 focus:border-apple-blue focus:outline-none"
                  />

                  <textarea
                    placeholder="Content..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full bg-white text-apple-gray-900 px-4 py-3 rounded-xl border border-apple-gray-300 focus:border-apple-blue focus:outline-none resize-none"
                  />

                  <input
                    type="text"
                    placeholder="Source (optional)"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-white text-apple-gray-900 px-4 py-3 rounded-xl border border-apple-gray-300 focus:border-apple-blue focus:outline-none"
                  />

                  <button
                    type="submit"
                    className="w-full bg-apple-blue text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200"
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

        {/* ML Discovery Tab */}
        {activeTab === 'discovery' && (
          <MLDiscoveryPanel />
        )}

        {/* Text-to-Speech Tab */}
        {activeTab === 'tts' && (
          <CoquiTTSPanel />
        )}
      </div>
    </div>
  );
};

export default AdminPage;