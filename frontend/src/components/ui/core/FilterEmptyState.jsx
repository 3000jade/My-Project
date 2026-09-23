import React from 'react';

export default function FilterEmptyState({ tightestFilter, onClearFilter, suggestions = [] }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
      <p className="text-sm text-gray-500 mb-6">
        We couldn't find anything matching your exact criteria. Try adjusting your filters.
      </p>

      {tightestFilter && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">This filter might be too strict:</p>
          <button
            onClick={() => onClearFilter(tightestFilter.key)}
            className="h-[54px] px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors"
          >
            {tightestFilter.label}
          </button>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Other suggestions:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.key}
                onClick={() => onClearFilter(suggestion.key)}
                className="h-[54px] px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-sm transition-colors"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
