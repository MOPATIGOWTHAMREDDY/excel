import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function PromptList({ prompts, setSelectedPromptIndex, originalData, setFilteredPrompts }) {
  const [searchID, setSearchID] = useState('');
  const [disagreementFilter, setDisagreementFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '_unit_id', direction: 'asc' });

  // Unique Worker IDs
  const uniqueWorkerIds = [...new Set(originalData.map(item => item.orig__worker_id))];

  // Count disagreements and add to each prompt
  const enhancedPrompts = prompts.map(prompt => ({
    ...prompt,
    disCount: countDisagreements(prompt)
  }));

  // Filter and sort logic
  const filteredPrompts = enhancedPrompts
    .filter(prompt =>
      prompt.orig__worker_id?.toString().includes(searchID) &&
      (!disagreementFilter || prompt.disCount > 0)
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
  const paginatedPrompts = filteredPrompts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Count disagreements in _a_a columns
  function countDisagreements(prompt) {
    return Object.keys(prompt).reduce((count, key) => {
      const isDisagreement = key.endsWith('_a_a') && prompt[key] === 'dis';
      const isQC = key.includes('is_pmpt_') || key.includes('_qc');
      return isDisagreement && !isQC ? count + 1 : count;
    }, 0);
  }

  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchID('');
    setDisagreementFilter(false);
    setFilteredPrompts(originalData);
  };

  // Auto-search when searchID changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchID]);

  const handleSearch = () => {
    const filtered = originalData.filter((row) =>
      row.orig__worker_id?.toString().includes(searchID)
    );
    setFilteredPrompts(filtered);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow">
        {/* Search Input with Autocomplete */}
        <div className="relative flex-grow w-full md:w-auto">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Worker ID or select below..."
            value={searchID}
            onChange={(e) => setSearchID(e.target.value)}
            className="border border-gray-300 pl-10 pr-4 py-2 rounded-md w-full"
          />
          {searchID && (
            <FiX
              className="absolute right-3 top-3 text-gray-400 cursor-pointer"
              onClick={() => setSearchID('')}
            />
          )}

          {/* Autocomplete Suggestions */}
          {searchID && (
            <div className="absolute bg-white border border-gray-200 mt-1 rounded-md shadow z-10 max-h-40 overflow-y-auto w-full">
              {uniqueWorkerIds
                .filter(id => id.toString().includes(searchID))
                .map(id => (
                  <div
                    key={id}
                    onClick={() => setSearchID(id.toString())}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {id}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Dropdown Filter */}
        <div className="w-full md:w-auto">
          <select
            value={searchID}
            onChange={(e) => setSearchID(e.target.value)}
            className="border border-gray-300 pl-4 pr-4 py-2 rounded-md w-full"
          >
            <option value="">Select Worker ID</option>
            {uniqueWorkerIds.map(id => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        {/* Disagreement Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setDisagreementFilter(!disagreementFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition ${
              disagreementFilter ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <FiFilter />
            Disagreements Only
          </button>

          {(searchID || disagreementFilter) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 text-sm bg-white p-3 rounded-lg shadow">
        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
          Total: {originalData.length}
        </div>
        <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full">
          Showing: {filteredPrompts.length}
        </div>
        <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full">
          With Disagreements: {enhancedPrompts.filter(p => p.disCount > 0).length}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {['_unit_id', 'prompt'].map((key) => (
          <button
            key={key}
            onClick={() => requestSort(key)}
            className={`px-3 py-1 text-sm rounded-md whitespace-nowrap ${
              sortConfig.key === key
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {key.replace('_', ' ')}
            {sortConfig.key === key && (
              sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
            )}
          </button>
        ))}
      </div>

      {/* Prompt Cards */}
      <div className="grid gap-3">
        {paginatedPrompts.length > 0 ? (
          paginatedPrompts.map((prompt, idx) => (
            <div
              key={prompt._unit_id}
              onClick={() => setSelectedPromptIndex(prompts.findIndex(p => p._unit_id === prompt._unit_id))}
              className="p-4 bg-white shadow rounded-md cursor-pointer hover:shadow-md transition group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-500 mb-1">ID: {prompt._unit_id}</div>
                  <div className="text-gray-800 font-medium line-clamp-2 mb-2">
                    {prompt.prompt}
                  </div>
                </div>
                {prompt.disCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                    {prompt.disCount}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(prompt)
                  .filter(([key, val]) => key.endsWith('_a_a') && val === 'dis')
                  .map(([key]) => (
                    <span key={key} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                      {key.replace('_a_a', '')}
                    </span>
                  ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No prompts found matching your criteria</p>
            <button
              onClick={resetFilters}
              className="mt-2 text-indigo-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPrompts.length > itemsPerPage && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border disabled:opacity-50"
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border disabled:opacity-50"
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