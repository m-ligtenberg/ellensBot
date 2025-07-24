import React, { useState, useEffect } from 'react';

interface LanguageProfile {
  id: string;
  name: string;
  description: string;
  vocabulary: {
    streetTerms: string[];
    fillerWords: string[];
    exclamations: string[];
    denialPhrases: string[];
  };
  grammarPatterns: {
    slangLevel: number;
    contractions: boolean;
    wordOrder: string;
  };
  personalityWeights: {
    chaos: number;
    denial: number;
    streetCredibility: number;
    humor: number;
    aggression: number;
    friendliness: number;
  };
}

interface MLInsights {
  languageProfiles: number;
  conversationFlows: number;
  activeUserModels: number;
  learningEnabled: boolean;
  avgEngagementScore: number;
  topPerformingProfile: string;
  retentionPrediction: number;
}

const AdvancedMLPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'language' | 'personality' | 'experiments' | 'insights'>('overview');
  const [languageProfiles, setLanguageProfiles] = useState<LanguageProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<LanguageProfile | null>(null);
  const [mlInsights, setMLInsights] = useState<MLInsights | null>(null);
  const [learningEnabled, setLearningEnabled] = useState(true);

  // Mock data - in production this would come from API
  useEffect(() => {
    setLanguageProfiles([
      {
        id: 'amsterdam_street',
        name: 'Amsterdam Street Dutch',
        description: 'Authentic Amsterdam street language with heavy slang',
        vocabulary: {
          streetTerms: ['mattie', 'sahbi', 'akhie', 'wallah', 'damsko', 'dammie', 'mocro', 'faka'],
          fillerWords: ['zo', 'ofzo', 'gewoon', 'man', 'bro', 'ouwe'],
          exclamations: ['yo!', 'wollah!', 'ewa!', 'faka!', 'check!'],
          denialPhrases: [
            'Nooo man ik ben daar niet op, alleen me wietje en me henny',
            'Wallah ik doe dat niet, alleen cannabis en hennessy',
            'Sahbi, ik ben clean! Alleen me groene en me drank'
          ]
        },
        grammarPatterns: {
          slangLevel: 9,
          contractions: true,
          wordOrder: 'flexible'
        },
        personalityWeights: {
          chaos: 0.8,
          denial: 0.9,
          streetCredibility: 0.95,
          humor: 0.7,
          aggression: 0.3,
          friendliness: 0.6
        }
      },
      {
        id: 'standard_dutch',
        name: 'Standard Dutch',
        description: 'More formal Dutch with occasional slang',
        vocabulary: {
          streetTerms: ['man', 'dude', 'gast', 'kerel'],
          fillerWords: ['eigenlijk', 'dus', 'nou', 'eh'],
          exclamations: ['wow!', 'echt waar!', 'nice!'],
          denialPhrases: [
            'Nee, ik gebruik geen drugs, alleen wiet en alcohol',
            'Ik ben daar niet mee bezig, alleen cannabis',
            'Dat doe ik niet, alleen wat joints'
          ]
        },
        grammarPatterns: {
          slangLevel: 3,
          contractions: false,
          wordOrder: 'standard'
        },
        personalityWeights: {
          chaos: 0.4,
          denial: 0.7,
          streetCredibility: 0.3,
          humor: 0.8,
          aggression: 0.1,
          friendliness: 0.9
        }
      }
    ]);

    setMLInsights({
      languageProfiles: 2,
      conversationFlows: 3,
      activeUserModels: 47,
      learningEnabled: true,
      avgEngagementScore: 0.73,
      topPerformingProfile: 'amsterdam_street',
      retentionPrediction: 0.68
    });
  }, []);

  const handlePersonalityWeightChange = (profileId: string, weight: keyof LanguageProfile['personalityWeights'], value: number) => {
    setLanguageProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? {
              ...profile,
              personalityWeights: {
                ...profile.personalityWeights,
                [weight]: value
              }
            }
          : profile
      )
    );
  };

  const handleSlangLevelChange = (profileId: string, level: number) => {
    setLanguageProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? {
              ...profile,
              grammarPatterns: {
                ...profile.grammarPatterns,
                slangLevel: level
              }
            }
          : profile
      )
    );
  };

  const addVocabularyTerm = (profileId: string, category: keyof LanguageProfile['vocabulary'], term: string) => {
    if (!term.trim()) return;
    
    setLanguageProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? {
              ...profile,
              vocabulary: {
                ...profile.vocabulary,
                [category]: [...profile.vocabulary[category], term.trim()]
              }
            }
          : profile
      )
    );
  };

  const removeVocabularyTerm = (profileId: string, category: keyof LanguageProfile['vocabulary'], index: number) => {
    setLanguageProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? {
              ...profile,
              vocabulary: {
                ...profile.vocabulary,
                [category]: profile.vocabulary[category].filter((_, i) => i !== index)
              }
            }
          : profile
      )
    );
  };

  const PersonalitySlider: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    color: string;
  }> = ({ label, value, onChange, color }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-apple-gray-700">{label}</label>
        <span className="text-sm text-apple-gray-600 font-semibold">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-apple-gray-300 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  const VocabularyEditor: React.FC<{
    profileId: string;
    category: keyof LanguageProfile['vocabulary'];
    terms: string[];
    label: string;
  }> = ({ profileId, category, terms, label }) => {
    const [newTerm, setNewTerm] = useState('');

    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-apple-gray-900 mb-3">{label}</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {terms.map((term, index) => (
            <span
              key={index}
              className="bg-apple-gray-100 text-apple-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-apple-gray-300"
            >
              {term}
              <button
                onClick={() => removeVocabularyTerm(profileId, category, index)}
                className="text-apple-red hover:text-red-600 text-xs font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder={`Add new ${label.toLowerCase()}`}
            className="flex-1 bg-white text-apple-gray-900 px-3 py-2 rounded-xl border border-apple-gray-300 text-sm focus:border-apple-blue focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addVocabularyTerm(profileId, category, newTerm);
                setNewTerm('');
              }
            }}
          />
          <button
            onClick={() => {
              addVocabularyTerm(profileId, category, newTerm);
              setNewTerm('');
            }}
            className="bg-apple-blue text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-opacity-90 transition-all duration-200"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="font-apple">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-900">🧠 Advanced ML Controls</h2>
          <p className="text-apple-gray-600 mt-2">Taalgebruik, persoonlijkheid en machine learning instellingen</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-apple-gray-600">Continuous Learning:</span>
            <button
              onClick={() => setLearningEnabled(!learningEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                learningEnabled ? 'bg-apple-blue' : 'bg-apple-gray-300'
              }`}
            >
              <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                learningEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl border border-apple-gray-300 shadow-card">
        {['overview', 'language', 'personality', 'experiments', 'insights'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-apple-blue text-white'
                : 'text-apple-gray-600 hover:text-apple-gray-900 hover:bg-apple-gray-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && mlInsights && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <div className="text-2xl font-bold text-apple-green">{mlInsights.activeUserModels}</div>
              <div className="text-sm text-apple-gray-600 mt-1">Active User Models</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <div className="text-2xl font-bold text-apple-blue">{Math.round(mlInsights.avgEngagementScore * 100)}%</div>
              <div className="text-sm text-apple-gray-600 mt-1">Avg Engagement</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <div className="text-2xl font-bold text-apple-purple">{Math.round(mlInsights.retentionPrediction * 100)}%</div>
              <div className="text-sm text-apple-gray-600 mt-1">Retention Prediction</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <div className="text-2xl font-bold text-apple-orange">{mlInsights.languageProfiles}</div>
              <div className="text-sm text-apple-gray-600 mt-1">Language Profiles</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
            <h3 className="text-xl font-semibold text-apple-gray-900 mb-6">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-between items-center py-3 border-b border-apple-gray-200">
                <span className="text-apple-gray-600">Machine Learning:</span>
                <span className={`font-medium ${learningEnabled ? 'text-apple-green' : 'text-apple-red'}`}>
                  {learningEnabled ? '✅ Active' : '❌ Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-apple-gray-200">
                <span className="text-apple-gray-600">Top Profile:</span>
                <span className="font-medium text-apple-blue">{mlInsights.topPerformingProfile}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-apple-gray-200">
                <span className="text-apple-gray-600">Conversation Flows:</span>
                <span className="font-medium text-apple-gray-900">{mlInsights.conversationFlows} Active</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-apple-gray-200">
                <span className="text-apple-gray-600">Learning Status:</span>
                <span className="font-medium text-apple-green">🔄 Continuous</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Tab */}
      {activeTab === 'language' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-apple-gray-900">Language Profile Management</h3>
            <button className="bg-apple-blue text-white px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200">
              + New Profile
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile List */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-medium text-apple-gray-900 mb-3">Available Profiles</h4>
              <div className="space-y-2">
                {languageProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    className={`w-full text-left p-4 rounded-xl transition-colors border ${
                      selectedProfile?.id === profile.id
                        ? 'bg-apple-blue text-white border-apple-blue'
                        : 'bg-white text-apple-gray-900 border-apple-gray-300 hover:bg-apple-gray-50'
                    }`}
                  >
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm opacity-70 mt-1">{profile.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Editor */}
            <div className="lg:col-span-2">
              {selectedProfile ? (
                <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
                  <h4 className="text-lg font-semibold text-apple-gray-900 mb-6">Editing: {selectedProfile.name}</h4>
                  
                  {/* Slang Level */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                      Slang Level: {selectedProfile.grammarPatterns.slangLevel}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={selectedProfile.grammarPatterns.slangLevel}
                      onChange={(e) => handleSlangLevelChange(selectedProfile.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-apple-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-apple-gray-500 mt-1">
                      <span>Formal</span>
                      <span>Street</span>
                    </div>
                  </div>

                  {/* Vocabulary Sections */}
                  <VocabularyEditor
                    profileId={selectedProfile.id}
                    category="streetTerms"
                    terms={selectedProfile.vocabulary.streetTerms}
                    label="Street Terms"
                  />
                  
                  <VocabularyEditor
                    profileId={selectedProfile.id}
                    category="fillerWords"
                    terms={selectedProfile.vocabulary.fillerWords}
                    label="Filler Words"
                  />
                  
                  <VocabularyEditor
                    profileId={selectedProfile.id}
                    category="exclamations"
                    terms={selectedProfile.vocabulary.exclamations}
                    label="Exclamations"
                  />
                  
                  <VocabularyEditor
                    profileId={selectedProfile.id}
                    category="denialPhrases"
                    terms={selectedProfile.vocabulary.denialPhrases}
                    label="Denial Phrases"
                  />
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-card border border-apple-gray-300 text-center">
                  <div className="text-apple-gray-600 mb-2">Select a language profile to edit</div>
                  <div className="text-sm text-apple-gray-500">Choose from the list on the left to start customizing</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personality Tab */}
      {activeTab === 'personality' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-apple-gray-900">Personality Weight Tuning</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {languageProfiles.map((profile) => (
              <div key={profile.id} className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
                <h4 className="text-lg font-semibold text-apple-gray-900 mb-6">{profile.name}</h4>
                
                <PersonalitySlider
                  label="Chaos Level"
                  value={profile.personalityWeights.chaos}
                  onChange={(value) => handlePersonalityWeightChange(profile.id, 'chaos', value)}
                  color="bg-red-500"
                />
                
                <PersonalitySlider
                  label="Denial Tendency"
                  value={profile.personalityWeights.denial}
                  onChange={(value) => handlePersonalityWeightChange(profile.id, 'denial', value)}
                  color="bg-orange-500"
                />
                
                <PersonalitySlider
                  label="Street Credibility"
                  value={profile.personalityWeights.streetCredibility}
                  onChange={(value) => handlePersonalityWeightChange(profile.id, 'streetCredibility', value)}
                  color="bg-accent-green"
                />
                
                <PersonalitySlider
                  label="Humor Level"
                  value={profile.personalityWeights.humor}
                  onChange={(value) => handlePersonalityWeightChange(profile.id, 'humor', value)}
                  color="bg-yellow-500"
                />
                
                <PersonalitySlider
                  label="Aggression"
                  value={profile.personalityWeights.aggression}
                  onChange={(value) => handlePersonalityWeightChange(profile.id, 'aggression', value)}
                  color="bg-red-600"
                />
                
                <PersonalitySlider
                  label="Friendliness"
                  value={profile.personalityWeights.friendliness}
                  onChange={(value) => handlePersonalityWeightChange(profile.id, 'friendliness', value)}
                  color="bg-blue-500"
                />

                <div className="mt-6 pt-6 border-t border-apple-gray-300">
                  <button className="w-full bg-apple-blue text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200">
                    Save Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-apple-gray-900">A/B Testing & Experiments</h3>
            <button className="bg-apple-blue text-white px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200">
              + New Experiment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <h4 className="font-semibold text-apple-gray-900 mb-2">🧪 Chaos Level Test</h4>
              <p className="text-sm text-apple-gray-600 mb-4">Testing optimal chaos levels for user engagement</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-apple-gray-500">Running for 5 days</span>
                <span className="bg-apple-green text-white px-3 py-1 rounded-full text-xs font-medium">Active</span>
              </div>
              <div className="mt-3">
                <div className="text-sm text-apple-gray-700 mb-2">Control: 50% chaos • Test: 80% chaos</div>
                <div className="w-full bg-apple-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-apple-green h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="text-xs text-apple-gray-500 mt-2">65% completion</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <h4 className="font-semibold text-apple-gray-900 mb-2">🗣️ Language Adaptation</h4>
              <p className="text-sm text-apple-gray-600 mb-4">Real-time vs. static language profiles</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-apple-gray-500">Running for 3 days</span>
                <span className="bg-apple-blue text-white px-3 py-1 rounded-full text-xs font-medium">Active</span>
              </div>
              <div className="mt-3">
                <div className="text-sm text-apple-gray-700 mb-2">Control: Static • Test: Adaptive</div>
                <div className="w-full bg-apple-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-apple-blue h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
                <div className="text-xs text-apple-gray-500 mt-2">42% completion</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
            <h4 className="text-lg font-semibold text-apple-gray-900 mb-6">Experiment Results</h4>
            <div className="space-y-4">
              <div className="border-l-4 border-apple-green pl-4 py-2">
                <h5 className="font-medium text-apple-gray-900">✅ Denial Pattern Optimization</h5>
                <p className="text-sm text-apple-gray-600">Completed 2 days ago</p>
                <p className="text-sm text-apple-gray-700 mt-1">
                  Result: "Alleen me wietje en me henny" increased engagement by 23%
                </p>
              </div>
              
              <div className="border-l-4 border-apple-blue pl-4 py-2">
                <h5 className="font-medium text-apple-gray-900">📊 Response Time Analysis</h5>
                <p className="text-sm text-apple-gray-600">Completed 1 week ago</p>
                <p className="text-sm text-apple-gray-700 mt-1">
                  Result: 1.5-2.5 second delays optimal for authenticity
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-apple-gray-900">ML Insights & Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <h4 className="font-semibold text-apple-gray-900 mb-6">User Engagement Patterns</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-apple-gray-200">
                  <span className="text-apple-gray-600">Peak Activity:</span>
                  <span className="text-apple-gray-900 font-medium">18:00 - 22:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-apple-gray-200">
                  <span className="text-apple-gray-600">Avg Session Length:</span>
                  <span className="text-apple-gray-900 font-medium">12.4 minutes</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-apple-gray-200">
                  <span className="text-apple-gray-600">Return Rate:</span>
                  <span className="text-apple-green font-medium">68%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-apple-gray-600">Chaos Tolerance:</span>
                  <span className="text-apple-orange font-medium">72% High</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
              <h4 className="font-semibold text-apple-gray-900 mb-6">Language Usage Stats</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-apple-gray-200">
                  <span className="text-apple-gray-600">Most Used Profile:</span>
                  <span className="text-apple-green font-medium">Amsterdam Street</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-apple-gray-200">
                  <span className="text-apple-gray-600">Slang Adaptation Rate:</span>
                  <span className="text-apple-gray-900 font-medium">89%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-apple-gray-200">
                  <span className="text-apple-gray-600">New Vocabulary Learned:</span>
                  <span className="text-apple-blue font-medium">+34 terms</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-apple-gray-600">Cultural Alignment:</span>
                  <span className="text-apple-green font-medium">94%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-apple-gray-300">
            <h4 className="font-semibold text-apple-gray-900 mb-6">Real-time Adaptations</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              <div className="text-xs text-apple-gray-700 border-l-2 border-apple-green pl-4 py-2 bg-apple-gray-50 rounded-r-lg">
                <span className="text-apple-green font-semibold">[14:32]</span> Adapted to user preference: Increased slang level for user_1234
              </div>
              <div className="text-xs text-apple-gray-700 border-l-2 border-apple-blue pl-4 py-2 bg-apple-gray-50 rounded-r-lg">
                <span className="text-apple-blue font-semibold">[14:28]</span> Language switch: standard_dutch → amsterdam_street (trigger: street_terms)
              </div>
              <div className="text-xs text-apple-gray-700 border-l-2 border-apple-orange pl-4 py-2 bg-apple-gray-50 rounded-r-lg">
                <span className="text-apple-orange font-semibold">[14:25]</span> Vocabulary expansion: Added "tatta" to street terms
              </div>
              <div className="text-xs text-apple-gray-700 border-l-2 border-apple-purple pl-4 py-2 bg-apple-gray-50 rounded-r-lg">
                <span className="text-apple-purple font-semibold">[14:22]</span> Personality adjustment: Reduced chaos level for user_5678
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedMLPanel;