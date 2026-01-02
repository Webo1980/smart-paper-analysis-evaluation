// Select.jsx
import React from 'react';

export const Select = ({ children, value, onValueChange }) => {
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

// SelectTrigger.jsx
export const SelectTrigger = ({ children, onClick }) => {
  return (
    <button
      className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// SelectValue.jsx
export const SelectValue = ({ children, placeholder }) => {
  return (
    <span className="block truncate">
      {children || placeholder || "Select an option"}
    </span>
  );
};

// SelectContent.jsx
export const SelectContent = ({ children, isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="max-h-60 overflow-auto py-1">
        {children}
      </div>
    </div>
  );
};

// SelectItem.jsx
export const SelectItem = ({ children, value, onSelect }) => {
  return (
    <div
      className="cursor-pointer select-none px-4 py-2 text-sm hover:bg-gray-100"
      onClick={() => onSelect(value)}
    >
      {children}
    </div>
  );
};