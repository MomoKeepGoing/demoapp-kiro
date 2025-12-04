import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching: boolean;
}

/**
 * SearchBar component for searching users
 * Requirements: 1.1-1.7, 6.1, 6.3, 6.6, 7.2, 7.3
 * 
 * Features:
 * - Search input with placeholder
 * - Debounce handling (300ms delay)
 * - Loading state indicator
 * - WhatsApp-style design
 */
export function SearchBar({ value, onChange, isSearching }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced callback
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="search-bar">
      <div className="search-bar-container">
        <span className="search-bar-icon">🔍</span>
        <input
          type="text"
          className="search-bar-input"
          placeholder="搜索用户名或邮箱..."
          value={localValue}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={isSearching}
        />
        {isSearching && (
          <div className="search-bar-loading">
            <div className="search-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
}
