import React from 'react';

export default function Card({
  children,
  interactive = false,
  className = '',
  onClick,
  ...props
}) {
  const cardClasses = 'ui-card' + (interactive ? ' ui-card-interactive' : '') + (className ? ' ' + className : '');

  return (
    <div
      className={cardClasses}
      onClick={interactive ? onClick : undefined}
      role={interactive && onClick ? 'button' : undefined}
      tabIndex={interactive && onClick ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`ui-card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`ui-card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`ui-card-footer ui-card-border-top ${className}`} {...props}>
      {children}
    </div>
  );
};
