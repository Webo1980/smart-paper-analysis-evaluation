// src/components/PaperInfoCard.jsx
import React from 'react';
import { ExternalLink } from 'lucide-react';

const PaperInfoCard = ({ paper }) => {
  if (!paper) return null;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Research Field</label>
          <p className="font-medium text-gray-900">{paper.research_field_name}</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">ORKG ID</label>
          <a 
            href={`https://orkg.org/paper/${paper.paper_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-[#E86161] hover:text-[#c54545] font-medium"
          >
            {paper.paper_id}
            <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
        <div className="space-y-1 col-span-full">
          <label className="text-sm font-medium text-gray-500">Title</label>
          <a 
            href={`https://orkg.org/paper/${paper.paper_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start text-[#E86161] hover:text-[#c54545] font-medium"
          >
            {paper.title}
            <ExternalLink size={14} className="ml-1 mt-1 flex-shrink-0" />
          </a>
        </div>
        <div className="space-y-1 col-span-full">
          <label className="text-sm font-medium text-gray-500">DOI</label>
          <a 
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-[#E86161] hover:text-[#c54545] font-medium"
          >
            {paper.doi}
            <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaperInfoCard;