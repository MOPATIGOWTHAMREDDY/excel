import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

function UploadPage({ setData, setFilteredPrompts }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileStats, setFileStats] = useState(null);

  const handleFileUpload = (file) => {
    if (!file || !(file instanceof Blob)) {
      setUploadStatus({ type: 'error', message: 'Invalid file selected' });
      return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setUploadStatus({ type: 'error', message: 'Please select a valid Excel (.xlsx, .xls) or CSV file' });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    setUploadStatus({ type: 'loading', message: 'Processing file...' });

    if (fileExtension === 'csv') {
      // Handle CSV files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const processedData = results.data.filter(row => 
            Object.values(row).some(value => value !== null && value !== '')
          );

          setData(processedData);
          setFilteredPrompts(processedData);
          setFileStats({
            rows: processedData.length,
            columns: Object.keys(processedData[0] || {}).length,
            fileSize: formatFileSize(file.size)
          });
          setUploadStatus({ type: 'success', message: `Successfully loaded ${processedData.length} records` });
          setIsLoading(false);
        },
        error: (error) => {
          setUploadStatus({ type: 'error', message: `CSV parsing error: ${error.message}` });
          setIsLoading(false);
        }
      });
    } else {
      // Handle Excel files
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const arrayBuffer = evt.target.result;
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const processedData = jsonData.filter(row => 
            Object.values(row).some(value => value !== null && value !== '')
          );

          setData(processedData);
          setFilteredPrompts(processedData);
          setFileStats({
            rows: processedData.length,
            columns: Object.keys(processedData[0] || {}).length,
            fileSize: formatFileSize(file.size),
            sheets: workbook.SheetNames.length
          });
          setUploadStatus({ type: 'success', message: `Successfully loaded ${processedData.length} records` });
          setIsLoading(false);
        } catch (error) {
          setUploadStatus({ type: 'error', message: `Excel parsing error: ${error.message}` });
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setUploadStatus({ type: 'error', message: 'Failed to read file' });
        setIsLoading(false);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearFile = () => {
    setFileName('');
    setFileStats(null);
    setUploadStatus(null);
    setData([]);
    setFilteredPrompts([]);
  };

  const getStatusIcon = () => {
    switch (uploadStatus?.type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus?.type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'loading':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Data</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your Excel (.xlsx, .xls) or CSV files to start reviewing prompts. 
            Drag and drop files or click to browse.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Upload Area */}
          <div className="p-8">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : fileName
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />

              <div className="space-y-4">
                {fileName ? (
                  <div className="space-y-3">
                    <FiFile className="w-16 h-16 text-green-500 mx-auto" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{fileName}</p>
                      {fileStats && (
                        <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600">
                          <span>{fileStats.rows} rows</span>
                          <span>•</span>
                          <span>{fileStats.columns} columns</span>
                          <span>•</span>
                          <span>{fileStats.fileSize}</span>
                          {fileStats.sheets && (
                            <>
                              <span>•</span>
                              <span>{fileStats.sheets} sheet{fileStats.sheets > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={clearFile}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FiUpload className={`w-16 h-16 mx-auto transition-colors ${
                      isDragOver ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <div>
                      <p className="text-xl font-semibold text-gray-900 mb-2">
                        {isDragOver ? 'Drop your file here' : 'Upload your data file'}
                      </p>
                      <p className="text-gray-600">
                        Drag and drop your file here, or{' '}
                        <span className="text-blue-600 font-medium">click to browse</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                      <span className="px-3 py-1 bg-gray-100 rounded-full">.xlsx</span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full">.xls</span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full">.csv</span>
                    </div>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-blue-600 font-medium">Processing file...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {uploadStatus && (
            <div className="px-8 pb-8">
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="font-medium">{uploadStatus.message}</span>
              </div>
            </div>
          )}

          {/* File Requirements */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">File Requirements</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Supported Formats</h4>
                <ul className="space-y-1">
                  <li>• Excel files (.xlsx, .xls)</li>
                  <li>• CSV files (.csv)</li>
                  <li>• UTF-8 encoding recommended for CSV</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Best Practices</h4>
                <ul className="space-y-1">
                  <li>• First row should contain column headers</li>
                  <li>• Remove empty rows and columns</li>
                  <li>• File size limit: 100MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {fileName && fileStats && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Review</h3>
              <p className="text-gray-600 mb-4">
                Your file has been successfully uploaded with {fileStats.rows} prompts ready for review.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-sm text-gray-500">
                  Next: Navigate to the prompt list to start reviewing
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;