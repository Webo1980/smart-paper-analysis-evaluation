import React from "react";

const Input = React.forwardRef(({ 
  className = "",
  type = "text",
  error,
  disabled,
  ...props
}, ref) => {
  return (
    <input
      type={type}
      className={`
        flex h-10 w-full rounded-md border border-gray-200 
        bg-white px-3 py-2 text-sm 
        file:border-0 file:bg-transparent file:text-sm file:font-medium
        placeholder:text-gray-500
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-[#E86161] focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
        ${className}
      `}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };