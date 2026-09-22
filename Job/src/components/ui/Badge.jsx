import React from 'react';

const Badge = ({ children, tone = 'info', className = '' }) => {
  return (
    <span className={["ui-badge", `ui-badge--${tone}`, className].join(' ')}>
      {children}
    </span>
  );
};

export default Badge;
