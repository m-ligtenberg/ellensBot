import React, { useState } from 'react';
import ChatInterface from './components/Chat/ChatInterface';
import AdminPanel from './components/Admin/AdminPanel';
import SubmissionForm from './components/Chat/SubmissionForm';
import LoginForm from './components/Auth/LoginForm';
import { useWebSocketChat } from './hooks/useWebSocketChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const { 
    messages, 
    isEllensTyping, 
    ellensTypingMood, 
    isConnected, 
    connectionError, 
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

  return (
    <div className="App">
      <ChatInterface
        messages={messages}
        onSendMessage={sendMessage}
        onUserTyping={setUserTyping}
        onReact={addReaction}
        isEllensTyping={isEllensTyping}
        ellensTypingMood={ellensTypingMood}
        isConnected={isConnected}
        connectionError={connectionError}
        onRetryConnection={retryConnection}
      />
      
      {/* Improved Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-40">
        {/* Submission button */}
        <button
          onClick={() => setIsSubmissionFormOpen(true)}
          className="bg-accent-green text-black p-4 rounded-full shadow-lg hover:bg-green-400 transition-all transform hover:scale-110 group"
          title="Teach Ellens new words"
        >
          <span className="text-xl">🎤</span>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Teach Ellens
          </div>
        </button>
        
        {/* Admin button */}
        <button
          onClick={() => {
            if (isAuthenticated) {
              setIsAdminPanelOpen(true);
            } else {
              setIsLoginFormOpen(true);
            }
          }}
          className="bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-500 transition-all transform hover:scale-110 group"
          title="Admin Panel"
        >
          <span className="text-xl">⚙️</span>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Admin Panel
          </div>
        </button>
      </div>
      
      {/* Admin Panel */}
      {isAdminPanelOpen && (
        <AdminPanel 
          onContentUpload={handleContentUpload}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}
      
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
