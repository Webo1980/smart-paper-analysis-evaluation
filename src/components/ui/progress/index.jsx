import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

const Progress = React.forwardRef(({ 
  className = "", 
  value = 0, 
  max = 100,
  ...props 
}, ref) => {
  const percentage = value != null ? Math.min(Math.max(value, 0), max) : 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-[#E86161] transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = "Progress";

export { Progress };