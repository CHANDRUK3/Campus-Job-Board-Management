import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...rest }) => {
  const base = 'ui-button';
  const v = `ui-button--${variant}`;
  const s = `ui-button--${size}`;
  return (
    <button className={[base, v, s, className].join(' ')} {...rest}>
      {children}
    </button>
  );
};

export default Button;
