import React from 'react';
import { usePersonalityUpdates } from '../../hooks/usePersonalityUpdates';

const PersonalityUpdates: React.FC = () => {
  const { updates, isLoading, error, getUpdateIcon, getUpdateColor, formatTimeAgo } = usePersonalityUpdates(6);

  if (error) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-apple-red mb-2">⚠️ Updates Error</h3>
        <p className="text-apple-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full font-apple">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-apple-gray-900 flex items-center">
          🔄 Recent Updates
        </h3>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-apple-blue"></div>
        )}
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-apple-gray-500 text-sm text-center py-8">
            <div className="text-3xl mb-2">🔄</div>
            <p>No recent updates</p>
          </div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="bg-apple-gray-50 rounded-xl p-4 border border-apple-gray-200">
              <div className="flex items-start space-x-3">
                <span className="text-xl">{getUpdateIcon(update.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-apple-gray-900 leading-relaxed font-medium">
                    {update.message}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-apple-blue font-medium">
                      {update.source}
                    </span>
                    <span className="text-apple-gray-500">
                      {formatTimeAgo(update.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-apple-gray-300">
        <p className="text-xs text-apple-gray-500 text-center">
          Updates refresh automatically every minute
        </p>
      </div>
    </div>
  );
};

export default PersonalityUpdates;