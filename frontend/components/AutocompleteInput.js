'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Autocomplete Input Component
 * Shows suggestions in a dropdown while typing
 */
export default function AutocompleteInput({
    value,
    onChange,
    suggestions = [],
    placeholder = '',
    className = '',
    style = {}
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);

    // Filter suggestions based on input
    useEffect(() => {
        if (!value || !value.trim()) {
            setFilteredSuggestions([]);
            return;
        }

        const filtered = suggestions
            .filter(s => s.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 8); // Max 8 suggestions

        setFilteredSuggestions(filtered);
    }, [value, suggestions]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    onChange({ target: { value: filteredSuggestions[highlightedIndex] } });
                    setShowDropdown(false);
                    setHighlightedIndex(-1);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleSelect = (suggestion) => {
        onChange({ target: { value: suggestion } });
        setShowDropdown(false);
        setHighlightedIndex(-1);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e);
                    setShowDropdown(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (filteredSuggestions.length > 0) {
                        setShowDropdown(true);
                    }
                }}
                placeholder={placeholder}
                className={className}
                style={style}
                autoComplete="off"
            />

            {showDropdown && filteredSuggestions.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1000
                    }}
                >
                    {filteredSuggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(suggestion)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            style={{
                                padding: '0.6rem 1rem',
                                cursor: 'pointer',
                                backgroundColor: index === highlightedIndex
                                    ? 'var(--color-secondary-light)'
                                    : 'transparent',
                                borderBottom: index < filteredSuggestions.length - 1
                                    ? '1px solid var(--color-border)'
                                    : 'none',
                                transition: 'background-color 0.15s'
                            }}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
