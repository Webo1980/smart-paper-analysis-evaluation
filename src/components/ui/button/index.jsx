import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const Button = ({ children, onClick, className, disabled, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md',
        'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'disabled:bg-gray-400 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};


export { Button }
