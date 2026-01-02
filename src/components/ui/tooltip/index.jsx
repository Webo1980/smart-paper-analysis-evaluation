// src/components/ui/tooltip/index.jsx
import React, { useState } from 'react';

export const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => 
        React.cloneElement(child, {
          isOpen,
          setIsOpen
        })
      )}
    </div>
  );
};

export const TooltipTrigger = ({ children, isOpen, setIsOpen }) => {
  return (
    <div 
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className="inline-block"
    >
      {children}
    </div>
  );
};

export const TooltipContent = ({ children, isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute z-50 px-3 py-2 text-sm bg-[#E86161] text-white rounded-lg shadow-lg bottom-full mb-2 left-1/2 transform -translate-x-1/2">
      {children}
      <div className="absolute w-2 h-2 bg-[#E86161] transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
    </div>
  );
};