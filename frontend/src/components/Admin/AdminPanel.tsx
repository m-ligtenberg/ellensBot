import React, { useState, useRef } from 'react';
import ScraperPanel from './ScraperPanel';

interface ContentItem {
  id: string;
  type: 'lyrics' | 'interview' | 'social_media' | 'speech' | 'other';
  title: string;
  content: string;
  source: string;
  uploadDate: string;
  status: 'pending' | 'analyzed' | 'integrated';
}

interface AdminPanelProps {
  onContentUpload: (content: Omit<ContentItem, 'id' | 'uploadDate' | 'status'>) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onContentUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'content' | 'scraper' | 'analytics'>('upload');
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-accent-yellow text-black px-4 py-2 rounded-full font-bold shadow-lg hover:bg-yellow-300 transition-colors z-50"
      >
        🔧 Admin
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold text-accent-green">
            🎤 Young Ellens Admin Panel
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {(['upload', 'content', 'scraper', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'text-accent-green border-b-2 border-accent-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'upload' && '📤'} {tab === 'content' && '📚'} 
              {tab === 'scraper' && '🕷️'} {tab === 'analytics' && '📊'} {tab}
            </button>
          ))}
        </div>

        <div className="p-6 h-full overflow-y-auto">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-accent-yellow mb-4">
                  📁 Upload Young Ellens Content
                </h3>
                <p className="text-gray-300 mb-4">
                  Upload lyrics, interviews, social media posts, or other content to improve the chatbot's personality.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* File Upload */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Upload from File</h4>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-accent-green text-black px-4 py-2 rounded font-bold hover:bg-green-400 transition-colors"
                      >
                        Choose File
                      </button>
                      <p className="text-gray-400 mt-2 text-sm">
                        Supported: .txt, .md, .json
                      </p>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <h4 className="font-semibold text-white">Manual Entry</h4>
                    
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        type: e.target.value as ContentItem['type']
                      }))}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
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
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />

                    <textarea
                      placeholder="Content..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 resize-none"
                    />

                    <input
                      type="text"
                      placeholder="Source (optional)"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />

                    <button
                      type="submit"
                      className="w-full bg-accent-yellow text-black py-2 rounded font-bold hover:bg-yellow-300 transition-colors"
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
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-accent-yellow mb-4">
                📚 Uploaded Content ({uploadedContent.length})
              </h3>
              
              {uploadedContent.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No content uploaded yet.</p>
                  <p>Switch to the Upload tab to add some!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedContent.map((item) => (
                    <div key={item.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <p className="text-sm text-gray-400">
                            {item.type} • {new Date(item.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            item.status === 'pending' ? 'bg-yellow-600 text-white' :
                            item.status === 'analyzed' ? 'bg-blue-600 text-white' :
                            'bg-green-600 text-white'
                          }`}>
                            {item.status}
                          </span>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => analyzeContent(item.id)}
                              className="bg-accent-green text-black px-2 py-1 rounded text-xs font-bold hover:bg-green-400"
                            >
                              Analyze
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                        {item.content.substring(0, 200)}...
                      </p>
                      {item.source && (
                        <p className="text-xs text-gray-500">Source: {item.source}</p>
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-accent-yellow mb-4">
                📊 Character Analytics
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">Content Breakdown</h4>
                  <div className="space-y-2 text-sm">
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

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">Personality Insights</h4>
                  <div className="space-y-2 text-sm">
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
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Recent Personality Updates</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• Enhanced Amsterdam vocabulary with "Damsko" and "Dammie"</p>
                  <p>• Added street terms: mattie, sahbi, akhie, wallah</p>
                  <p>• Improved denial patterns with authentic responses</p>
                  <p>• Expanded knowledge slips with local references</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;