// File: src/components/dashboard/views/PaperView.jsx

import React, { useState } from 'react';
import { Card } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Info, Search } from 'lucide-react';
import PaperCard from './PaperCard';

/**
 * Paper View
 * Displays papers with drill-down capability
 */
const PaperView = ({ papers, componentDetailViews, viewType = 'accuracy' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!papers || papers.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No papers available to display.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter papers based on search
  const filteredPapers = papers.filter(paper => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const title = paper.groundTruth?.title?.toLowerCase() || '';
    const doi = paper.doi?.toLowerCase() || '';
    
    return title.includes(searchLower) || doi.includes(searchLower);
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers by title or DOI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <span className="text-sm text-gray-600">
              {filteredPapers.length} of {papers.length} papers
            </span>
          )}
        </div>
      </Card>

      {/* Papers List */}
      {filteredPapers.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No papers match your search criteria.
          </AlertDescription>
        </Alert>
      ) : (
        filteredPapers.map((paper) => (
          <PaperCard
            key={paper.doi}
            paperData={paper}
            componentDetailViews={componentDetailViews}
            viewType={viewType}
          />
        ))
      )}
    </div>
  );
};

export default PaperView;