import React from 'react';
import ChatInterface from './components/Chat/ChatInterface';
import AdminPanel from './components/Admin/AdminPanel';
import { useWebSocketChat } from './hooks/useWebSocketChat';

function App() {
  const { 
    messages, 
    isEllensTyping, 
    ellensTypingMood, 
    isConnected, 
    connectionError, 
    sendMessage, 
    setUserTyping, 
    retryConnection 
  } = useWebSocketChat();

  const handleContentUpload = async (content: {
    type: 'lyrics' | 'interview' | 'social_media' | 'speech' | 'other';
    title: string;
    content: string;
    source: string;
  }) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/content/upload', {
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
        isEllensTyping={isEllensTyping}
        ellensTypingMood={ellensTypingMood}
        isConnected={isConnected}
        connectionError={connectionError}
        onRetryConnection={retryConnection}
      />
      <AdminPanel onContentUpload={handleContentUpload} />
    </div>
  );
}

export default App;
