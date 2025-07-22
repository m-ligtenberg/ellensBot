import React from 'react';

interface TypingIndicatorProps {
  mood: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ mood }) => {
  const getMoodMessage = (mood: string) => {
    const messages = {
      'chaotic': [
        'Ellens is chaotisch aan het typen... 😵‍💫',
        'YO WACHT EFFE... typ typ typ...',
        'Ellens heeft veel te zeggen B-Negar!',
        'Chaos mode activated... OWO',
        '*snuift* aan het typen...'
      ],
      'done': [
        'Ellens is verveeld... 🙄',
        'Meh... saai gesprek...',
        'Whatever man... typ typ...',
        'Ellens overweegt te stoppen...',
        'Boring topic... 💤'
      ],
      'confused': [
        'Ellens snapt het niet... 🤔',
        'Eh wat? Aan het denken...',
        'Confused... maar typing...',
        'Wacht wat zei je? Typ typ...',
        'Brain.exe stopped working...'
      ],
      'getting_bored': [
        'Ellens wordt moe... 😴',
        'Aandacht gaat weg... typ...',
        'Bijna klaar met dit gesprek...',
        'Netflix klinkt beter... maar ok',
        'Last message misschien... 🥱'
      ],
      'chill': [
        'Ellens is relaxed aan het typen... 😎',
        'Chill mode... alleen wietje en henny',
        'Young Ellens denkt na... B-Negar',
        'Studio vibes terwijl ik typ... 🎵',
        'Type type... OWO!'
      ]
    };
    
    const moodMessages = messages[mood as keyof typeof messages] || messages.chill;
    return moodMessages[Math.floor(Math.random() * moodMessages.length)];
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'chaotic': return '😵‍💫';
      case 'done': return '🙄';
      case 'confused': return '🤔';
      case 'getting_bored': return '😴';
      case 'chill':
      default: return '😎';
    }
  };

  return (
    <div className="flex justify-start px-1">
      <div className={`max-w-[280px] md:max-w-sm bg-secondary border-2 border-accent-green px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-bl-md shadow-lg ${
        mood === 'chaotic' ? 'glitch-effect' : ''
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-sm font-street font-bold text-accent-green">Young Ellens</span>
            <span className="ml-2 text-lg">{getMoodIcon(mood)}</span>
          </div>
          {mood === 'chaotic' && (
            <span className="text-accent-yellow animate-pulse text-lg">⚡</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-secondary">
            {getMoodMessage(mood)}
          </span>
          <div className="flex space-x-1 ml-2">
            <div className="w-2 h-2 bg-accent-green rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-accent-green rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-accent-green rounded-full typing-dot"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 pt-1">
          <span className="text-xs text-gray-400">
            {new Date().toLocaleTimeString('nl-NL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {mood !== 'chill' && (
            <span className="text-xs text-accent-yellow font-bold">
              {mood.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;