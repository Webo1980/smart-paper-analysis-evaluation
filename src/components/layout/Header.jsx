import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Timer, LogOut } from 'lucide-react';

const Header = ({ steps, onLogout }) => {
  console.log(steps);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState('0 min');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Calculate total estimated time
    if (steps && steps.length > 0) {
      const total = steps.reduce((acc, step) => {
        const [min] = step.estimatedTime.split('-').map(Number);
        return acc + min;
      }, 0);
      setTotalEstimatedTime(`${total} min`);
    }
  }, [steps]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback if no onLogout provided
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
    
    // Close the confirmation modal
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <a href="/" className="flex items-center space-x-4">
          <img 
            src="/src/assets/orkg.png" 
            alt="ORKG Logo" 
            className="h-24 w-auto"
          />
          <span className="text-3xl font-bold text-[#E86161] mb-1">
            Smart Paper Analysis Evaluation System
          </span> 
        </a>
        
        <div className="flex items-center space-x-6">
          {/* Timer Display */}
          {steps && steps.length > 0 && (
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" /> 
              <span className="text-sm text-blue-700 font-semibold">
                Total Est. Time: {totalEstimatedTime}
              </span>
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to logout? This will clear all your evaluation data and session information.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;