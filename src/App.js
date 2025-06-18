import React, { useState, useEffect } from 'react';
import UploadPage from './UploadPage';
import PromptList from './PromptList';
import PromptReview from './PromptReview';
import { ToastContainer } from 'react-toastify';
import { exportReviewed } from './export'; // ✅ Import the export function

function App() {
  const [data, setData] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(null);

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
                onClick={() => exportReviewed(window.prompts)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download Reviewed Excel
              </button>
            </div>

            <PromptList
              prompts={filteredPrompts}
              setSelectedPromptIndex={setSelectedPromptIndex}
              originalData={data}
              data={data}
              setFilteredPrompts={setFilteredPrompts}
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
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;