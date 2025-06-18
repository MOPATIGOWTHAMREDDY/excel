import React from 'react';
import * as XLSX from 'xlsx';

function UploadPage({ setData, setFilteredPrompts }) {
  const handleFileUpload = (e) => {
  const file = e.target.files?.[0];

  if (!file || !(file instanceof Blob)) {
    console.error("Invalid file:", file);
    return;
  }

  const reader = new FileReader();

  reader.onload = (evt) => {
    const arrayBuffer = evt.target.result;
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    setData(jsonData);
    setFilteredPrompts(jsonData);
  };

  reader.readAsArrayBuffer(file); // ✅ modern & supported
};

  return (
    <div className="flex flex-col items-center space-y-6">
      <label className="block">
        <span className="sr-only">Choose Excel File</span>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
        />
      </label>
    </div>
  );
}

export default UploadPage;
