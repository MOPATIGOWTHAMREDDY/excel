const STORAGE_KEY = 'promptReviewProgress';

export const saveProgress = (data) => {
  const { selectedIndex, reviewData } = data; // ✅ Only save these
  const saveData = { selectedIndex, reviewData };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
};

export const loadProgress = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
};

export const clearProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
};