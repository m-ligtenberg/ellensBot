import React, { useState } from 'react';
import ChatInterface from './components/Chat/ChatInterface';
import PersonalityUpdates from './components/Chat/PersonalityUpdates';
import AdminPage from './components/Admin/AdminPage';
import SubmissionForm from './components/Chat/SubmissionForm';
import LoginForm from './components/Auth/LoginForm';
import { useWebSocketChat } from './hooks/useWebSocketChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat');
  const [activeTab, setActiveTab] = useState<'chat' | 'updates'>('chat');
  const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false);
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const { 
    messages, 
    isEllensTyping, 
    ellensTypingMood, 
    isConnected, 
    connectionError, 
    connectionState,
    sendMessage, 
    setUserTyping, 
    retryConnection,
    addReaction
  } = useWebSocketChat();

  const handleContentUpload = async (content: {
    type: 'lyrics' | 'interview' | 'social_media' | 'speech' | 'other';
    title: string;
    content: string;
    source: string;
  }) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/content/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Content uploaded successfully:', result);
      } else {
        console.error('Failed to upload content');
      }
    } catch (error) {
      console.error('Error uploading content:', error);
    }
  };

  // Show admin page if requested
  if (currentView === 'admin') {
    return (
      <div className="App">
        <AdminPage
          onContentUpload={handleContentUpload}
          onBackToChat={() => setCurrentView('chat')}
        />
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-apple-gray-100 flex items-center justify-center p-6 font-apple">
      <div className="w-full max-w-5xl">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-1 flex space-x-1 shadow-card border border-apple-gray-300">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-apple-blue text-white'
                  : 'text-apple-gray-600 hover:text-apple-gray-900 hover:bg-apple-gray-200'
              }`}
            >
              💬 Chat with Ellens
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'updates'
                  ? 'bg-apple-blue text-white'
                  : 'text-apple-gray-600 hover:text-apple-gray-900 hover:bg-apple-gray-200'
              }`}
            >
              🔄 Personality Updates
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex justify-center">
          {activeTab === 'chat' ? (
            <div className="w-full max-w-4xl">
              <ChatInterface
                messages={messages}
                onSendMessage={sendMessage}
                onUserTyping={setUserTyping}
                onReact={addReaction}
                isEllensTyping={isEllensTyping}
                ellensTypingMood={ellensTypingMood}
                isConnected={isConnected}
                connectionError={connectionError}
                connectionState={connectionState}
                onRetryConnection={retryConnection}
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-2xl p-8 h-[80vh] overflow-hidden shadow-card border border-apple-gray-300">
                <PersonalityUpdates />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Apple-style Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-40">
        {/* Submission button */}
        <button
          onClick={() => setIsSubmissionFormOpen(true)}
          className="bg-apple-green hover:bg-opacity-90 text-white p-4 rounded-full shadow-card transition-all duration-200 hover:scale-105 group"
          title="Teach Ellens new words"
        >
          <span className="text-xl">🎤</span>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-apple-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Teach Ellens
          </div>
        </button>
        
        {/* Admin button */}
        <button
          onClick={() => {
            if (isAuthenticated) {
              setCurrentView('admin');
            } else {
              setIsLoginFormOpen(true);
            }
          }}
          className="bg-apple-blue hover:bg-opacity-90 text-white p-4 rounded-full shadow-card transition-all duration-200 hover:scale-105 group"
          title="Admin Panel"
        >
          <span className="text-xl">⚙️</span>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-apple-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Admin Panel
          </div>
        </button>
      </div>
      
      {/* Login Form */}
      {isLoginFormOpen && (
        <LoginForm onClose={() => setIsLoginFormOpen(false)} />
      )}
      
      <SubmissionForm
        isOpen={isSubmissionFormOpen}
        onClose={() => setIsSubmissionFormOpen(false)}
        onSubmissionSuccess={() => {
          // Maybe show a success message or refresh something
          console.log('Submission successful!');
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
