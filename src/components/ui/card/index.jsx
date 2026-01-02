// src\components\ui\card\index.jsx
import React from "react";

export function Card({ children, className }) {
  return (
    <div className={`bg-white shadow-md rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={`text-lg font-semibold mb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <div className={`text-xl font-bold ${className}`}>{children}</div>;
}

export function CardDescription({ children, className }) {
  return <div className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</div>;
}

export function CardContent({ children, className }) {
  return <div className={`text-gray-700 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={`mt-4 border-t pt-2 ${className}`}>{children}</div>;
}
