import React, { useState } from 'react';
import UploadPage from './UploadPage';
import PromptList from './PromptList';
import PromptReview from './PromptReview';
import { ToastContainer } from 'react-toastify';


function App() {
  const [data, setData] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Prompt Auditing Tool</h1>

        {!data.length && (
          <UploadPage setData={setData} setFilteredPrompts={setFilteredPrompts} />
        )}

  
        {data.length > 0 && selectedPromptIndex === null && (
          <PromptList
            prompts={filteredPrompts}
            setSelectedPromptIndex={setSelectedPromptIndex}
            originalData={data}
            setFilteredPrompts={setFilteredPrompts}
          />
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