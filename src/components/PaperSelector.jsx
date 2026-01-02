src\components\PaperSelector.jsx
import React from 'react';

const PaperSelector = ({ papers, onPaperSelect }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Select Paper</h2>
      <div className="space-y-4">
        {papers.map((paper) => (
          <button
            key={paper.paper_id}
            onClick={() => onPaperSelect(paper)}
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <h3 className="font-semibold">{paper.title}</h3>
            <p className="text-sm text-gray-600">DOI: {paper.doi}</p>
            <p className="text-sm text-gray-600">Paper ID: {paper.paper_id}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaperSelector;