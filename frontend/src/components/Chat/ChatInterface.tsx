import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useAIStatus } from '../../hooks/useAIStatus';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onUserTyping?: (isTyping: boolean) => void;
  onReact?: (messageId: string, emoji: string) => void;
  isEllensTyping: boolean;
  ellensTypingMood?: string;
  isConnected?: boolean;
  connectionError?: string | null;
  connectionState?: string;
  onRetryConnection?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onUserTyping,
  onReact,
  isEllensTyping,
  ellensTypingMood = 'chill',
  isConnected = true,
  connectionError,
  connectionState,
  onRetryConnection
}) => {
  const [inputMessage, setInputMessage] = useState('');
  // const [isUserTyping, setIsUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getStatusInfo } = useAIStatus();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isEllensTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Send button clicked!', { inputMessage: inputMessage.trim(), isConnected });
    if (inputMessage.trim()) {
      console.log('📤 Sending message:', inputMessage.trim());
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      // setIsUserTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    const typing = e.target.value.length > 0;
    // setIsUserTyping(typing);
    onUserTyping?.(typing);
  };

  return (
    <div className="w-full h-[80vh] flex flex-col bg-white rounded-2xl shadow-card border border-apple-gray-300 overflow-hidden">
        {/* Clean Header */}
        <div className="bg-apple-gray-50 border-b border-apple-gray-300 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-apple-gray-900 truncate flex items-center">
                🎤 Young Ellens Bot
                <span className="ml-3 text-xs bg-apple-orange text-white px-3 py-1 rounded-full font-medium">
                  Mr. Cocaine
                </span>
              </h1>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-apple-gray-600 truncate flex items-center">
                  {connectionError ? (
                    <span className="text-apple-red flex items-center">
                      ❌ Connection Error
                      <button 
                        onClick={onRetryConnection}
                        className="ml-2 text-xs bg-apple-red hover:bg-opacity-90 text-white px-3 py-1 rounded-full transition-all duration-200"
                      >
                        Retry
                      </button>
                    </span>
                  ) : !isConnected ? (
                    <span className="text-apple-orange flex items-center">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-apple-orange mr-2 inline-block"></span>
                      {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
                    </span>
                  ) : isEllensTyping ? (
                    <span className="text-apple-green flex items-center">
                      <span className="flex space-x-1 mr-2">
                        <span className="w-1.5 h-1.5 bg-apple-green rounded-full animate-bounce inline-block"></span>
                        <span className="w-1.5 h-1.5 bg-apple-green rounded-full animate-bounce inline-block" style={{animationDelay: '0.1s'}}></span>
                        <span className="w-1.5 h-1.5 bg-apple-green rounded-full animate-bounce inline-block" style={{animationDelay: '0.2s'}}></span>
                      </span>
                      Ellens is {ellensTypingMood}...
                    </span>
                  ) : (
                    <span className="text-apple-green flex items-center">
                      <span className="w-2 h-2 bg-apple-green rounded-full mr-2 inline-block"></span>
                      Online • "Alleen me wietje en me henny"
                    </span>
                  )}
                </div>
                
                {/* AI Status Indicator */}
                {(() => {
                  const statusInfo = getStatusInfo();
                  if (!statusInfo) return null;
                  
                  return (
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-apple-gray-200 border border-apple-gray-300">
                      <span>{statusInfo.icon}</span>
                      <span className="text-apple-gray-700">{statusInfo.status}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div className={`w-3 h-3 rounded-full ${
                isConnected && !connectionError 
                  ? 'bg-apple-green' 
                  : 'bg-apple-red'
              }`} />
              {connectionError && onRetryConnection && (
                <button 
                  onClick={onRetryConnection}
                  className="text-xs bg-apple-green hover:bg-opacity-90 text-white px-3 py-1 rounded-full transition-all duration-200"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-apple-gray-500 py-12">
              <div className="text-5xl mb-4">🎤</div>
              <p className="text-lg font-medium text-apple-gray-900 mb-2">Start chatting with Young Ellens...</p>
              <p className="text-sm text-apple-gray-600">Hij zit klaar om te praten! 💬</p>
            </div>
          )}
        
          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              onReact={onReact}
            />
          ))}
        
          {isEllensTyping && (
            <TypingIndicator mood={ellensTypingMood} />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-apple-gray-50 border-t border-apple-gray-300 p-4 rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder={!isConnected ? "Connecting..." : connectionError ? "Connection error..." : "Type a message..."}
              disabled={!isConnected || !!connectionError}
              className="flex-1 bg-white text-apple-gray-900 border border-apple-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue focus:ring-opacity-20 disabled:opacity-50 transition-all duration-200"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected || !!connectionError}
              className="bg-apple-blue text-white px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </form>
        </div>
    </div>
  );
};

export default ChatInterface;