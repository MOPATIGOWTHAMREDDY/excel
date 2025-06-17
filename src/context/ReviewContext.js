import React, { createContext, useState, useContext } from 'react';

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
  const [reviewData, setReviewData] = useState({});

  const savePromptDecision = (promptId, field, decision, comment) => {
    setReviewData((prev) => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        promptDecisions: {
          ...prev[promptId]?.promptDecisions,
          [field]: { decision, comment },
        },
      },
    }));
  };

  const saveGoalDecision = (promptId, goalName, paramName, decision, comment) => {
    setReviewData((prev) => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        goalDecisions: {
          ...prev[promptId]?.goalDecisions,
          [goalName]: {
            ...prev[promptId]?.goalDecisions?.[goalName],
            [paramName]: { decision, comment },
          },
        },
      },
    }));
  };

  return (
    <ReviewContext.Provider value={{ reviewData, savePromptDecision, saveGoalDecision }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => useContext(ReviewContext);