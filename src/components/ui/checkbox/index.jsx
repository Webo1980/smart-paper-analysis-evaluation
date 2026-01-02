// src/components/ui/checkbox/index.jsx
import React from 'react';

export const Checkbox = React.forwardRef(({ id, label, checked, onCheckedChange, disabled, className }, ref) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id={id}
      ref={ref}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      className={`w-4 h-4 text-[#E86161] border-gray-300 rounded focus:ring-[#E86161] ${className}`}
    />
    {label && (
      <label htmlFor={id} className="text-sm font-medium cursor-pointer">
        {label}
      </label>
    )}
  </div>
));

