import React from 'react';

export const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={`tabs ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab: value, onTabChange: onValueChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, onTabChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsTrigger = ({ value, children, activeTab, onTabChange, className = '' }) => {
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => {
        if (typeof onTabChange === 'function') {
          onTabChange(value);
        } else {
          console.error('onTabChange is not a function:', onTabChange);
        }
      }}
      className={`
        flex-1 px-4 py-2 text-sm font-medium transition-colors
        ${isActive 
          ? 'border-b-2 border-blue-500 text-blue-600' 
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, activeTab, className = '' }) => {
  if (activeTab !== value) return null;
  
  return (
    <div className={`py-4 ${className}`}>
      {children}
    </div>
  );
};