import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`ui-btn ui-btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
