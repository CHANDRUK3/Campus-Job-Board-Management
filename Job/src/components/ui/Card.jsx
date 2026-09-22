import React from 'react';

const Card = ({ children, className = '', elevated = false, ...rest }) => {
  return (
    <div className={["ui-card", elevated ? 'ui-card--elevated' : '', className].join(' ')} {...rest}>
      {children}
    </div>
  );
};

export default Card;
