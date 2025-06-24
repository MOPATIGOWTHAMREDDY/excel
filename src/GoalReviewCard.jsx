import React, { useState } from 'react';
import ParameterBox from './ParameterBox';
import {
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';

function GoalReviewCard({ goal, isHighlighted, updateReviewedPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAgreedParams, setShowAgreedParams] = useState(false);
  const [, forceUpdate] = useState(); // for re-render

  const agreed = goal.parameters.filter((p) => p.status === 'agree');
  const disagreed = goal.parameters.filter((p) => p.status === 'disagree');
  const pending = goal.parameters.filter((p) => !['agree', 'disagree'].includes(p.status));

  const agreementPercentage =
    goal.parameters.length > 0
      ? Math.round((agreed.length / goal.parameters.length) * 100)
      : 0;

  const handleParameterUpdate = (updatedParam) => {
    const prompt = goal.__promptRef;
    
    // Find and update the parameter in the goal
    const goalParamIndex = goal.parameters.findIndex(p => p.fullKey === updatedParam.fullKey);
    if (goalParamIndex !== -1) {
      // FIXED: Create new array instead of mutating
      goal.parameters = goal.parameters.map((param, index) => 
        index === goalParamIndex ? { ...updatedParam } : param
      );
    }
    
    // FIXED: Also update the original prompt parameters properly
    if (prompt && prompt.parameters) {
      const promptParamIndex = prompt.parameters.findIndex(p => p.fullKey === updatedParam.fullKey);
      if (promptParamIndex !== -1) {
        prompt.parameters = prompt.parameters.map((param, index) => 
          index === promptParamIndex ? { ...updatedParam } : param
        );
      }
    }

    // Check if all parameters are resolved
    const allResolved = goal.parameters.every(p =>
      ['agree', 'disagree'].includes(p.status)
    );

    if (allResolved) {
      prompt.goalsReviewed = true;
      if (prompt.metadataReviewed && prompt.goalsReviewed) {
        prompt.reviewed = true;
      }
    }

    // Update the reviewed prompt
    if (updateReviewedPrompt) {
      updateReviewedPrompt({ ...prompt });
    }

    // Force re-render
    forceUpdate({});
  };

  const getStatusColor = () => {
    if (disagreed.length > 0) return 'border-red-200 bg-red-50';
    if (pending.length > 0) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  const getHeaderColor = () => {
    if (isHighlighted) return 'bg-red-100';
    if (disagreed.length > 0) return 'bg-red-50';
    if (pending.length > 0) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${
      isHighlighted ? 'border-red-200 bg-red-50' : getStatusColor()
    }`}>
      {/* Header */}
      <div
        className={`p-4 cursor-pointer flex justify-between items-center hover:opacity-90 transition-opacity ${
          getHeaderColor()
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {disagreed.length > 0 ? (
            <FiAlertCircle className="text-red-500 text-xl" />
          ) : pending.length > 0 ? (
            <FiAlertCircle className="text-yellow-500 text-xl" />
          ) : (
            <FiCheckCircle className="text-green-500 text-xl" />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              <span className="text-indigo-700">{goal.name.replace(/_/g, ' ')}</span>
            </h3>
            <p className="text-gray-700 text-sm mt-1">{goal.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status Badges */}
          <div className="flex items-center space-x-2">
            {disagreed.length > 0 && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                {disagreed.length} Disagreement{disagreed.length !== 1 ? 's' : ''}
              </span>
            )}
            {pending.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                {pending.length} Pending
              </span>
            )}
            {agreed.length > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                {agreed.length} Agreed
              </span>
            )}
          </div>
          
          <span className="text-sm text-gray-500 font-medium">
            {agreementPercentage}% Complete
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHelp(!showHelp);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

      {/* Help Section */}
      {showHelp && (
        <div className="px-4 py-3 bg-blue-50 text-blue-700 text-sm border-t border-blue-100">
          <div className="flex items-start space-x-2">
            <FiInfo className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Review Instructions:</p>
              <ul className="text-xs space-y-1 ml-2">
                <li>• <strong>Agree:</strong> Parameter annotation is correct</li>
                <li>• <strong>Disagree:</strong> Parameter needs revision - add comment explaining why</li>
                <li>• <strong>Revert:</strong> Use original user answer instead of annotator answer</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Pending Parameters (Show First) */}
          {pending.length > 0 && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="font-semibold text-yellow-700 flex items-center mb-3">
                <FiAlertCircle className="mr-2" />
                Needs Review ({pending.length})
              </h4>
              <div className="space-y-3">
                {pending.map((param, idx) => (
                  <ParameterBox
                    key={`pending-${param.fullKey}-${idx}`}
                    param={param}
                    onStatusChange={handleParameterUpdate}
                    isPending={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Disagreed Parameters */}
          {disagreed.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-semibold text-red-600 flex items-center mb-3">
                <FiAlertCircle className="mr-2" />
                Disagreements ({disagreed.length})
              </h4>
              <div className="space-y-3">
                {disagreed.map((param, idx) => (
                  <ParameterBox
                    key={`disagree-${param.fullKey}-${idx}`}
                    param={param}
                    isDisagreement={true}
                    onStatusChange={handleParameterUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agreed Parameters (Collapsible) */}
          {agreed.length > 0 && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-600 flex items-center">
                  <FiCheckCircle className="mr-2" />
                  Agreed Parameters ({agreed.length})
                </h4>
                <button
                  onClick={() => setShowAgreedParams(!showAgreedParams)}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                >
                  {showAgreedParams ? <FiEyeOff /> : <FiEye />}
                  <span>{showAgreedParams ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              
              {showAgreedParams && (
                <div className="space-y-3">
                  {agreed.map((param, idx) => (
                    <ParameterBox 
                      key={`agree-${param.fullKey}-${idx}`} 
                      param={param} 
                      readonly={true}
                    />
                  ))}
                </div>
              )}
              
              {!showAgreedParams && (
                <div className="text-center text-green-600 py-2 text-sm">
                  {agreed.length} parameter{agreed.length !== 1 ? 's' : ''} approved
                </div>
              )}
            </div>
          )}

          {/* No Parameters Message */}
          {goal.parameters.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <FiInfo className="mx-auto mb-2 text-2xl" />
              <p>No parameters found for this goal</p>
            </div>
          )}

          {/* Footer Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-700">{goal.parameters.length}</div>
                <div className="text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{agreed.length}</div>
                <div className="text-gray-500">Agreed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{disagreed.length}</div>
                <div className="text-gray-500">Disagreed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{pending.length}</div>
                <div className="text-gray-500">Pending</div>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                disagreed.length > 0 
                  ? 'bg-red-100 text-red-700'
                  : pending.length > 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                {disagreed.length > 0 
                  ? 'Needs Attention' 
                  : pending.length > 0 
                    ? 'In Progress'
                    : 'Complete'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalReviewCard;