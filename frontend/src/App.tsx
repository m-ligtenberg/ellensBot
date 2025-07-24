import React, { useState } from 'react';
import ChatInterface from './components/Chat/ChatInterface';
import AdminPanel from './components/Admin/AdminPanel';
import SubmissionForm from './components/Chat/SubmissionForm';
import { useWebSocketChat } from './hooks/useWebSocketChat';

function App() {
  const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false);
  
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
      
      {/* Floating action button to open submission form */}
      <button
        onClick={() => setIsSubmissionFormOpen(true)}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-40"
        title="Teach Ellens new words"
      >
        🎤
      </button>
      
      <AdminPanel onContentUpload={handleContentUpload} />
      
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
}

export default App;
