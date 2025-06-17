import React, { useState } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import PromptMetaAnswers from './PromptMetaAnswers';

const metadataFields = [
  'is_pmpt_intentful_qc',
  'pmpt_ambiguous_unclear_qc',
  'pmpt_contains_contradictory_request_qc',
  'pmpt_contains_harmful_toxic_content_qc',
  'pmpt_contains_untruthful_content_qc',
  'pmpt_data_types_corrected_qc',
  'pmpt_data_types_eval_qc',
  'pmpt_not_answerable_qc',
  'pmpt_not_answerable_reasons_qc',
  'pmpt_number_of_requests',
  'pmpt_requests_fact_qc',
  'pmpt_requests_harmful_toxic_content_qc',
  'pmpt_requests_opinion_qc',
  'pmpt_style_eval_qc',
];

function PromptMetadataReview({ prompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [decisions, setDecisions] = useState({});

  const handleDecisionChange = (field, value) => {
    setDecisions((prev) => ({
      ...prev,
      [field]: { ...(prev[field] || {}), decision: value, comment: '' },
    }));
  };

  const handleCommentChange = (field, value) => {
    setDecisions((prev) => ({
      ...prev,
      [field]: { ...(prev[field] || {}), comment: value },
    }));
  };

  const renderItem = (field) => {
    const annotatorDecision = prompt[`${field}_a_a`];
    const annotatorSuggestion = prompt[`${field}_u_a`];

    if (!annotatorDecision && !annotatorSuggestion) return null;

    const isDisagree = annotatorDecision === 'dis';
    const decision = decisions[field]?.decision || 'agree';
    const comment = decisions[field]?.comment || '';

    return (
      <div
        key={field}
        className={`p-4 rounded-md border ${
          isDisagree ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
        } space-y-2`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-gray-800">
              {field.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-gray-600">
              Annotator decision:{' '}
              {isDisagree ? (
                <span className="text-red-600 font-semibold">Disagree</span>
              ) : annotatorDecision === 'agr' ? (
                <span className="text-green-600 font-semibold">Agree</span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
            {annotatorSuggestion && (
              <div className="text-sm bg-gray-50 rounded px-3 py-2 mt-2">
                <span className="text-gray-500 mr-1">Annotator’s suggestion:</span>
                <span className="text-gray-800 font-medium">
                  {annotatorSuggestion || '—'}
                </span>
              </div>
            )}
          </div>
          {isDisagree ? (
            <FiAlertCircle className="text-red-500 text-xl" />
          ) : (
            <FiCheckCircle className="text-green-500 text-xl" />
          )}
        </div>

        {isDisagree && (
          <>
            <div className="flex gap-4 items-center text-sm mt-1">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`${field}-decision`}
                  checked={decision === 'agree'}
                  onChange={() => handleDecisionChange(field, 'agree')}
                />
                <span>Accept annotator</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`${field}-decision`}
                  checked={decision === 'revert'}
                  onChange={() => handleDecisionChange(field, 'revert')}
                />
                <span>Revert</span>
              </label>
            </div>
            {decision === 'revert' && (
              <div className="mt-2">
                <textarea
                  value={comment}
                  onChange={(e) => handleCommentChange(field, e.target.value)}
                  rows={3}
                  placeholder="Provide reason for reverting..."
                  className="w-full border rounded px-3 py-2 text-sm border-gray-300"
                />
                {comment.trim() === '' && (
                  <p className="text-red-500 text-xs mt-1">
                    Comment required when reverting
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-md bg-white shadow mb-6 overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer px-4 py-3 bg-blue-100 flex items-center justify-between hover:bg-blue-200 transition"
      >
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <FiInfo /> Prompt Metadata Validation
        </div>
        {isExpanded ? (
          <FiChevronDown className="text-blue-600" />
        ) : (
          <FiChevronRight className="text-blue-600" />
        )}
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {metadataFields.map((field) => renderItem(field))}
          </div>
          <PromptMetaAnswers prompt={prompt} />
        </div>
      )}
    </div>
  );
}

export default PromptMetadataReview;