import React from 'react';

export default function Tag({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <span className={`ui-tag ui-tag-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}
