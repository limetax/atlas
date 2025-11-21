import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, className = "", ...props }, ref) => {
    const baseStyles =
      "w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 resize-none";
    const normalStyles =
      "border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10";
    const errorStyles =
      "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10";

    return (
      <textarea
        ref={ref}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

