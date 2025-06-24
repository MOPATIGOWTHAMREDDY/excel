import React, { useState, useMemo } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiEye,
  FiEyeOff,
  FiSave,
  FiCheck,
  FiX,
  FiRefreshCw
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

function PromptMetadataReview({ prompt, updateReviewedPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [decisions, setDecisions] = useState({});
  const [showSaved, setShowSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'disagree', 'agree', 'pending'
  const [showOnlyWithSuggestions, setShowOnlyWithSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Enhanced filtering and search logic
  const filteredFields = useMemo(() => {
    return metadataFields.filter(field => {
      const annotatorDecision = prompt[`${field}_a_a`];
      const annotatorSuggestion = prompt[`${field}_u_a`];
      
      // Skip if no data
      if (!annotatorDecision && !annotatorSuggestion) return false;
      
      // Search filter
      if (searchTerm && !field.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      const isDisagree = annotatorDecision === 'dis';
      const isAgree = annotatorDecision === 'agr';
      const decision = decisions[field]?.decision || prompt[`${field}_review_decision`] || 'agree';
      const isPending = isDisagree && !decisions[field]?.decision && !prompt[`${field}_review_decision`];
      
      if (filterType === 'disagree' && !isDisagree) return false;
      if (filterType === 'agree' && !isAgree) return false;
      if (filterType === 'pending' && !isPending) return false;
      
      // Suggestions filter
      if (showOnlyWithSuggestions && !annotatorSuggestion) return false;
      
      return true;
    });
  }, [searchTerm, filterType, showOnlyWithSuggestions, prompt, decisions]);

  // Statistics
  const stats = useMemo(() => {
    const total = metadataFields.filter(field => 
      prompt[`${field}_a_a`] || prompt[`${field}_u_a`]
    ).length;
    
    const disagreements = metadataFields.filter(field => 
      prompt[`${field}_a_a`] === 'dis'
    ).length;
    
    const agreements = metadataFields.filter(field => 
      prompt[`${field}_a_a`] === 'agr'
    ).length;
    
    const pending = metadataFields.filter(field => {
      const isDisagree = prompt[`${field}_a_a`] === 'dis';
      const hasDecision = decisions[field]?.decision || prompt[`${field}_review_decision`];
      return isDisagree && !hasDecision;
    }).length;
    
    const withSuggestions = metadataFields.filter(field => 
      prompt[`${field}_u_a`]
    ).length;
    
    return { total, disagreements, agreements, pending, withSuggestions };
  }, [prompt, decisions]);

  const handleDecisionChange = (field, value) => {
    setDecisions((prev) => {
      const updated = {
        ...prev,
        [field]: {
          ...(prev[field] || {}),
          decision: value,
          comment: prev[field]?.comment || '',
        },
      };
      prompt[`${field}_review_decision`] = value;
      return updated;
    });
  };

  const handleCommentChange = (field, value) => {
    setDecisions((prev) => {
      const updated = {
        ...prev,
        [field]: {
          ...(prev[field] || {}),
          comment: value,
        },
      };
      prompt[`${field}_review_comment`] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let valid = true;

    for (const field of metadataFields) {
      const annotatorDecision = prompt[`${field}_a_a`];
      const isDisagree = annotatorDecision === 'dis';
      const decision = decisions[field]?.decision || 'agree';
      const comment = decisions[field]?.comment || '';

      if (isDisagree && decision === 'revert' && comment.trim() === '') {
        valid = false;
        break;
      }

      prompt[`${field}_review_decision`] = decision;
      prompt[`${field}_review_comment`] = comment;
    }

    if (!valid) {
      alert('Please add a comment for all reverted metadata fields.');
      setIsSaving(false);
      return;
    }

    prompt.metadataReviewed = true;

    const hasGoalDisagreements = (prompt.parameters || []).some(param => param.annotatorAnswer === 'dis');
    
    if (hasGoalDisagreements) {
      if (prompt.goalsReviewed) {
        prompt.reviewed = true;
      }
    } else {
      prompt.reviewed = true;
    }

    updateReviewedPrompt?.(prompt);

    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setShowOnlyWithSuggestions(false);
  };

  const formatFieldName = (field) => {
    return field
      .replace(/_/g, ' ')
      .replace(/qc/g, 'QC')
      .replace(/pmpt/g, 'Prompt')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderItem = (field) => {
    const annotatorDecision = prompt[`${field}_a_a`];
    const annotatorSuggestion = prompt[`${field}_u_a`];

    if(annotatorDecision === 'dis'){
      console.log(`found meta disagreement : ${field}_a_a = ${annotatorDecision}`)
    }

    if (!annotatorDecision && !annotatorSuggestion) return null;

    const isDisagree = annotatorDecision === 'dis';
    const decision = decisions[field]?.decision || prompt[`${field}_review_decision`] || 'agree';
    const comment = decisions[field]?.comment || prompt[`${field}_review_comment`] || '';

    return (
      <div
        key={field}
        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
          isDisagree 
            ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-25 hover:border-red-300' 
            : 'border-green-200 bg-gradient-to-r from-green-50 to-green-25 hover:border-green-300'
        } space-y-3`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-800 text-sm">
                {formatFieldName(field)}
              </h4>
              {annotatorSuggestion && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FiInfo className="w-3 h-3 mr-1" />
                  Has Suggestion
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>Annotator decision:</span>
              {isDisagree ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  <FiX className="w-3 h-3 mr-1" />
                  Disagree
                </span>
              ) : annotatorDecision === 'agr' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <FiCheck className="w-3 h-3 mr-1" />
                  Agree
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
            
            {annotatorSuggestion && (
              <div className="text-sm bg-white rounded-md border border-gray-200 px-3 py-2 mt-2 shadow-sm">
                <div className="flex items-start gap-2">
                  <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs font-medium block mb-1">
                      Annotator's suggestion:
                    </span>
                    <span className="text-gray-800 font-medium">{annotatorSuggestion}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="ml-4">
            {isDisagree ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FiAlertCircle className="text-red-500 text-lg" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                <FiCheckCircle className="text-green-500 text-lg" />
              </div>
            )}
          </div>
        </div>

        {isDisagree && (
          <div className="border-t border-gray-200 pt-3 space-y-3">
            <div className="flex gap-4 items-center">
              <span className="text-sm font-medium text-gray-700">Your decision:</span>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`${field}-decision`}
                    checked={decision === 'agree'}
                    onChange={() => handleDecisionChange(field, 'agree')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-green-700">Accept annotator</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`${field}-decision`}
                    checked={decision === 'revert'}
                    onChange={() => handleDecisionChange(field, 'revert')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-red-700">Revert</span>
                </label>
              </div>
            </div>
            
            {decision === 'revert' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for reverting <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => handleCommentChange(field, e.target.value)}
                  rows={3}
                  placeholder="Provide detailed reason for reverting this decision..."
                  className={`w-full border rounded-md px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    comment.trim() === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {comment.trim() === '' && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    Comment is required when reverting
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm mb-6 overflow-hidden relative">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between hover:from-blue-100 hover:to-blue-150 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-200">
            <FiInfo className="text-blue-700" />
          </div>
          <div>
            <h3 className="text-blue-800 font-semibold text-lg">Prompt Metadata Validation</h3>
            <div className="flex items-center gap-4 text-sm text-blue-600 mt-1">
              <span>{stats.total} total fields</span>
              {stats.disagreements > 0 && (
                <span className="text-red-600 font-medium">{stats.disagreements} disagreements</span>
              )}
              {stats.pending > 0 && (
                <span className="text-orange-600 font-medium">{stats.pending} pending</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prompt.metadataReviewed && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FiCheck className="w-3 h-3 mr-1" />
              Reviewed
            </span>
          )}
          {isExpanded ? (
            <FiChevronDown className="text-blue-600 text-xl" />
          ) : (
            <FiChevronRight className="text-blue-600 text-xl" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fields */}
            <div className="space-y-4">
              {filteredFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiEyeOff className="mx-auto text-3xl mb-2" />
                  <p>No fields match your current filters</p>
                </div>
              ) : (
                filteredFields.map((field) => renderItem(field))
              )}
              
              {/* Save Button */}
              <div className="sticky bottom-0 bg-white pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  } text-white`}
                >
                  {isSaving ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Save All Decisions
                    </>
                  )}
                </button>
                
                {showSaved && (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm mt-3 font-medium animate-pulse">
                    <FiCheck className="w-4 h-4" />
                    Saved successfully!
                  </div>
                )}
              </div>
            </div>

            {/* Meta Answers */}
            <div className="lg:sticky lg:top-4">
              <PromptMetaAnswers prompt={prompt} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromptMetadataReview;