// src/components/shared/Notification.jsx
import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';

const Notification = ({ title, description, type = 'info', onClose }) => {
  const bgColors = {
    success: 'bg-green-100 border-green-400',
    error: 'bg-red-100 border-red-400',
    info: 'bg-blue-100 border-blue-400',
    warning: 'bg-yellow-100 border-yellow-400'
  };

  return (
    <Toast.Root 
      className={`${bgColors[type]} border-l-4 p-4 rounded-r-lg shadow-md`}
    >
      <div className="flex justify-between items-start">
        <div>
          <Toast.Title className="font-medium mb-1">
            {title}
          </Toast.Title>
          <Toast.Description className="text-sm">
            {description}
          </Toast.Description>
        </div>
        <Toast.Close asChild>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </Toast.Close>
      </div>
    </Toast.Root>
  );
};

export default Notification;