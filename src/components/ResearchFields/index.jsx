// src/components/ResearchFields/index.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';

const ResearchFieldsPage = ({ fields, papers, selectedPaper, onSelectPaper, onNext, onPrevious }) => {
  const [openFields, setOpenFields] = useState(new Set());

  const toggleField = (field) => {
    const newOpenFields = new Set(openFields);
    if (newOpenFields.has(field)) {
      newOpenFields.delete(field);
    } else {
      newOpenFields.add(field);
    }
    setOpenFields(newOpenFields);
  };

  const getPapersByField = (field) => {
    return papers.filter(paper => paper.research_field_name === field);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-[#E86161] mb-6">
        Select Research Field and Paper
      </h2>

      <div className="space-y-4">
        {fields.map((field) => (
          <Collapsible.Root
            key={field}
            open={openFields.has(field)}
            onOpenChange={() => toggleField(field)}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <Collapsible.Trigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
              <span className="font-medium">{field}</span>
              {openFields.has(field) ? (
                <ChevronDown className="text-gray-500" />
              ) : (
                <ChevronRight className="text-gray-500" />
              )}
            </Collapsible.Trigger>

            <Collapsible.Content>
              <div className="p-4 border-t space-y-3">
                {getPapersByField(field).map((paper) => (
                  <button
                    key={paper.paper_id}
                    onClick={() => onSelectPaper(paper)}
                    className={`w-full p-3 text-left rounded-lg transition-colors duration-200
                      ${selectedPaper?.paper_id === paper.paper_id
                        ? 'bg-[#E86161] text-white'
                        : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <h3 className="font-medium mb-1">{paper.title}</h3>
                    <p className="text-sm opacity-80">DOI: {paper.doi}</p>
                  </button>
                ))}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!selectedPaper}
          className={`px-6 py-2 rounded-lg text-white
            ${selectedPaper 
              ? 'bg-[#E86161] hover:bg-[#c54545]' 
              : 'bg-gray-300 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ResearchFieldsPage;