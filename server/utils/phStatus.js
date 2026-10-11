export const evaluatePh = (value, crop) => {
  if (!crop || crop.phMin === undefined || crop.phMax === undefined || crop.phMin === null || crop.phMax === null) {
    return {
      status: 'unknown',
      label: 'Unknown',
      message: 'No suitable crop pH range configured.',
      range: null,
      cropName: crop?.name || null,
    };
  }

  const { phMin, phMax, name: cropName } = crop;
  const numValue = Number(value);

  if (numValue < phMin) {
    return {
      status: 'too_acidic',
      label: 'Too Acidic',
      message: `Soil pH is below the suitable range for ${cropName}. Consider asking a local agricultural extension officer about ways to raise soil pH.`,
      range: { min: phMin, max: phMax },
      cropName,
    };
  }

  if (numValue > phMax) {
    return {
      status: 'too_alkaline',
      label: 'Too Alkaline',
      message: `Soil pH is above the suitable range for ${cropName}. Consider asking a local agricultural extension officer about ways to lower soil pH.`,
      range: { min: phMin, max: phMax },
      cropName,
    };
  }

  return {
    status: 'suitable',
    label: 'Suitable',
    message: `Soil pH is within the suitable range for ${cropName}.`,
    range: { min: phMin, max: phMax },
    cropName,
  };
};

export default { evaluatePh };
