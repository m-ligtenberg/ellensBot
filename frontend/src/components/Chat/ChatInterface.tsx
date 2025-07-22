import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onUserTyping?: (isTyping: boolean) => void;
  isEllensTyping: boolean;
  ellensTypingMood?: string;
  isConnected?: boolean;
  connectionError?: string | null;
  onRetryConnection?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onUserTyping,
  isEllensTyping,
  ellensTypingMood = 'chill',
  isConnected = true,
  connectionError,
  onRetryConnection
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isEllensTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setIsUserTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    const typing = e.target.value.length > 0;
    setIsUserTyping(typing);
    onUserTyping?.(typing);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-600 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-green-400 truncate">
                🎤 Young Ellens
              </h1>
              <p className="text-sm text-gray-400 mt-1 truncate">
                {connectionError ? (
                  <span className="text-red-500">❌ Connection Error</span>
                ) : !isConnected ? (
                  <span className="text-yellow-500">🔄 Connecting...</span>
                ) : isEllensTyping ? (
                  <span>Typing...</span>
                ) : (
                  "Online"
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected && !connectionError 
                  ? 'bg-green-400' 
                  : 'bg-red-500'
              }`} />
              {connectionError && onRetryConnection && (
                <button 
                  onClick={onRetryConnection}
                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Start chatting with Young Ellens...</p>
            </div>
          )}
        
          {messages.map((message, index) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        
          {isEllensTyping && (
            <TypingIndicator mood={ellensTypingMood} />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-900 border-t border-gray-600 p-4 rounded-b-lg">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder={!isConnected ? "Connecting..." : connectionError ? "Connection error..." : "Type a message..."}
              disabled={!isConnected || !!connectionError}
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected || !!connectionError}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;