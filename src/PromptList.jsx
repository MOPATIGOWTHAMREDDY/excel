import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight, FiDownload, FiCheck, FiClock } from 'react-icons/fi';
import * as XLSX from 'xlsx';

function PromptList({
  prompts,
  setSelectedPromptIndex,
  originalData,
  setFilteredPrompts,
  data,
  reviewedPrompts = [],
  onPromptReviewed
}) {
  const [searchID, setSearchID] = useState('');
  const [disagreementFilter, setDisagreementFilter] = useState(false);
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '_unit_id', direction: 'asc' });

  const uniqueWorkerIds = useMemo(() =>
    [...new Set(originalData.map(item => item.orig__worker_id))].filter(Boolean),
    [originalData]
  );

  // ✅ FIXED: Count all _a_a === 'dis', including metadata fields like is_pmpt_intentful_qc_a_a
  const countDisagreements = useCallback((prompt) => {
    return Object.entries(prompt).reduce((count, [key, val]) => {
      return key.endsWith('_a_a') && val === 'dis' ? count + 1 : count;
    }, 0);
  }, []);

  const isPromptReviewed = useCallback((promptId) => {
    return reviewedPrompts.some(p => p._unit_id === promptId);
  }, [reviewedPrompts]);

  const enhancedPrompts = useMemo(() =>
    prompts.map(prompt => {
      const disCount = countDisagreements(prompt);
      const isReviewed = isPromptReviewed(prompt._unit_id);
      return {
        ...prompt,
        disCount,
        isReviewed,
        showReviewStatus: disCount > 0
      };
    }),
    [prompts, countDisagreements, isPromptReviewed]
  );

  const filteredPrompts = useMemo(() => {
    return enhancedPrompts
      .filter(prompt => {
        const matchesSearch = prompt.orig__worker_id?.toString().includes(searchID);
        const matchesDisagreement = !disagreementFilter || prompt.disCount > 0;
        let matchesReview = true;
        if (prompt.disCount > 0) {
          matchesReview = reviewedFilter === 'all' ||
            (reviewedFilter === 'reviewed' && prompt.isReviewed) ||
            (reviewedFilter === 'pending' && !prompt.isReviewed);
        }
        return matchesSearch && matchesDisagreement && matchesReview;
      })
      .sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [enhancedPrompts, searchID, disagreementFilter, reviewedFilter, sortConfig]);

  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
  const paginatedPrompts = filteredPrompts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSearchID('');
    setDisagreementFilter(false);
    setReviewedFilter('all');
    setFilteredPrompts(originalData);
    setCurrentPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = originalData.filter(row =>
        row.orig__worker_id?.toString().includes(searchID)
      );
      setFilteredPrompts(filtered);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchID, originalData, setFilteredPrompts]);

  const handleDownloadAll = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Prompts');
    XLSX.writeFile(workbook, 'All_Prompts.xlsx');
    alert('All prompts exported successfully!');
  };

  const handleDownloadReviewed = () => {
    if (reviewedPrompts.length === 0) {
      alert('No reviewed prompts to export!');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reviewedPrompts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviewed Prompts');
    XLSX.writeFile(workbook, 'Reviewed_Prompts.xlsx');
    alert('Reviewed prompts exported successfully!');
  };

  const handlePromptClick = (prompt) => {
    const index = prompts.findIndex(p => p._unit_id === prompt._unit_id);
    setSelectedPromptIndex(index);
  };

  const promptsWithDisagreements = enhancedPrompts.filter(p => p.disCount > 0);
  const reviewedPromptsWithDis = promptsWithDisagreements.filter(p => p.isReviewed);

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Prompt Review Dashboard</h1>
        <p className="text-gray-600">Review and manage your prompts efficiently</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Worker ID..."
              value={searchID}
              onChange={(e) => setSearchID(e.target.value)}
              className="border border-gray-300 pl-10 pr-10 py-2.5 rounded-lg w-full"
            />
            {searchID && (
              <FiX
                className="absolute right-3 top-3 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setSearchID('')}
              />
            )}
          </div>

          <select
            value={searchID}
            onChange={(e) => setSearchID(e.target.value)}
            className="border border-gray-300 px-4 py-2.5 rounded-lg min-w-48"
          >
            <option value="">All Worker IDs</option>
            {uniqueWorkerIds.map(id => (
              <option key={id} value={id}>Worker {id}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          {disagreementFilter && (
            <select
              value={reviewedFilter}
              onChange={(e) => setReviewedFilter(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="reviewed">Reviewed Only</option>
              <option value="pending">Pending Review</option>
            </select>
          )}

          <button
            onClick={() => {
              setDisagreementFilter(!disagreementFilter);
              if (!disagreementFilter) setReviewedFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              disagreementFilter
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <FiFilter />
            Disagreements Only
          </button>

          {(searchID || disagreementFilter || reviewedFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              Reset All
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiDownload />
            Export All
          </button>
          <button
            onClick={handleDownloadReviewed}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiCheck />
            Export Reviewed ({reviewedPromptsWithDis.length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{originalData.length}</div>
          <div className="text-sm text-gray-600">Total Prompts</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{filteredPrompts.length}</div>
          <div className="text-sm text-gray-600">Showing</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">{reviewedPromptsWithDis.length}</div>
          <div className="text-sm text-gray-600">Reviewed (with disagreements)</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-red-600">{promptsWithDisagreements.length}</div>
          <div className="text-sm text-gray-600">With Disagreements</div>
        </div>
      </div>

      {/* Sort Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: '_unit_id', label: 'Unit ID' },
          { key: 'prompt', label: 'Prompt' },
          { key: 'disCount', label: 'Disagreements' },
          { key: 'isReviewed', label: 'Review Status' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => requestSort(key)}
            className={`px-3 py-2 text-sm rounded-lg ${
              sortConfig.key === key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label} {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      {/* Prompt Cards */}
      <div className="space-y-3">
        {paginatedPrompts.length > 0 ? (
          paginatedPrompts.map((prompt, idx) => (
            <div
              key={prompt._unit_id}
              onClick={() => handlePromptClick(prompt)}
              className={`p-5 bg-white rounded-xl shadow-sm border-l-4 cursor-pointer hover:shadow-md ${
                prompt.showReviewStatus && prompt.isReviewed
                  ? 'border-l-green-500 bg-green-50/30'
                  : prompt.showReviewStatus && !prompt.isReviewed
                  ? 'border-l-yellow-500 bg-yellow-50/30'
                  : 'border-l-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-500">ID: {prompt._unit_id}</div>
                  {prompt.showReviewStatus && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      prompt.isReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {prompt.isReviewed ? <FiCheck size={12} /> : <FiClock size={12} />}
                      {prompt.isReviewed ? 'Reviewed' : 'Pending'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {prompt.disCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                      {prompt.disCount} disagreement{prompt.disCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <div className="text-xs text-gray-400">Worker: {prompt.orig__worker_id}</div>
                </div>
              </div>

              <div className="text-gray-800 font-medium mb-3 leading-relaxed">{prompt.prompt}</div>

              {prompt.disCount > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(prompt)
                    .filter(([key, val]) => key.endsWith('_a_a') && val === 'dis')
                    .slice(0, 5)
                    .map(([key]) => (
                      <span key={key} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200">
                        {key.replace('a_a', '').replace(/_/g, ' ')}
                      </span>
                    ))}
                  {Object.entries(prompt).filter(([key, val]) => key.endsWith('_a_a') && val === 'dis').length > 5 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{Object.entries(prompt).filter(([key, val]) => key.endsWith('_a_a') && val === 'dis').length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-2">No prompts found</p>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPrompts.length > itemsPerPage && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromptList;