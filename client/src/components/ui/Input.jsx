import React from 'react';

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
  error = '',
  helperText = '',
  className = '',
  ...props
}) {
  const generatedId = 'inp-' + Math.random().toString(36).slice(2, 8);
  const inputId = props.id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`ui-form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="ui-form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`ui-form-input ${error ? 'ui-form-input-error' : ''}`}
        aria-describedby={
          error ? errorId : helperText ? helperId : undefined
        }
        {...props}
      />
      {error ? (
        <span id={errorId} className="ui-form-helper ui-form-helper-error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="ui-form-helper">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
