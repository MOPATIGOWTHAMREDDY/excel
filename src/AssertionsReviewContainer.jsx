import React, { useState, useEffect } from 'react';
import { FiEdit, FiCheck, FiX, FiAlertCircle, FiInfo, FiCheckCircle, FiEye, FiEyeOff, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Individual Criteria Box - Simplified UI
function AssertionCriteriaBox({ criteria, readonly, isDisagreement, onStatusChange }) {
  const [localRevert, setLocalRevert] = useState(criteria.status === 'disagree');
  const [localComment, setLocalComment] = useState(criteria.comment || '');
  const [isEditing, setIsEditing] = useState(!criteria.resolved && criteria.status !== 'agree' && criteria.status !== 'disagree');
  const [validationError, setValidationError] = useState('');
  const [localResolved, setLocalResolved] = useState(criteria.resolved || false);

  useEffect(() => {
    setLocalRevert(criteria.status === 'disagree');
    setLocalComment(criteria.comment || '');
    setLocalResolved(criteria.resolved || false);
  }, [criteria.status, criteria.comment, criteria.resolved]);

  const handleStatusChange = (shouldRevert) => {
    setLocalRevert(shouldRevert);
    if (shouldRevert && !localComment.trim()) {
      setValidationError('Please provide a reason for reverting');
    } else {
      setValidationError('');
    }
  };

  const handleSave = () => {
    if (localRevert && !localComment.trim()) {
      setValidationError('Please provide a reason for reverting');
      return;
    }

    const newStatus = localRevert ? 'disagree' : 'agree';
    const updatedCriteria = {
      ...criteria,
      status: newStatus,
      comment: localComment.trim(),
      resolved: true,
      resolvedAt: new Date().toISOString()
    };

    setLocalResolved(true);
    setIsEditing(false);
    setValidationError('');

    if (onStatusChange) {
      onStatusChange(updatedCriteria);
    }
  };

  const formatCriteriaName = (name = '') => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'True' : 'False';
    }
    return value?.toString() || '—';
  };

  const radioName = `status_${criteria.fullKey}_${criteria.assertionNumber}_${Date.now()}`;

  // Simplified card design
  return (
    <div className={`border rounded p-3 ${
      isDisagreement ? 'border-red-300 bg-red-50' : 
      localResolved ? 'border-green-300 bg-green-50' : 
      'border-gray-300 bg-gray-50'
    }`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-800">
          {formatCriteriaName(criteria.criteriaType || criteria.name)}
        </h4>
        {localResolved && <FiCheckCircle className="text-green-500" size={18} />}
      </div>

      {/* Values comparison - simplified */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="bg-white p-2 rounded border">
          <div className="text-gray-500 text-xs">Your Answer</div>
          <div className="font-medium">{formatValue(criteria.userAnswer)}</div>
        </div>
        <div className="bg-blue-50 p-2 rounded border">
          <div className="text-gray-500 text-xs">Annotator Answer</div>
          <div className="font-medium">{formatValue(criteria.annotatorAnswer)}</div>
        </div>
      </div>

      {/* Editing section - simplified */}
      {(!readonly && isEditing && !localResolved) && (
        <div className="space-y-3 p-3 bg-white rounded border">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={radioName}
                checked={!localRevert}
                onChange={() => handleStatusChange(false)}
                className="text-green-600"
              />
              <span className="text-sm">Agree with annotator</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={radioName}
                checked={localRevert}
                onChange={() => handleStatusChange(true)}
                className="text-red-600"
              />
              <span className="text-sm">Keep my answer</span>
            </label>
          </div>

          {localRevert && (
            <div>
              <label className="block text-sm font-medium mb-1">Why keep your answer?</label>
              <textarea
                className={`w-full border rounded px-2 py-1 text-sm ${
                  validationError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Required: Explain your reasoning..."
                value={localComment}
                onChange={(e) => {
                  setLocalComment(e.target.value);
                  if (validationError) setValidationError('');
                }}
                rows={2}
              />
              {validationError && (
                <p className="text-red-600 text-xs mt-1">{validationError}</p>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setValidationError('');
                setLocalRevert(criteria.status === 'disagree');
                setLocalComment(criteria.comment || '');
              }}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Status display - simplified */}
      {(!isEditing || localResolved) && (
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span>
              Status: <span className={`font-medium ${
                criteria.status === 'agree' ? 'text-green-600' : 
                criteria.status === 'disagree' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {criteria.status === 'agree' ? 'Agreed' : 
                 criteria.status === 'disagree' ? 'Disagreed' : 'Pending'}
              </span>
            </span>
            {!readonly && !localResolved && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                Edit
              </button>
            )}
          </div>

          {localComment && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <strong>Comment:</strong> {localComment}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual Assertion Card - Simplified
function AssertionCard({ assertion, updateReviewedPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, forceUpdate] = useState();

  const agreed = assertion.criteria.filter(c => c.status === 'agree');
  const disagreed = assertion.criteria.filter(c => c.status === 'disagree');
  const pending = assertion.criteria.filter(c => !['agree', 'disagree'].includes(c.status));

  const handleCriteriaUpdate = (updatedCriteria) => {
    const prompt = assertion.__promptRef;
    
    // Update criteria in assertion
    const criteriaIndex = assertion.criteria.findIndex(c => c.fullKey === updatedCriteria.fullKey);
    if (criteriaIndex !== -1) {
      assertion.criteria[criteriaIndex] = { ...updatedCriteria };
    }
    
    // Update flat properties in prompt for export
    if (prompt && updatedCriteria.fullKey) {
      const statusKey = `${updatedCriteria.fullKey}_status`;
      const commentKey = `${updatedCriteria.fullKey}_comment`;
      
      prompt[statusKey] = updatedCriteria.status;
      prompt[commentKey] = updatedCriteria.comment || '';
      
      // Update nested structure
      if (prompt.annotatorAssertions) {
        const assertionIndex = prompt.annotatorAssertions.findIndex(a => a.assertionNumber === assertion.assertionNumber);
        if (assertionIndex !== -1) {
          const nestedCriteriaIndex = prompt.annotatorAssertions[assertionIndex].criteria.findIndex(c => c.fullKey === updatedCriteria.fullKey);
          if (nestedCriteriaIndex !== -1) {
            prompt.annotatorAssertions[assertionIndex].criteria[nestedCriteriaIndex] = { ...updatedCriteria };
          }
        }
      }
    }

    // Check completion status
    const allCriteriaResolved = assertion.criteria.every(c => 
      ['agree', 'disagree'].includes(c.status) && c.resolved
    );

    if (prompt && allCriteriaResolved) {
      const allAssertionsResolved = (prompt.annotatorAssertions || []).every(a =>
        a.criteria.every(c => ['agree', 'disagree'].includes(c.status) && c.resolved)
      );
      
      if (allAssertionsResolved) {
        prompt.assertionsReviewed = true;
        if (prompt.metadataReviewed && prompt.goalsReviewed && prompt.assertionsReviewed) {
          prompt.reviewed = true;
        }
      }
    }

    if (updateReviewedPrompt && prompt) {
      updateReviewedPrompt({ ...prompt });
    }

    forceUpdate({});
  };

  const getStatusColor = () => {
    if (disagreed.length > 0) return 'border-red-300 bg-red-50';
    if (pending.length > 0) return 'border-yellow-300 bg-yellow-50';
    return 'border-green-300 bg-green-50';
  };

  return (
    <div className={`border rounded-lg ${getStatusColor()}`}>
      {/* Simple Header */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">
              Assertion {assertion.assertionNumber}
            </h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {assertion.description}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Simple status badges */}
            {pending.length > 0 && (
              <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                {pending.length} Pending
              </span>
            )}
            {disagreed.length > 0 && (
              <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs">
                {disagreed.length} Disagreed
              </span>
            )}
            {agreed.length > 0 && (
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                {agreed.length} Agreed
              </span>
            )}
            
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t space-y-4">
          {/* Show assertion description */}
          <div className="bg-blue-50 p-3 rounded">
            <strong>Assertion:</strong> {assertion.description}
          </div>

          {/* Show criteria that need review first */}
          {pending.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                <FiAlertCircle className="mr-1" />
                Needs Review ({pending.length})
              </h4>
              <div className="space-y-2">
                {pending.map((criteria, idx) => (
                  <AssertionCriteriaBox
                    key={`pending-${criteria.fullKey}-${idx}`}
                    criteria={criteria}
                    onStatusChange={handleCriteriaUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Show disagreements */}
          {disagreed.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center">
                <FiX className="mr-1" />
                Disagreements ({disagreed.length})
              </h4>
              <div className="space-y-2">
                {disagreed.map((criteria, idx) => (
                  <AssertionCriteriaBox
                    key={`disagree-${criteria.fullKey}-${idx}`}
                    criteria={criteria}
                    isDisagreement={true}
                    onStatusChange={handleCriteriaUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Show agreements (collapsed by default) */}
          {agreed.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center">
                <FiCheck className="mr-1" />
                Agreed ({agreed.length})
              </h4>
              <div className="space-y-2">
                {agreed.map((criteria, idx) => (
                  <AssertionCriteriaBox
                    key={`agree-${criteria.fullKey}-${idx}`}
                    criteria={criteria}
                    readonly={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Simple summary */}
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center text-sm">
              <span>Progress: {agreed.length + disagreed.length} of {assertion.criteria.length} completed</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                pending.length === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {pending.length === 0 ? 'Complete' : `${pending.length} Remaining`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Container - Simplified
function AssertionsReviewContainer({ assertions, updateReviewedPrompt }) {
  const [showCompleted, setShowCompleted] = useState(false);

  const pendingAssertions = assertions.filter(a => 
    a.criteria.some(c => !['agree', 'disagree'].includes(c.status))
  );
  
  const completedAssertions = assertions.filter(a => 
    a.criteria.every(c => ['agree', 'disagree'].includes(c.status))
  );

  return (
    <div className="space-y-4">
      {/* Simple header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Assertion Review</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {completedAssertions.length} of {assertions.length} completed
          </span>
          {completedAssertions.length > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-blue-600 text-sm hover:underline"
            >
              {showCompleted ? 'Hide' : 'Show'} Completed
            </button>
          )}
        </div>
      </div>

      {/* Pending assertions */}
      {pendingAssertions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-yellow-700">
            Pending Review ({pendingAssertions.length})
          </h3>
          {pendingAssertions.map((assertion) => (
            <AssertionCard
              key={`pending-${assertion.assertionNumber}`}
              assertion={assertion}
              updateReviewedPrompt={updateReviewedPrompt}
            />
          ))}
        </div>
      )}

      {/* Completed assertions */}
      {completedAssertions.length > 0 && showCompleted && (
        <div className="space-y-3">
          <h3 className="font-medium text-green-700">
            Completed ({completedAssertions.length})
          </h3>
          {completedAssertions.map((assertion) => (
            <AssertionCard
              key={`completed-${assertion.assertionNumber}`}
              assertion={assertion}
              updateReviewedPrompt={updateReviewedPrompt}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {assertions.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <FiInfo className="mx-auto mb-2 text-2xl" />
          <p>No assertions to review</p>
        </div>
      )}
    </div>
  );
}

export { AssertionCriteriaBox, AssertionCard, AssertionsReviewContainer };