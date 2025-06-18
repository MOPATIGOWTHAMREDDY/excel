import React, { useState } from 'react';
import ParameterBox from './ParameterBox';
import {
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';

function GoalReviewCard({ goal, isHighlighted, updateReviewedPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [, forceUpdate] = useState(); // for re-render

  const agreed = goal.parameters.filter((p) => p.status === 'agree');
  const disagreed = goal.parameters.filter((p) => p.status === 'disagree');

  const agreementPercentage =
    goal.parameters.length > 0
      ? Math.round((agreed.length / goal.parameters.length) * 100)
      : 0;

  const handleParameterUpdate = (updatedParam) => {
    const index = goal.parameters.findIndex(p => p.fullKey === updatedParam.fullKey);
    if (index !== -1) {
      goal.parameters[index] = updatedParam;

      const allResolved = goal.parameters.every(p =>
        ['agree', 'disagree'].includes(p.status)
      );

      const prompt = goal.__promptRef;
      if (allResolved) {
        prompt.goalsReviewed = true;
        if (prompt.metadataReviewed && prompt.goalsReviewed) {
          prompt.reviewed = true;
        }
        updateReviewedPrompt?.(prompt);
      }

      forceUpdate({});
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${
      isHighlighted ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
    }`}>
      <div
        className={`p-4 cursor-pointer flex justify-between items-center ${
          isHighlighted ? 'bg-red-100' : 'bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {disagreed.length > 0 ? (
            <FiAlertCircle className="text-red-500 text-xl" />
          ) : (
            <FiCheckCircle className="text-green-500 text-xl" />
          )}
          <h3 className="text-lg font-semibold">
            <span className="text-indigo-700">{goal.name.replace(/_/g, ' ')}</span>:
            <span className="text-gray-700 ml-1">{goal.description}</span>
          </h3>
        </div>

        <div className="flex items-center space-x-4">
          {disagreed.length > 0 && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm">
              {disagreed.length} Disagreement{disagreed.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-sm text-gray-500">
            {agreementPercentage}% Agreement
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHelp(!showHelp);
            }}
            className="text-gray-400 hover:text-gray-600"
            title="Show help"
          >
            <FiInfo />
          </button>
          {isExpanded ? (
            <FiChevronUp className="text-gray-500" />
          ) : (
            <FiChevronDown className="text-gray-500" />
          )}
        </div>
      </div>

      {showHelp && (
        <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm border-t">
          This section shows all parameters for this goal. Disagreements require your attention.
        </div>
      )}

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✅ Agreed Parameters */}
          <div className={`border rounded-lg p-4 ${
            disagreed.length === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold text-green-600 flex items-center mb-3">
              <FiCheckCircle className="mr-2" />
              Agreed Parameters ({agreed.length})
            </h4>
            {agreed.length > 0 ? (
              <div className="space-y-3">
                {agreed.map((param, idx) => (
                  <ParameterBox key={`agree-${idx}`} param={param} readonly />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No agreements found
              </div>
            )}
          </div>

          {/* ❗ Disagreed Parameters */}
          <div className={`border rounded-lg p-4 ${
            disagreed.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold text-red-600 flex items-center mb-3">
              <FiAlertCircle className="mr-2" />
              Disagreements ({disagreed.length})
            </h4>
            {disagreed.length > 0 ? (
              <div className="space-y-3">
                {disagreed.map((param, idx) => (
                  <ParameterBox
                    key={`disagree-${idx}`}
                    param={param}
                    isDisagreement
                    onStatusChange={handleParameterUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No disagreements found
              </div>
            )}
          </div>

          {/* Footer Summary */}
          <div className="mt-4 pt-3 border-t text-sm text-gray-500 flex justify-between col-span-full">
            <div>
              Total Parameters: <strong>{goal.parameters.length}</strong>
            </div>
            <div>
              Agreement Rate: <strong>{agreementPercentage}%</strong>
            </div>
            <div>
              Status: <strong>
                {disagreed.length > 0 ? 'Needs Review' : 'Approved'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalReviewCard;
