import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface TooltipProps {
  content: string | undefined;
  children: JSX.Element;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className = "" }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800",
    left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800",
    right: "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800"
  };

  return (
    <div className={`relative inline-block group ${className}`}>
      {children}

      {/* Tooltip content */}
      <div className={`
        absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
        whitespace-nowrap ${positionClasses[position]}
      `}>
        {content}

        {/* Tooltip arrow */}
        <div className={`
          absolute w-0 h-0 border-4 ${arrowClasses[position]}
        `}></div>
      </div>
    </div>
  );
}
