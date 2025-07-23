import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ tags, onChange, placeholder = "Add a tag...", className = "" }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove the last tag if backspace is pressed and input is empty
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const newTags = pastedText
      .split(/[,\n\t]/) // Split on comma, newline, or tab
      .map(tag => tag.trim())
      .filter(tag => tag && !tags.includes(tag));
    
    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
    setInputValue('');
  };

  return (
    <div className={`flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background min-h-[40px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
      {/* Existing tags */}
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
            aria-label={`Remove tag: ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      {/* Input for new tags */}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        onPaste={handlePaste}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0 h-auto"
        style={{ outline: 'none', boxShadow: 'none' }}
      />
    </div>
  );
}
