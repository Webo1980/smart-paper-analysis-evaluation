// src/components/shared/ErrorMessage.jsx
import React from 'react';

const ErrorMessage = ({ message }) => (
  <p className="text-sm text-red-500 mt-1">{message}</p>
);

export default ErrorMessage;