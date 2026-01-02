// src/components/FieldSelector.jsx
import React from 'react';

const FieldSelector = ({ fields, onFieldSelect }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Select Research Field</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <button
            key={field}
            onClick={() => onFieldSelect(field)}
            className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            <span className="font-medium">{field}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FieldSelector;