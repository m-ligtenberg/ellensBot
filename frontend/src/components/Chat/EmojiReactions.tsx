import React, { useState } from 'react';

interface EmojiReactionsProps {
  messageId: string;
  reactions?: Record<string, number>;
  onReact: (messageId: string, emoji: string) => void;
  disabled?: boolean;
}

const AVAILABLE_EMOJIS = ['😂', '🔥', '💯', '😎', '🤔', '😅', '👍', '❤️'];

const EmojiReactions: React.FC<EmojiReactionsProps> = ({
  messageId,
  reactions = {},
  onReact,
  disabled = false
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    if (!disabled) {
      onReact(messageId, emoji);
      setShowEmojiPicker(false);
    }
  };

  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className="relative">
      {/* Existing Reactions */}
      {hasReactions && (
        <div className="flex flex-wrap gap-1 mb-2">
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              disabled={disabled}
              className="bg-gray-700 hover:bg-gray-600 disabled:hover:bg-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors"
            >
              <span>{emoji}</span>
              <span className="text-gray-300">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="text-gray-400 hover:text-gray-200 disabled:hover:text-gray-400 text-sm transition-colors"
          title="Add reaction"
        >
          {hasReactions ? '+' : '😀'}
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowEmojiPicker(false)}
            />
            
            {/* Emoji Grid */}
            <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-lg z-20">
              <div className="grid grid-cols-4 gap-1">
                {AVAILABLE_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 hover:bg-gray-700 rounded transition-colors text-lg flex items-center justify-center"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;