import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { apiFetch } from '../../lib/api';
import Tag from './Tag';

const MAX_TAGS = 10;

export default function TagInput({ label, value = [], onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsStyle, setSuggestionsStyle] = useState({});
  const containerRef = useRef(null);
  const inputWrapperRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    apiFetch('/tags')
      .then((data) => setAllTags((data || []).map((t) => t.label)))
      .catch(() => {});
  }, []);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(e.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target);
      if (isOutsideContainer && isOutsideDropdown) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function updateSuggestionsPosition() {
    if (inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      setSuggestionsStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 99999,
      });
    }
  }

  useEffect(() => {
    if (showSuggestions && inputValue.trim()) {
      updateSuggestionsPosition();
      window.addEventListener('scroll', updateSuggestionsPosition, true);
      window.addEventListener('resize', updateSuggestionsPosition);
      return () => {
        window.removeEventListener('scroll', updateSuggestionsPosition, true);
        window.removeEventListener('resize', updateSuggestionsPosition);
      };
    }
  }, [showSuggestions, inputValue]);

  function addTag(rawLabel) {
    const label = rawLabel.trim().toLowerCase();
    if (!label || value.length >= MAX_TAGS) return;
    if (value.some((t) => t.toLowerCase() === label)) {
      setInputValue('');
      return;
    }
    onChange([...value, label]);
    setInputValue('');
  }

  function removeTag(label) {
    onChange(value.filter((t) => t !== label));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const suggestions = allTags
    .filter((t) => t.toLowerCase().includes(inputValue.trim().toLowerCase()))
    .filter((t) => !value.some((v) => v.toLowerCase() === t.toLowerCase()))
    .slice(0, 8);

  const isNewTag = inputValue.trim() && !allTags.some((t) => t.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="ui-form-group" ref={containerRef} style={{ position: 'relative' }}>
      {label && <label className="ui-form-label">{label}</label>}
      <div
        ref={inputWrapperRef}
        className="ui-form-input"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', alignItems: 'center', minHeight: '2.75rem', cursor: 'text' }}
        onClick={() => textInputRef.current?.focus()}
      >
        {value.map((tagLabel) => (
          <Tag key={tagLabel} variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {tagLabel}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tagLabel);
                }}
                aria-label={`Retirer le tag ${tagLabel}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontWeight: 700, lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </Tag>
        ))}
        {value.length < MAX_TAGS && (
          <input
            ref={textInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            disabled={disabled}
            placeholder={value.length === 0 ? 'dessert, facile, hiver...' : ''}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: '1 1 100px', minWidth: '80px', color: 'var(--color-text-primary)' }}
          />
        )}
      </div>
      {showSuggestions && inputValue.trim() && ReactDOM.createPortal(
        <ul
          ref={dropdownRef}
          style={{
            ...suggestionsStyle,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '200px',
            overflowY: 'auto',
            listStyle: 'none',
            padding: 'var(--space-xs) 0',
            margin: 0,
          }}
        >
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => addTag(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {s}
              </button>
            </li>
          ))}
          {isNewTag && (
            <li>
              <button
                type="button"
                onClick={() => addTag(inputValue)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--color-primary-light)',
                  border: 'none',
                  borderTop: '1px solid var(--color-border-subtle)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                + Créer "{inputValue.trim().toLowerCase()}"
              </button>
            </li>
          )}
        </ul>,
        document.body
      )}
      {value.length >= MAX_TAGS && (
        <span className="ui-form-helper">Maximum {MAX_TAGS} tags par recette.</span>
      )}
    </div>
  );
}