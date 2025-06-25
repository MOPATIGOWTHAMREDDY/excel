import React, { useState, useEffect } from 'react';
import UploadPage from './UploadPage';
import PromptList from './PromptList';
import PromptReview from './PromptReview';
import { ToastContainer } from 'react-toastify';
import { exportReviewed } from './export';
import { downloadAllReviewedPrompts } from './exportAllReviewedPrompts';

function App() {
  const [data, setData] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(null);
  const [reviewedPrompts, setReviewedPrompts] = useState([]);

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

  useEffect(() => {
    window.prompts = data;
  }, [data]);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="bg-black text-white rounded-2xl shadow-2xl p-8 mb-6 border border-gray-200">
          <h1 className="text-3xl font-bold mb-2">Prompt Auditing Tool</h1>
          <p className="text-gray-300">Advanced prompt review and analysis platform</p>
        </div>

        {!data.length && (
          <div className="bg-white border-2 border-black rounded-2xl shadow-xl">
            <UploadPage setData={setData} setFilteredPrompts={setFilteredPrompts} />
          </div>
        )}

        {data.length > 0 && selectedPromptIndex === null && (
          <>
            {/* Export Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => {
                  console.log('Exporting reviewedPrompts:', reviewedPrompts.length);
                  if (reviewedPrompts.length > 0) {
                    console.log('Sample reviewed prompt keys:', Object.keys(reviewedPrompts[0]).filter(k => k.includes('u_b_i_')));
                  }
                  exportReviewed(reviewedPrompts);
                }}
                className="inline-flex items-center px-6 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all duration-200 border-2 border-black"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
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
          <div className="bg-white border-2 border-black rounded-2xl shadow-xl">
            <PromptReview
              prompt={filteredPrompts[selectedPromptIndex]}
              index={selectedPromptIndex}
              goBack={() => setSelectedPromptIndex(null)}
              total={filteredPrompts.length}
              goTo={(idx) => setSelectedPromptIndex(idx)}
              onPromptReviewed={handlePromptReviewed}
            />
          </div>
        )}
      </div>
      
      {/* Toast Container with clean theme */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="bg-white border-2 border-black shadow-xl"
      />
    </div>
  );
}

export default App;