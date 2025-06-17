import React from 'react';
import * as XLSX from 'xlsx';

function ExportButton({ reviewData, prompts }) {
  const handleExport = () => {
    const exportData = prompts.map((prompt) => ({
      Unit_ID: prompt.unit_id,
      Prompt: prompt.prompt,
      Decision: reviewData[prompt.unit_id]?.decision || '',
      Remark: reviewData[prompt.unit_id]?.remark || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ReviewResults');

    XLSX.writeFile(workbook, 'PromptReviewResults.xlsx');
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Download Excel
    </button>
  );
}

export default ExportButton;