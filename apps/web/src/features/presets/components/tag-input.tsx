"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-ink text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="text-brand-ink/50 hover:text-brand-ink transition-colors"
                onClick={() => removeTag(tag)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        placeholder={placeholder}
        className="w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-brand-ink hover:border-gray-300 focus:outline-none focus:border-brand-green transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal"
      />
    </div>
  );
}
