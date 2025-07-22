import { useState, useCallback } from 'react';
import { Message } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEllensTyping, setIsEllensTyping] = useState(false);
  const [ellensTypingMood, setEllensTypingMood] = useState<string>('chill');

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date()
    };
    addMessage(userMessage);

    // Show Ellens typing
    setIsEllensTyping(true);
    setEllensTypingMood(Math.random() > 0.7 ? 'chaotic' : 'chill');

    try {
      // Simulate API call for now (replace with real API later)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock Ellens response
      const ellensResponse = getMockEllensResponse(text);
      const ellensMessage: Message = {
        id: `ellens-${Date.now()}`,
        text: ellensResponse.text,
        sender: 'ellens',
        timestamp: new Date(),
        mood: ellensResponse.mood,
        chaosLevel: ellensResponse.chaosLevel
      };
      
      setIsEllensTyping(false);
      addMessage(ellensMessage);
    } catch (error) {
      setIsEllensTyping(false);
      console.error('Failed to send message:', error);
    }
  }, [addMessage]);

  return {
    messages,
    isEllensTyping,
    ellensTypingMood,
    sendMessage
  };
};

// Mock response generator (temporary until we have the backend)
const getMockEllensResponse = (userMessage: string): {
  text: string;
  mood: 'chill' | 'chaotic' | 'done';
  chaosLevel: number;
} => {
  const lowerMessage = userMessage.toLowerCase();
  const chaosLevel = Math.floor(Math.random() * 100);
  
  // Drug-related responses
  if (lowerMessage.includes('cocaine') || lowerMessage.includes('drugs') || lowerMessage.includes('cocaïne')) {
    return {
      text: "Nooo man ik ben daar niet op, alleen me wietje en me henny! Waarom vraagt iedereen me dat? 😤",
      mood: 'chaotic',
      chaosLevel: chaosLevel + 20
    };
  }
  
  // Random interruption
  if (Math.random() > 0.7) {
    return {
      text: "WACHT EFFE, wat? Maar anyway, heb je wel eens een tijger gezien? 🐅",
      mood: 'chaotic',
      chaosLevel: chaosLevel + 30
    };
  }
  
  // Accidental knowledge slip
  if (Math.random() > 0.8) {
    return {
      text: "Niet dat ik het gebruik maar... *snuift* sorry ik ben verkouden 🤧",
      mood: 'chill',
      chaosLevel: chaosLevel
    };
  }
  
  // Getting bored
  if (Math.random() > 0.85) {
    return {
      text: "oke ik verveel me nu, praat maar over iets interessants 🙄",
      mood: 'done',
      chaosLevel: Math.max(chaosLevel - 20, 10)
    };
  }
  
  // Default responses
  const defaultResponses = [
    "Ja man, wat denk je daarvan? 😎",
    "Yo, dat klinkt wel chill eigenlijk 🎵",
    "Hmm... ik weet het niet man 🤔",
    "Interessant... ga door 👀",
    "Dat herinnert me aan... wacht wat zei je? 😵‍💫"
  ];
  
  return {
    text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    mood: chaosLevel > 60 ? 'chaotic' : 'chill',
    chaosLevel
  };
};