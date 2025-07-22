import React from 'react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isEllens = message.sender === 'ellens';
  const isUser = message.sender === 'user';

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'chaotic': return '😵‍💫';
      case 'done': return '🙄';
      case 'chill': 
      default: return '😎';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'chaotic': return 'border-accent-yellow';
      case 'done': return 'border-red-500';
      case 'chill':
      default: return 'border-accent-green';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-1`}>
      <div className={`max-w-[280px] md:max-w-sm lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-lg ${
        isUser 
          ? 'bg-blue-600 text-white rounded-br-md' 
          : `bg-secondary border-2 ${getMoodColor(message.mood)} text-primary rounded-bl-md ${
              message.mood === 'chaotic' ? 'glitch-effect' : ''
            }`
      }`}>
        {isEllens && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-sm font-street font-bold text-accent-green">Young Ellens</span>
              <span className="ml-2 text-lg">{getMoodIcon(message.mood)}</span>
            </div>
            {message.chaosLevel && message.chaosLevel > 70 && (
              <span className="text-accent-yellow animate-pulse text-lg">⚡</span>
            )}
          </div>
        )}
        
        <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
          {message.text}
        </p>
        
        <div className="flex justify-between items-center mt-2 pt-1">
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString('nl-NL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {isEllens && message.chaosLevel && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-accent-yellow font-bold">
                {message.chaosLevel}%
              </span>
              <div className="w-8 bg-tertiary rounded-full h-1 overflow-hidden">
                <div 
                  className="chaos-bar h-full transition-all duration-500"
                  style={{ width: `${message.chaosLevel}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Special Phrase Badges */}
        {isEllens && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(message.text.toLowerCase().includes('alleen me wietje') || 
              message.text.toLowerCase().includes('ik ben daar niet op')) && (
              <span className="bg-accent-green text-black text-xs font-bold px-2 py-1 rounded-full">
                🚫 DENIAL MODE
              </span>
            )}
            
            {message.text.toLowerCase().includes('b-negar') && (
              <span className="bg-accent-yellow text-black text-xs font-bold px-2 py-1 rounded-full">
                🎵 SIGNATURE AD-LIB
              </span>
            )}
            
            {message.text.toLowerCase().includes('owo') && (
              <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                🔥 OWO VIBES
              </span>
            )}
            
            {(message.text.toLowerCase().includes('amsterdam') || 
              message.text.toLowerCase().includes('020') ||
              message.text.toLowerCase().includes('damsko') ||
              message.text.toLowerCase().includes('dammie')) && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                🏙️ 020 REP
              </span>
            )}
            
            {(message.text.toLowerCase().includes('studio') || 
              message.text.toLowerCase().includes('muziek')) && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                🎤 STUDIO TALK
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;