import React, { useState, useEffect } from 'react';
import { FiEdit, FiCheck, FiX, FiAlertCircle, FiInfo, FiCheckCircle, FiCircle } from 'react-icons/fi';

function ParameterBox({ param, readonly, isDisagreement, onStatusChange }) {
  const [revert, setRevert] = useState(param.status === 'disagree');
  const [comment, setComment] = useState(param.comment || '');
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isResolved, setIsResolved] = useState(param.resolved || false);

  // Initialize state from param
  useEffect(() => {
    setRevert(param.status === 'disagree');
    setComment(param.comment || '');
    setIsResolved(param.resolved || false);
  }, [param]);

  const handleStatusChange = (shouldRevert) => {
    setRevert(shouldRevert);
    if (shouldRevert && !comment.trim()) {
      setValidationError('Please provide a reason for reverting');
    } else {
      setValidationError('');
    }
  };

  const handleSave = () => {
    if (revert && !comment.trim()) {
      setValidationError('Please provide a reason for reverting');
      return;
    }

    const newStatus = revert ? 'disagree' : 'agree';
    const updatedParam = {
      ...param,
      status: newStatus,
      comment: comment.trim(),
      resolved: true,
      resolvedAt: new Date().toISOString()
    };

    // Update local state
    setIsResolved(true);
    setIsEditing(false);
    
    // Notify parent component
    onStatusChange(updatedParam);
  };

  const handleMarkResolved = () => {
    const updatedParam = {
      ...param,
      resolved: true,
      resolvedAt: new Date().toISOString()
    };
    setIsResolved(true);
    onStatusChange(updatedParam);
  };

  return (
    <div className={`border p-4 rounded-md transition-all duration-200 relative ${
      isDisagreement 
        ? 'border-red-200 bg-red-50' 
        : readonly 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 bg-white'
    } ${validationError ? 'border-orange-300' : ''}`}>
      
      {/* Resolved Badge */}
      {isResolved && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
          <FiCheckCircle size={16} />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-800 flex items-center">
            {param.name.replace(/_/g, ' ')}
            {isDisagreement && !isResolved && (
              <FiAlertCircle className="ml-2 text-red-500" size={16} />
            )}
          </h4>
          <div className="text-xs text-gray-500 mt-1">
            {param.fullKey.split('_').pop()}
          </div>
        </div>
        
        {!readonly && !isResolved && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1 rounded-full ${
              isEditing ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
          >
            {isEditing ? <FiX size={16} /> : <FiEdit size={16} />}
          </button>
        )}
      </div>

      {/* Values Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500 mb-1">Your Answer</div>
          <div className="text-sm font-medium">
            {param.userAnswer?.toString() || '—'}
          </div>
        </div>
        
        <div className="bg-blue-50 p-2 rounded">
          <div className="text-xs text-gray-500 mb-1 flex items-center">
            Annotator's Answer
            <FiInfo className="ml-1" size={14} />
          </div>
          <div className="text-sm font-medium">
            {param.annotatorValue?.toString() || '—'}
          </div>
        </div>
      </div>

      {/* Editable Section */}
      {(!readonly && isEditing && !isResolved) && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`status_${param.fullKey}`}
                checked={!revert}
                onChange={() => handleStatusChange(false)}
                className="h-4 w-4 text-indigo-600"
              />
              <span className="flex items-center">
                <FiCheck className="mr-1 text-green-500" />
                Agree with annotator
              </span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`status_${param.fullKey}`}
                checked={revert}
                onChange={() => handleStatusChange(true)}
                className="h-4 w-4 text-indigo-600"
              />
              <span className="flex items-center">
                <FiX className="mr-1 text-red-500" />
                Revert to my answer
              </span>
            </label>
          </div>

          {revert && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for reverting
              </label>
              <textarea
                className={`w-full border rounded px-3 py-2 text-sm ${
                  validationError ? 'border-orange-300' : 'border-gray-300'
                }`}
                placeholder="Explain why you disagree with the annotator..."
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (validationError) setValidationError('');
                }}
                rows={3}
              />
              {validationError && (
                <p className="mt-1 text-sm text-orange-600">{validationError}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save & Mark Resolved
            </button>
          </div>
        </div>
      )}

      {/* View Mode */}
      {(!isEditing || isResolved) && (
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              Status: <span className={`font-medium ${
                param.status === 'agree' ? 'text-green-600' : 'text-red-600'
              }`}>
                {param.status === 'agree' ? 'Agreed' : 'Disagreed'}
              </span>
            </div>
            {!readonly && !isResolved && (
              <button
                onClick={handleMarkResolved}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Mark Resolved
              </button>
            )}
          </div>

          {comment && (
            <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
              <div className="text-gray-500 mb-1">Comment:</div>
              <div>{comment}</div>
            </div>
          )}

          {isResolved && param.resolvedAt && (
            <div className="text-xs text-gray-500 mt-1">
              Resolved: {new Date(param.resolvedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ParameterBox;