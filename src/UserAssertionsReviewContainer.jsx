import React, { useState } from 'react';
import { Edit, Check, X, AlertCircle, Info, CheckCircle, Eye, EyeOff, ChevronDown, ChevronUp, User } from 'lucide-react';

// === UserAssertionCriteriaBox ===
function UserAssertionCriteriaBox({ criteria, readonly = false, isDisagreement = false, onStatusChange }) {
  const [status, setStatus] = useState(criteria?.status || 'pending');
  const [comment, setComment] = useState(criteria?.comment || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isResolved, setIsResolved] = useState(criteria?.resolved || false);

  const handleSave = () => {
    if (status === 'disagree' && !comment.trim()) {
      setError('Please provide a reason for disagreeing.');
      return;
    }

    const updated = {
      ...criteria,
      status,
      comment: comment.trim(),
      resolved: true,
      resolvedAt: new Date().toISOString(),
    };

    setIsResolved(true);
    setIsEditing(false);
    onStatusChange?.(updated);
  };

  if (!criteria) return null;

  return (
    <div className={`border p-4 rounded-md shadow-sm transition ${isResolved ? 'bg-green-50 border-green-200' : isDisagreement ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} mb-3`}>
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-semibold flex items-center text-gray-800">
          <User size={14} className="mr-1 text-blue-500" />
          {criteria?.criteriaType?.replace(/_/g, ' ')}
        </h4>
        {!readonly && !isResolved && (
          <button onClick={() => setIsEditing(!isEditing)} className="text-gray-500 hover:text-black transition">
            {isEditing ? <X size={16} /> : <Edit size={16} />}
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 mb-2">
        Your: <strong>{criteria?.userAnswer?.toString()}</strong> | Annotator: <strong>{criteria?.annotatorAnswer?.toString()}</strong>
      </div>

      {isEditing && (
        <>
          <div className="flex space-x-4 mb-3 text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" checked={status === 'agree'} onChange={() => setStatus('agree')} />
              <span>Agree</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" checked={status === 'disagree'} onChange={() => setStatus('disagree')} />
              <span>Disagree</span>
            </label>
          </div>

          {status === 'disagree' && (
            <textarea
              className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={2}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError('');
              }}
              placeholder="Why do you disagree?"
            />
          )}

          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

          <div className="mt-3 flex justify-end">
            <button onClick={handleSave} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Save & Resolve</button>
          </div>
        </>
      )}

      {!isEditing && (
        <div className="text-sm mt-2">
          <div className="text-gray-700">
            Status: <span className={`font-semibold ${status === 'disagree' ? 'text-red-600' : 'text-green-600'}`}>{status}</span>
          </div>
          {comment && <div className="text-xs mt-1 text-gray-600">Comment: {comment}</div>}
          {isResolved && <div className="text-xs text-green-600 mt-1 font-medium">Resolved</div>}
        </div>
      )}
    </div>
  );
}

// === UserAssertionCard ===
function UserAssertionCard({ assertion, updateReviewedPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCriteriaUpdate = (updated) => {
    const index = assertion.criteria.findIndex(c => c.fullKey === updated.fullKey);
    if (index !== -1) {
      assertion.criteria[index] = updated;
    }

    const prompt = assertion.__promptRef;
    if (prompt) {
      prompt[`${updated.fullKey}_status`] = updated.status;
      prompt[`${updated.fullKey}_comment`] = updated.comment || '';
      if (prompt.userAssertions?.every(a =>
        a.criteria?.every(c => ['agree', 'disagree'].includes(c.status))
      )) {
        prompt.usaReviewed = true;
        if (prompt.metadataReviewed && prompt.goalsReviewed && prompt.asaReviewed) {
          prompt.reviewed = true;
        }
      }
      updateReviewedPrompt?.({ ...prompt });
    }
  };

  const criteria = assertion.criteria || [];
  const agreed = criteria.filter(c => c.status === 'agree');
  const disagreed = criteria.filter(c => c.status === 'disagree');
  const pending = criteria.filter(c => !['agree', 'disagree'].includes(c.status));

  return (
    <div className="border rounded-md mb-4 bg-white shadow">
      <div className="flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          {disagreed.length > 0 ? <AlertCircle size={16} className="text-red-500" /> : <CheckCircle size={16} className="text-green-500" />}
          <div className="text-sm font-medium text-gray-800">Assertion {assertion?.assertionNumber}</div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>{pending.length} pending</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-500 italic mb-2">{assertion.description}</div>

          {criteria.map((c, i) => (
            <UserAssertionCriteriaBox
              key={`${assertion.assertionNumber}-${c.fullKey || i}`}
              criteria={c}
              isDisagreement={c.status === 'disagree'}
              readonly={['agree', 'disagree'].includes(c.status) && c.resolved}
              onStatusChange={handleCriteriaUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// === UserAssertionsReviewContainer ===
function UserAssertionsReviewContainer({ assertions = [], updateReviewedPrompt }) {
  const [showCompleted, setShowCompleted] = useState(true);

  const pending = assertions.filter(a =>
    a.criteria?.some(c => !['agree', 'disagree'].includes(c.status))
  );
  const completed = assertions.filter(a =>
    a.criteria?.every(c => ['agree', 'disagree'].includes(c.status))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">User Assertions Review</h2>
        {completed.length > 0 && (
          <button onClick={() => setShowCompleted(!showCompleted)} className="text-sm text-blue-600 hover:underline">
            {showCompleted ? 'Hide' : 'Show'} Completed
          </button>
        )}
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-700 mb-2">Pending Review</h3>
          {pending.map(a => (
            <UserAssertionCard
              key={`assertion-${a.assertionNumber}`}
              assertion={a}
              updateReviewedPrompt={updateReviewedPrompt}
            />
          ))}
        </div>
      )}

      {showCompleted && completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-700 mb-2">Completed Review</h3>
          {completed.map(a => (
            <UserAssertionCard
              key={`completed-${a.assertionNumber}`}
              assertion={a}
              updateReviewedPrompt={updateReviewedPrompt}
            />
          ))}
        </div>
      )}

      {assertions.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          <p>No user assertions found.</p>
        </div>
      )}
    </div>
  );
}

export {
  UserAssertionCriteriaBox,
  UserAssertionCard,
  UserAssertionsReviewContainer
};