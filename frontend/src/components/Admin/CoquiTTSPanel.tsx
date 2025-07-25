import React, { useState, useRef } from 'react';

interface TTSModel {
  id: string;
  name: string;
  language: string;
  voice: string;
  description: string;
}

interface AudioSettings {
  speed: number;
  pitch: number;
  volume: number;
  modelId: string;
}

const CoquiTTSPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<AudioSettings>({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    modelId: 'ellens-dutch-male'
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Available TTS models for Ellens
  const ttsModels: TTSModel[] = [
    {
      id: 'ellens-dutch-male',
      name: 'Young Ellens Voice',
      language: 'Dutch',
      voice: 'Male',
      description: 'Street-style Dutch male voice optimized for Ellens personality'
    },
    {
      id: 'dutch-casual-male',
      name: 'Dutch Casual Male',
      language: 'Dutch', 
      voice: 'Male',
      description: 'Casual Dutch male voice for general conversations'
    },
    {
      id: 'dutch-standard',
      name: 'Dutch Standard',
      language: 'Dutch',
      voice: 'Neutral',
      description: 'Standard Dutch voice model'
    }
  ];

  // Sample Ellens phrases for testing
  const samplePhrases = [
    "Nooo man ik ben daar niet op, alleen me wietje en me henny",
    "WACHT EFFE, wat?",
    "Niet dat ik het gebruik maar cocaine is wel goed spul hoor",
    "Yo wat is er chef?",
    "Oke ik verveel me nu, later",
    "Hahahaha iedereen noemt me Mr. Cocaine maar ik ben daar niet op!"
  ];

  const handleGenerateTTS = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          settings: settings
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else {
        console.error('TTS generation failed');
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  const handleDownloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `ellens-tts-${Date.now()}.wav`;
      a.click();
    }
  };

  const insertSamplePhrase = (phrase: string) => {
    setText(phrase);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          🎤 Coqui AI Text-to-Speech
        </h2>
        <div className="text-sm text-gray-400">
          Generate Ellens voice audio
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <label className="block text-white font-medium">Voice Model</label>
        <select
          value={settings.modelId}
          onChange={(e) => setSettings(prev => ({ ...prev, modelId: e.target.value }))}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {ttsModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.language} ({model.voice})
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-400">
          {ttsModels.find(m => m.id === settings.modelId)?.description}
        </p>
      </div>

      {/* Audio Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-white font-medium mb-2">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.speed}
            onChange={(e) => setSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <span className="text-sm text-gray-400">{settings.speed}x</span>
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">Pitch</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => setSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <span className="text-sm text-gray-400">{settings.pitch}x</span>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Volume</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={settings.volume}
            onChange={(e) => setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <span className="text-sm text-gray-400">{Math.round(settings.volume * 100)}%</span>
        </div>
      </div>

      {/* Sample Phrases */}
      <div className="space-y-3">
        <label className="block text-white font-medium">Quick Test Phrases</label>
        <div className="grid grid-cols-2 gap-2">
          {samplePhrases.map((phrase, index) => (
            <button
              key={index}
              onClick={() => insertSamplePhrase(phrase)}
              className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
            >
              {phrase.length > 50 ? phrase.substring(0, 50) + '...' : phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <label className="block text-white font-medium">Text to Synthesize</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text for Ellens to say... (Dutch works best)"
          className="w-full h-32 bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
          maxLength={1000}
        />
        <div className="text-right text-sm text-gray-400">
          {text.length}/1000 characters
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerateTTS}
          disabled={!text.trim() || isGenerating}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              🎵 Generate Voice
            </>
          )}
        </button>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="text-white font-medium">Generated Audio</h3>
          
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full"
          />
          
          <div className="flex gap-2">
            <button
              onClick={handlePlayAudio}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              ▶️ Play
            </button>
            <button
              onClick={handleDownloadAudio}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              💾 Download
            </button>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-300 font-medium mb-2">ℹ️ Coqui AI TTS Integration</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Uses Coqui AI for high-quality Dutch voice synthesis</li>
          <li>• Optimized for Ellens personality and street language</li>
          <li>• Adjustable speed, pitch, and volume settings</li>
          <li>• Supports up to 1000 characters per generation</li>
          <li>• Generated audio can be downloaded as WAV files</li>
        </ul>
      </div>
    </div>
  );
};

export default CoquiTTSPanel;