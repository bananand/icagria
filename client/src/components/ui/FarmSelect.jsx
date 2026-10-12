// src/components/ui/FarmSelect.jsx
// Reusable farm selector dropdown backed by FarmContext.
// Props:
// - allowAll: boolean (includes an "All farms" option with value="")
// - value: string (optional controlled value; if not provided, uses FarmContext's selectedFarmId)
// - onChange: function (optional change callback(farmId); defaults to setSelectedFarmId)
// - disabled: boolean
// - className: string

import React from 'react';
import { useFarm } from '../../context/FarmContext';
import Select from './Select';

export default function FarmSelect({
  allowAll = false,
  value,
  onChange,
  disabled = false,
  className = '',
  ...rest
}) {
  const { farms, selectedFarmId, setSelectedFarmId, loading } = useFarm();

  const currentValue = value !== undefined ? value : selectedFarmId;

  const handleChange = (e) => {
    const newVal = e.target.value;
    if (onChange) {
      onChange(newVal);
    } else {
      setSelectedFarmId(newVal);
    }
  };

  return (
    <Select
      value={currentValue}
      onChange={handleChange}
      disabled={disabled || loading}
      className={className}
      aria-label="Select farm"
      {...rest}
    >
      {allowAll && <option value="">All farms</option>}
      {!allowAll && farms.length === 0 && (
        <option value="">No farms available</option>
      )}
      {farms.map((farm) => (
        <option key={farm._id} value={farm._id}>
          {farm.name} {farm.location?.text ? `(${farm.location.text})` : ''}
        </option>
      ))}
    </Select>
  );
}
