import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiMessageSquare, FiSave, FiAlertCircle, FiEdit3 } from 'react-icons/fi';

// Process User Background Information data
function processUserBackgroundData(prompt) {
  if (!prompt || typeof prompt !== 'object') {
    return [];
  }

  const backgroundCriteria = [
    {
      key: 'formatting',
      label: 'Formatting',
      userAnswerKey: 'user_background_information_formatting',
      annotatorDisagreeKey: 'u_b_i_formatting_a_a',
      annotatorAnswerKey: 'u_b_i_formatting_u_a'
    },
    {
      key: 'clarity_coherence',
      label: 'Clarity & Coherence',
      userAnswerKey: 'user_background_information_clarity_coherence',
      annotatorDisagreeKey: 'u_b_i_clarity_coherence_a_a',
      annotatorAnswerKey: 'u_b_i_clarity_coherence_u_a'
    },
    {
      key: 'attributes_to_add',
      label: 'Attributes to Add',
      userAnswerKey: 'user_background_information_attributes_to_add',
      annotatorDisagreeKey: 'u_b_i_attributes_to_add_a_a',
      annotatorAnswerKey: 'u_b_i_attributes_to_add_u_a'
    },
    {
      key: 'attributes_to_remove',
      label: 'Attributes to Remove',
      userAnswerKey: 'user_background_information_attributes_to_remove',
      annotatorDisagreeKey: 'u_b_i_attributes_to_remove_a_a',
      annotatorAnswerKey: 'u_b_i_attributes_to_remove_u_a'
    }
  ];

  const processedCriteria = backgroundCriteria.map(criteria => {
    const userAnswer = prompt[criteria.userAnswerKey];
    const annotatorDisagree = prompt[criteria.annotatorDisagreeKey];
    const annotatorAnswer = prompt[criteria.annotatorAnswerKey];

    // Get saved status and comment from flattened fields
    const flatStatus = prompt[`u_b_i_${criteria.key}_status`] || 'pending';
    const flatComment = prompt[`u_b_i_${criteria.key}_comment`] || '';
    const flatResolved = prompt[`u_b_i_${criteria.key}_resolved`] || false;

    return {
      ...criteria,
      userAnswer: userAnswer || '',
      annotatorDisagree: annotatorDisagree || 'agr',
      annotatorAnswer: annotatorAnswer || '',
      hasDisagreement: annotatorDisagree === 'dis',
      status: flatStatus,
      comment: flatComment,
      resolved: flatResolved || flatStatus === 'saved' // Keep backward compatibility
    };
  });

  return processedCriteria.filter(criteria => criteria.hasDisagreement);
}

// Individual criteria review component
function BackgroundCriteriaCard({ criteria, onUpdate, onSave }) {
  const [status, setStatus] = useState(criteria.status);
  const [comment, setComment] = useState(criteria.comment);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setStatus(criteria.status);
    setComment(criteria.comment);
    setHasUnsavedChanges(false);
  }, [criteria]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setHasUnsavedChanges(true);
    onUpdate({
      ...criteria,
      status: newStatus,
      comment,
      resolved: false
    });
  };

  const handleCommentChange = (newComment) => {
    setComment(newComment);
    setHasUnsavedChanges(true);
    onUpdate({
      ...criteria,
      status,
      comment: newComment,
      resolved: false
    });
  };

  const handleSaveCard = () => {
    if (!comment.trim()) {
      alert('Please add a comment before saving.');
      return;
    }
    
    const savedCriteria = {
      ...criteria,
      status,
      comment: comment.trim(),
      resolved: true
    };
    
    console.log('Saving criteria with comment:', comment.trim()); // Debug log
    setHasUnsavedChanges(false);
    setIsEditing(false);
    onSave(savedCriteria);
  };

  const getStatusColor = () => {
    if (criteria.resolved) return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'accepted') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className={`border-2 rounded-lg p-5 transition-all ${
      criteria.resolved 
        ? 'bg-green-50 border-green-200' 
        : hasUnsavedChanges 
          ? 'bg-orange-50 border-orange-200' 
          : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="font-semibold text-gray-800 text-lg">{criteria.label}</h4>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 text-orange-600 text-sm">
                <FiAlertCircle size={14} />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Your Answer:
              </label>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-gray-800 text-sm leading-relaxed">
                  {criteria.userAnswer || 'No answer provided'}
                </p>
              </div>
            </div>
            
            {criteria.hasDisagreement && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Annotator's Answer:
                </label>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {criteria.annotatorAnswer || 'No annotator answer provided'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}>
          {criteria.resolved ? 'Saved' : status === 'pending' ? 'Pending Review' : status === 'accepted' ? 'Accept Annotator' : 'Keep Mine'}
        </div>
      </div>

      {!criteria.resolved && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Decision:</span>
            <button
              onClick={() => handleStatusChange('accepted')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                status === 'accepted'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              <FiCheck size={16} />
              Accept Annotator's Answer
            </button>

            <button
              onClick={() => handleStatusChange('rejected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                status === 'rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              <FiX size={16} />
              Keep My Answer
            </button>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
              <FiMessageSquare size={16} />
              Review Comment *
            </label>
            <textarea
              value={comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="Please explain your decision and add any additional notes..."
              className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              rows={3}
              onFocus={() => setIsEditing(true)}
            />
            {isEditing && comment.length === 0 && (
              <p className="text-red-500 text-xs mt-1">Comment is required before saving</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {status === 'pending' ? 'Please make a decision and add comments' : 'Add your review comments and save'}
            </div>
            <button
              onClick={handleSaveCard}
              disabled={!comment.trim() || status === 'pending'}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                !comment.trim() || status === 'pending'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              <FiSave size={16} />
              Save Review
            </button>
          </div>
        </>
      )}

      {criteria.resolved && (
        <div className="bg-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <FiCheck className="text-green-600 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-green-800">Review Completed</span>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setHasUnsavedChanges(false);
                    onUpdate({
                      ...criteria, 
                      resolved: false,
                      status: criteria.status,
                      comment: criteria.comment
                    });
                  }}
                  className="text-green-700 hover:text-green-800 p-1"
                  title="Edit review"
                >
                  <FiEdit3 size={14} />
                </button>
              </div>
              <p className="text-green-700 text-sm font-medium mb-1">
                Decision: {status === 'accepted' ? 'Accepted Annotator\'s Answer' : 'Kept My Answer'}
              </p>
              <p className="text-green-700 text-sm">
                <span className="font-medium">Comment:</span> {criteria.comment}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main User Background Review Container
export function UserBackgroundInfoReviewContainer({ prompt, updateReviewedPrompt }) {
  const [backgroundCriteria, setBackgroundCriteria] = useState([]);
  const [allSaved, setAllSaved] = useState(false);

  useEffect(() => {
    const processedData = processUserBackgroundData(prompt);
    setBackgroundCriteria(processedData);
  }, [prompt]);

  useEffect(() => {
    const saved = backgroundCriteria.every(criteria => criteria.resolved);
    setAllSaved(saved);
  }, [backgroundCriteria]);

  const handleCriteriaUpdate = (updatedCriteria) => {
    setBackgroundCriteria(prev => 
      prev.map(criteria =>
        criteria.key === updatedCriteria.key ? updatedCriteria : criteria
      )
    );
  };

  const handleCriteriaSave = (savedCriteria) => {
    console.log('Saving criteria:', savedCriteria); // Debug log
    
    setBackgroundCriteria(prev => {
      const updated = prev.map(criteria =>
        criteria.key === savedCriteria.key 
          ? { 
              ...savedCriteria, 
              resolved: true,
              status: savedCriteria.status,
              comment: savedCriteria.comment
            }
          : criteria
      );

      console.log('Updated criteria list:', updated); // Debug log

      // Update the prompt with flattened fields for export
      const flattenedFields = flattenBackgroundReviewFields(updated);
      console.log('Flattened fields:', flattenedFields); // Debug log
      
      const updatedPrompt = {
        ...prompt,
        backgroundInfoReviewed: updated.every(c => c.resolved),
        backgroundInfoCriteria: updated,
        ...flattenedFields
      };
      
      updateReviewedPrompt(updatedPrompt);

      return updated;
    });
  };

  if (backgroundCriteria.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 max-w-md mx-auto">
          <FiCheck className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-green-800 mb-2">All Good!</h3>
          <p className="text-green-700">No disagreements found in User Background Information criteria.</p>
        </div>
      </div>
    );
  }

  const savedCount = backgroundCriteria.filter(c => c.resolved).length;
  const totalCount = backgroundCriteria.length;

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Background Information Review</h2>
            <p className="text-gray-600 mt-2">
              Review and resolve {totalCount} disagreement{totalCount !== 1 ? 's' : ''} found in background information criteria
            </p>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-lg text-lg font-semibold mb-2 ${
              allSaved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {savedCount} / {totalCount} Completed
            </div>
            {allSaved && (
              <div className="flex items-center gap-2 text-green-600">
                <FiCheck size={18} />
                <span className="font-medium">Ready for Export</span>
              </div>
            )}
          </div>
        </div>
        
        {!allSaved && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <FiAlertCircle size={18} />
              <span className="font-medium">
                Please review all disagreements and save your decisions before proceeding to export.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {backgroundCriteria.map((criteria, index) => (
          <BackgroundCriteriaCard
            key={`${criteria.key}-${index}`}
            criteria={criteria}
            onUpdate={handleCriteriaUpdate}
            onSave={handleCriteriaSave}
          />
        ))}
      </div>

      {allSaved && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <FiCheck className="text-green-600" size={24} />
            <div>
              <span className="font-semibold text-green-800 text-lg">
                User Background Information Review Complete!
              </span>
              <p className="text-green-700 mt-1">
                All disagreements have been reviewed and saved. The data is ready for export.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to store flat comment/status for export
function flattenBackgroundReviewFields(criteriaList) {
  const flatFields = {};
  criteriaList.forEach(c => {
    flatFields[`u_b_i_${c.key}_status`] = c.status || 'pending';
    flatFields[`u_b_i_${c.key}_comment`] = c.comment || '';
    flatFields[`u_b_i_${c.key}_resolved`] = c.resolved || false;
  });
  return flatFields;
}