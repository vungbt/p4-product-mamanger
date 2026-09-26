import { useState } from 'react';
import { InputNumber, type InputNumberProps } from '../input-number';

export type QuantitySelectorProps = InputNumberProps;

export const QuantitySelector = (props: QuantitySelectorProps) => {
  const [currentValue, setCurrentValue] = useState(props.value || props.defaultValue);
  const handleChange = (newValue: number) => {
    setCurrentValue(newValue);
    if (props.onChange) {
      props.onChange(newValue);
    }
  };
  return <InputNumber {...props} value={currentValue} onChange={handleChange} />;
};
