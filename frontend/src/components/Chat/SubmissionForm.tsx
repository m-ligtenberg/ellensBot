import React, { useState } from 'react';

interface SubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess: () => void;
}

type SubmissionType = 'phrase' | 'response' | 'denial' | 'interruption' | 'slang';

interface SubmissionData {
  submission_type: SubmissionType;
  submitted_text: string;
  context_description: string;
  category: string;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ isOpen, onClose, onSubmissionSuccess }) => {
  const [formData, setFormData] = useState<SubmissionData>({
    submission_type: 'phrase',
    submitted_text: '',
    context_description: '',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submissionTypes = [
    { value: 'phrase', label: 'Phrase', description: 'A general phrase Ellens might say' },
    { value: 'denial', label: 'Drug Denial', description: 'A way to deny drug use (his specialty!)' },
    { value: 'interruption', label: 'Interruption', description: 'Something he says when interrupting' },
    { value: 'slang', label: 'Dutch Slang', description: 'Street language and expressions' },
    { value: 'response', label: 'Response', description: 'A reaction to specific situations' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.submitted_text.trim()) {
      setError('Please enter some text for Ellens to say');
      setIsSubmitting(false);
      return;
    }

    if (formData.submitted_text.length > 500) {
      setError('Text is too long (max 500 characters)');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_session_id: localStorage.getItem('user_session_id') || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Submission successful!');
        setFormData({
          submission_type: 'phrase',
          submitted_text: '',
          context_description: '',
          category: ''
        });
        onSubmissionSuccess();
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleInputChange = (field: keyof SubmissionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🎤 Teach Ellens New Words</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-green-900/20 border border-green-400/30 rounded-lg">
            <p className="text-green-300 text-sm">
              Help expand Ellens' personality! Submit phrases, denials, or slang that fit his chaotic street vibe. 
              All submissions are reviewed before being added to his vocabulary.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-400/30 rounded text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-400/30 rounded text-green-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type of Content
              </label>
              <select
                value={formData.submission_type}
                onChange={(e) => handleInputChange('submission_type', e.target.value as SubmissionType)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
              >
                {submissionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What should Ellens say? *
              </label>
              <textarea
                value={formData.submitted_text}
                onChange={(e) => handleInputChange('submitted_text', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                rows={4}
                maxLength={500}
                placeholder={
                  formData.submission_type === 'denial' 
                    ? 'e.g., "Nee man ik gebruik niks, alleen me wietje en henny"'
                    : formData.submission_type === 'interruption'
                    ? 'e.g., "WACHT EFFE, wat zeg je nou?"'
                    : 'e.g., "Dat is wel chill eigenlijk"'
                }
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {formData.submitted_text.length}/500 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                When should he use this?
              </label>
              <input
                type="text"
                value={formData.context_description}
                onChange={(e) => handleInputChange('context_description', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                placeholder={
                  formData.submission_type === 'denial'
                    ? 'When someone asks about drugs'
                    : formData.submission_type === 'interruption'
                    ? 'When interrupting someone mid-conversation'
                    : 'When would this phrase be appropriate?'
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mood/Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                placeholder="e.g., chill, chaotic, defensive, cool"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.submitted_text.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  '🚀 Submit to Ellens'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-white mb-2">💡 Tips for Good Submissions</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Use Dutch street slang and expressions</li>
              <li>• Keep Ellens' chaotic personality in mind</li>
              <li>• For denials: always deny but be obviously knowledgeable</li>
              <li>• Make it sound natural and authentic</li>
              <li>• Avoid offensive or harmful content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;