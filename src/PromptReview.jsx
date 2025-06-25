import React, { useState, useEffect, useMemo } from 'react';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiSave, FiCheck, FiClock } from 'react-icons/fi';
import GoalReviewCard from './GoalReviewCard';
import PromptMetadataReview from './PromptMetadataReview';
import PromptMetaSummary from './PromptMetaSummary';
import {UserAssertionsReviewContainer} from './UserAssertionsReviewContainer';
import { AssertionsReviewContainer } from './AssertionsReviewContainer';
import {UserBackgroundInfoReviewContainer} from './UserBackgroundInfoReviewContainer';

function processUserAssertionData(prompt) {
  if (!prompt || typeof prompt !== 'object') {
    return [];
  }

  const assertionGroups = {};
  
  // Find all _a_a columns with "dis" values for USER assertions only
  Object.keys(prompt).forEach(key => {
    if (key.includes('_a_a') && prompt[key] === 'dis') {
      
      // Match USA columns only: usa_1_duplicate_a_a
      const usaMatch = key.match(/^usa_(\d+)_(.+)_a_a$/);
      
      if (usaMatch) {
        const assertionNumber = usaMatch[1];
        const criteriaType = usaMatch[2];
        
        // For User Side Assertions
        const agentKey = `user_side_assertion_${assertionNumber}_${criteriaType}`;
        const annotatorKey = `usa_${assertionNumber}_${criteriaType}_u_a`;
        const descriptionKey = `user_side_assertion_${assertionNumber}`;
        
        const agentAnswer = prompt[agentKey];
        const annotatorAnswer = prompt[annotatorKey];
        const description = prompt[descriptionKey];
        
        // Create assertion group
        if (!assertionGroups[assertionNumber]) {
          assertionGroups[assertionNumber] = {
            assertionNumber: parseInt(assertionNumber),
            description: description || `User Side Assertion ${assertionNumber}`,
            criteria: [],
            __promptRef: prompt
          };
        }
        
        assertionGroups[assertionNumber].criteria.push({
          criteriaType: criteriaType,
          fullKey: agentKey,
          userAnswer: agentAnswer,           // Your answer from user_side_assertion_X_criteria
          annotatorAnswer: annotatorAnswer,  // Annotator's answer from usa_X_criteria_u_a
          status: 'pending',
          comment: '',
          resolved: false,
          assertionNumber: parseInt(assertionNumber),
          hasDisagreement: true
        });
      }
    }
  });

  return Object.values(assertionGroups);
}

function processAssertionData(prompt) {
  if (!prompt || typeof prompt !== 'object') {
    return [];
  }

  const assertionGroups = {};
  
  // This loop goes through ALL columns in your data
  Object.keys(prompt).forEach(key => {
    if (key.includes('_a_a') && prompt[key] === 'dis') {
      
      // This regex captures ANY assertion number: asa_1_, asa_2_, asa_10_, etc.
      const asaMatch = key.match(/^asa_(\d+)_(.+)_a_a$/);
      
      if (asaMatch) {
        const assertionNumber = asaMatch[1];  // This will be 1, 2, 3, 4, 5... 10, etc.
        const criteriaType = asaMatch[2];
        
        // These keys are built dynamically for ANY assertion number
        const agentKey = `agent_side_assertion_${assertionNumber}_${criteriaType}`;
        const annotatorKey = `asa_${assertionNumber}_${criteriaType}_u_a`;
        const descriptionKey = `agent_side_assertion_${assertionNumber}`;
        
        const agentAnswer = prompt[agentKey];
        const annotatorAnswer = prompt[annotatorKey];
        const description = prompt[descriptionKey];
        
        // Creates groups dynamically for each assertion number found
        if (!assertionGroups[assertionNumber]) {
          assertionGroups[assertionNumber] = {
            assertionNumber: parseInt(assertionNumber),
            description: description || `Agent Side Assertion ${assertionNumber}`,
            criteria: [],
            __promptRef: prompt
          };
        }
        
        assertionGroups[assertionNumber].criteria.push({
          criteriaType: criteriaType,
          fullKey: agentKey,
          userAnswer: agentAnswer,
          annotatorAnswer: annotatorAnswer,
          status: 'pending',
          comment: '',
          resolved: false,
          assertionNumber: parseInt(assertionNumber),
          hasDisagreement: true
        });
      }
    }
  });

  return Object.values(assertionGroups);
}

function getGoals(prompt) {
  const excludedPatterns = [
    '_contains_',
    '_requests_',
    '_task_',
    '_not_',
    '_objectively_',
    'ambiguous_unclear_qc',
    'qc',
  ];

  const goalKeys = Object.keys(prompt).filter((key) => {
    // Must start with 'goal_'
    if (!key.startsWith('goal_')) return false;
    
    // Exclude patterns
    if (excludedPatterns.some((pattern) => key.includes(pattern))) return false;
    
    // Fixed regex to match goal_1, goal_2, ... goal_10, goal_11, etc.
    const goalMainPattern = /^goal_\d+$/;
    return goalMainPattern.test(key);
  });

  const goals = goalKeys
    .map((key) => {
      const goalNameParts = key.split('_');
      const goalIndex = goalNameParts[1];
      const description = prompt[key];

      // Skip goals without meaningful descriptions
      if (!description || description.trim() === '') {
        return null;
      }

      const parameters = Object.entries(prompt)
        .filter(([paramKey]) =>
          paramKey.startsWith(`${key}_`) &&
          !paramKey.includes(`${key}_task_`) &&
          !paramKey.endsWith('_gold') // Filter out parameters ending with _gold
        )
        .map(([paramKey, userAnswer]) => {
          const paramBase = paramKey.replace(`${key}_`, '');
          const annotatorAnswer = prompt[`g_${goalIndex}_${paramBase}_a_a`];
          const annotatorValue = prompt[`g_${goalIndex}_${paramBase}_u_a`];

          const existingParam = prompt.parameters?.find(p => p.fullKey === paramKey);
          
          return existingParam || {
            name: paramBase,
            userAnswer,
            annotatorAnswer,
            annotatorValue,
            fullKey: paramKey,
            revertComment: '',
            status: annotatorAnswer === 'dis' ? 'disagree' : 'agree',
          };
        });

      return {
        name: key,
        description: description,
        parameters,
        __promptRef: prompt,
      };
    })
    .filter(goal => goal !== null); // Remove null entries (goals without descriptions)

  return goals;
}

function PromptReview({ prompt, index, goBack, total, goTo, onPromptReviewed }) {
  const [isReviewed, setIsReviewed] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [reviewStartTime] = useState(Date.now());
  const [reviewTime, setReviewTime] = useState(0);
  const [activeTab, setActiveTab] = useState('summary');

  // Initialize prompt.parameters only once
  if (!prompt.parameters) {
    const initialGoals = getGoals(prompt);
    prompt.parameters = initialGoals.flatMap(g => g.parameters);
  }

  const goals = useMemo(() => getGoals(prompt), [prompt._unit_id]);

  // Define tabs with completion status
const tabs = [
  { 
    id: 'summary', 
    label: 'Summary', 
    icon: '📊',
    completed: true 
  },
  { 
    id: 'metadata', 
    label: 'Metadata Review', 
    icon: '🔍',
    completed: prompt.metadataReviewed || false
  },
  { 
    id: 'goals', 
    label: `Goals (${goals.length})`, 
    icon: '🎯',
    completed: prompt.goalsReviewed || false
  },
  { 
    id: 'usa', 
    label: 'User Assertions', 
    icon: '👤',
    completed: prompt.usaReviewed || false
  },
  { 
    id: 'asa', 
    label: 'Agent Assertions', 
    icon: '🤖',
    completed: prompt.asaReviewed || false
  },
  { 
    id: 'background', 
    label: 'Background Info', 
    icon: '📋',
    completed: prompt.backgroundInfoReviewed || false
  }
];



  // Timer for tracking review time
  useEffect(() => {
    const timer = setInterval(() => {
      setReviewTime(Math.floor((Date.now() - reviewStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [reviewStartTime]);

const updateReviewedPrompt = (updatedPrompt) => {
  setHasChanges(true);
  
  // Update the local prompt reference
  Object.assign(prompt, updatedPrompt);
  
  // Update window.prompts
  const promptList = window.prompts || [];
  const i = promptList.findIndex(p => p._unit_id === updatedPrompt._unit_id);
  if (i !== -1) {
    promptList[i] = updatedPrompt;
    window.prompts = [...promptList];
  }
  
  // 🔥 KEY FIX: Also notify the parent component immediately
  if (onPromptReviewed) {
    onPromptReviewed(updatedPrompt);
  }
};

  // Mark prompt as reviewed and save
  const handleMarkAsReviewed = () => {
    const reviewedPrompt = {
      ...prompt,
      reviewedAt: new Date().toISOString(),
      reviewTime: reviewTime,
      isReviewed: true,
      reviewed: true
    };
    
    setIsReviewed(true);
    updateReviewedPrompt(reviewedPrompt);
    
    if (onPromptReviewed) {
      onPromptReviewed(reviewedPrompt);
    }
  };

  // Auto-save when navigating
  const handleNavigation = (navigationFn) => {
    if (hasChanges && !isReviewed) {
      handleMarkAsReviewed();
    }
    navigationFn();
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check overall completion status
  const overallCompletion = tabs.filter(tab => tab.completed).length;
  const totalTabs = tabs.length;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <PromptMetaSummary prompt={prompt} />;
      
      case 'metadata':
        return (
          <PromptMetadataReview
            prompt={prompt}
            updateReviewedPrompt={updateReviewedPrompt}
          />
        );
      
      case 'goals':
        return (
          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.map((goal, idx) => (
                <GoalReviewCard
                  key={`goal-${goal.name}-${idx}`}
                  goal={goal}
                  updateReviewedPrompt={updateReviewedPrompt}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No goals found for this prompt</p>
              </div>
            )}
          </div>
        );
      
case 'usa':
  const processedUserAssertions = processUserAssertionData(prompt);
  return (
    <UserAssertionsReviewContainer
      assertions={processedUserAssertions}
      updateReviewedPrompt={updateReviewedPrompt}
    />
  );
      
      case 'asa':
  const processedAssertions = processAssertionData(prompt);
  return (
    <AssertionsReviewContainer
      assertions={processedAssertions}
      updateReviewedPrompt={updateReviewedPrompt}
    />
  );

  case 'background':
  return (
    <UserBackgroundInfoReviewContainer
      prompt={prompt}
      updateReviewedPrompt={updateReviewedPrompt}
    />
  );
      
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleNavigation(goBack)} 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FiArrowLeft />
                Back to List
              </button>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  Prompt {index + 1} of {total}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isReviewed 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {isReviewed ? <FiCheck size={12} /> : <FiClock size={12} />}
                  {isReviewed ? 'Reviewed' : 'In Progress'}
                </div>
                
                {/* Progress indicator */}
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {overallCompletion}/{totalTabs} sections completed
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Review Timer */}
              <div className="text-sm text-gray-500">
                Time: {formatTime(reviewTime)}
              </div>

              {/* Save Button */}
              {hasChanges && !isReviewed && (
                <button
                  onClick={handleMarkAsReviewed}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave />
                  Mark as Reviewed
                </button>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigation(() => goTo(Math.max(0, index - 1)))}
                  disabled={index === 0}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous prompt"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => handleNavigation(() => goTo(Math.min(total - 1, index + 1)))}
                  disabled={index === total - 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next prompt"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white shadow-sm rounded-xl border overflow-hidden">
          {/* Prompt Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Prompt #{prompt._unit_id}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Worker ID: {prompt.orig__worker_id}</span>
                  {prompt.reviewedAt && (
                    <span>Reviewed: {new Date(prompt.reviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isReviewed 
                  ? 'bg-green-100 text-green-700' 
                  : hasChanges 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                {isReviewed ? 'Completed' : hasChanges ? 'Modified' : 'Not Started'}
              </div>
            </div>
            
            {/* Prompt Text */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-2">Prompt:</h3>
              <p className="text-gray-700 leading-relaxed">{prompt.prompt}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.completed && tab.id !== 'summary' && (
                    <FiCheck className="text-green-500" size={14} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <button 
              onClick={() => handleNavigation(goBack)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft />
              Back to List
            </button>

            <div className="flex items-center gap-3">
              {!isReviewed && (
                <button
                  onClick={handleMarkAsReviewed}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheck />
                  Complete Review
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigation(() => goTo(Math.max(0, index - 1)))}
                  disabled={index === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleNavigation(() => goTo(Math.min(total - 1, index + 1)))}
                  disabled={index === total - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptReview;