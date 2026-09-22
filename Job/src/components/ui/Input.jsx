import React from 'react';

const Input = ({ label, id, className = '', ...rest }) => {
  return (
    <label className={['ui-field', className].join(' ')} htmlFor={id}>
      {label && <div className="ui-field__label">{label}</div>}
      <input id={id} className="ui-input" {...rest} />
    </label>
  );
};

export default Input;
