// src/components/shared/RequiredLabel.jsx
import React from 'react';

const RequiredLabel = ({ children }) => (
  <div className="flex items-center space-x-1">
    <span>{children}</span>
    <span className="text-red-500">*</span>
  </div>
);

export default RequiredLabel;