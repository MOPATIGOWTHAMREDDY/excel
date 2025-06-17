import React, { createContext, useState } from 'react';

export const ReviewDataContext = createContext();

export function ReviewDataProvider({ children }) {
  const [reviewData, setReviewData] = useState({});

  const updateReviewData = (unitId, goalName, paramKey, field, value) => {
    setReviewData((prev) => {
      const updated = { ...prev };
      if (!updated[unitId]) updated[unitId] = {};
      if (!updated[unitId][goalName]) updated[unitId][goalName] = {};
      if (!updated[unitId][goalName][paramKey]) updated[unitId][goalName][paramKey] = {};
      updated[unitId][goalName][paramKey][field] = value;
      return updated;
    });
  };

  return (
    <ReviewDataContext.Provider value={{ reviewData, setReviewData, updateReviewData }}>
      {children}
    </ReviewDataContext.Provider>
  );
}