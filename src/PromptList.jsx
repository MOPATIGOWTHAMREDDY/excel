import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

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

  const handlePromptClick = (prompt) => {
    const index = prompts.findIndex(p => p._unit_id === prompt._unit_id);
    setSelectedPromptIndex(index);
  };

  const promptsWithDisagreements = enhancedPrompts.filter(p => p.disCount > 0);
  const reviewedPromptsWithDis = promptsWithDisagreements.filter(p => p.isReviewed);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="bg-black text-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <h1 className="text-2xl font-semibold mb-2">Prompt Review</h1>
          <p className="text-gray-300">Manage and review prompts efficiently</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl font-bold text-black mb-1">{originalData.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl font-bold text-black mb-1">{filteredPrompts.length}</div>
            <div className="text-sm text-gray-600">Showing</div>
          </div>
          <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl font-bold text-black mb-1">{promptsWithDisagreements.length}</div>
            <div className="text-sm text-gray-600">Disagreements</div>
          </div>
          <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl font-bold text-black mb-1">{reviewedPromptsWithDis.length}</div>
            <div className="text-sm text-gray-600">Reviewed</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-xl p-6 space-y-4">
          
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by Worker ID..."
              value={searchID}
              onChange={(e) => setSearchID(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
            {searchID && (
              <button
                onClick={() => setSearchID('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Worker ID Dropdown */}
          <select
            value={searchID}
            onChange={(e) => setSearchID(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
          >
            <option value="">All Worker IDs</option>
            {uniqueWorkerIds.map(id => (
              <option key={id} value={id} className="bg-white text-black">Worker {id}</option>
            ))}
          </select>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setDisagreementFilter(!disagreementFilter);
                if (!disagreementFilter) setReviewedFilter('all');
              }}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                disagreementFilter
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-black hover:bg-gray-50'
              }`}
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Disagreements Only
            </button>

            {disagreementFilter && (
              <select
                value={reviewedFilter}
                onChange={(e) => setReviewedFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="all" className="bg-white">All Status</option>
                <option value="reviewed" className="bg-white">Reviewed</option>
                <option value="pending" className="bg-white">Pending</option>
              </select>
            )}

            {(searchID || disagreementFilter || reviewedFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-white text-black border-2 border-gray-300 rounded-lg text-sm hover:border-black hover:bg-gray-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="bg-white border-2 border-black rounded-xl shadow-xl p-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 py-2 px-1 font-medium">Sort:</span>
            {[
              { key: '_unit_id', label: 'ID' },
              { key: 'prompt', label: 'Prompt' },
              { key: 'disCount', label: 'Disagreements' },
              { key: 'isReviewed', label: 'Status' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${
                  sortConfig.key === key
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black hover:bg-gray-50'
                }`}
              >
                {label} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt List */}
        <div className="space-y-3">
          {paginatedPrompts.length > 0 ? (
            paginatedPrompts.map((prompt) => (
              <div
                key={prompt._unit_id}
                onClick={() => handlePromptClick(prompt)}
                className={`group bg-white border-2 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:border-black transition-all ${
                  prompt.showReviewStatus && prompt.isReviewed
                    ? 'border-black border-l-8'
                    : prompt.showReviewStatus && !prompt.isReviewed
                    ? 'border-gray-400 border-l-8'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-white bg-black px-3 py-1 rounded-lg font-medium">
                      {prompt._unit_id}
                    </span>
                    {prompt.showReviewStatus && (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        prompt.isReviewed 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-black border-gray-400'
                      }`}>
                        {prompt.isReviewed ? <FiCheck className="mr-1 h-3 w-3" /> : <FiClock className="mr-1 h-3 w-3" />}
                        {prompt.isReviewed ? 'Reviewed' : 'Pending'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {prompt.disCount > 0 && (
                      <span className="bg-gray-100 text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-gray-300">
                        {prompt.disCount} disagreement{prompt.disCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-medium">Worker {prompt.orig__worker_id}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-gray-800 mb-3 leading-relaxed font-medium">{prompt.prompt}</div>

                {/* Tags */}
                {prompt.disCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(prompt)
                      .filter(([key, val]) => key.endsWith('_a_a') && val === 'dis')
                      .slice(0, 4)
                      .map(([key]) => (
                        <span 
                          key={key} 
                          className="text-xs bg-gray-100 text-black px-2 py-1 rounded border-2 border-gray-300 font-medium"
                        >
                          {key.replace('a_a', '').replace(/_/g, ' ')}
                        </span>
                      ))}
                    {Object.entries(prompt).filter(([key, val]) => key.endsWith('_a_a') && val === 'dis').length > 4 && (
                      <span className="text-xs text-gray-500 px-2 py-1 font-medium">
                        +{Object.entries(prompt).filter(([key, val]) => key.endsWith('_a_a') && val === 'dis').length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
              <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No prompts found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredPrompts.length > itemsPerPage && (
          <div className="bg-white border-2 border-black rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size} className="bg-white">{size}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-black hover:bg-gray-50 transition-all text-black"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-black hover:bg-gray-50 transition-all text-black"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptList;