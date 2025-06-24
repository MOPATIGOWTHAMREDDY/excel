import React, { useState, useEffect } from 'react';
import UploadPage from './UploadPage';
import PromptList from './PromptList';
import PromptReview from './PromptReview';
import { ToastContainer } from 'react-toastify';
import { exportReviewed } from './export'; // ✅ Import the export function
import { downloadAllReviewedPrompts } from './exportAllReviewedPrompts';



function App() {
  const [data, setData] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(null);
  const [reviewedPrompts, setReviewedPrompts] = useState([]); // ADD THIS

  useEffect(() => {
  console.log('reviewedPrompts updated:', reviewedPrompts.length);
  if (reviewedPrompts.length > 0) {
    const latest = reviewedPrompts[reviewedPrompts.length - 1];
    console.log('Latest reviewed prompt background fields:', 
      Object.keys(latest).filter(k => k.startsWith('u_b_i_') && (k.includes('status') || k.includes('comment')))
        .reduce((acc, key) => ({ ...acc, [key]: latest[key] }), {})
    );
  }
}, [reviewedPrompts]);

  // ADD THIS FUNCTION
  const handlePromptReviewed = (reviewedPrompt) => {
  console.log('handlePromptReviewed received:', {
    unitId: reviewedPrompt._unit_id,
    backgroundFields: Object.keys(reviewedPrompt).filter(k => k.startsWith('u_b_i_') && (k.includes('status') || k.includes('comment'))),
    hasStatusField: !!reviewedPrompt['u_b_i_attributes_to_add_status'],
    statusValue: reviewedPrompt['u_b_i_attributes_to_add_status']
  });
  
  setReviewedPrompts(prev => {
    const existingIndex = prev.findIndex(p => p._unit_id === reviewedPrompt._unit_id);
    if (existingIndex !== -1) {
      const updated = [...prev];
      updated[existingIndex] = reviewedPrompt;
      return updated;
    }
    return [...prev, reviewedPrompt];
  });
};

  // ✅ Expose global prompt list for autosave
  useEffect(() => {
    window.prompts = data;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Prompt Auditing Tool</h1>

        {!data.length && (
          <UploadPage setData={setData} setFilteredPrompts={setFilteredPrompts} />
        )}

        {data.length > 0 && selectedPromptIndex === null && (
          <>
            {/* ✅ Export reviewed prompts button */}
            <div className="mb-4 flex justify-end">
              <button
  onClick={() => {
    console.log('Exporting reviewedPrompts:', reviewedPrompts.length);
    if (reviewedPrompts.length > 0) {
      console.log('Sample reviewed prompt keys:', Object.keys(reviewedPrompts[0]).filter(k => k.includes('u_b_i_')));
    }
    exportReviewed(reviewedPrompts);
  }}
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
>
  Download Reviewed Excel ({reviewedPrompts.length})
</button>
            </div>

            <PromptList
              prompts={filteredPrompts}
              setSelectedPromptIndex={setSelectedPromptIndex}
              originalData={data}
              data={data}
              setFilteredPrompts={setFilteredPrompts}
              reviewedPrompts={reviewedPrompts}
              onPromptReviewed={handlePromptReviewed}
            />
          </>
        )}

        {selectedPromptIndex !== null && (
          <PromptReview
            prompt={filteredPrompts[selectedPromptIndex]}
            index={selectedPromptIndex}
            goBack={() => setSelectedPromptIndex(null)}
            total={filteredPrompts.length}
            goTo={(idx) => setSelectedPromptIndex(idx)}
            onPromptReviewed={handlePromptReviewed}
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;