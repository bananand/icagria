import Alert from '../models/Alert.js';
import Crop from '../models/Crop.js';
import { evaluatePh } from './phStatus.js';

export const createPhAlertIfNeeded = async (farm, reading) => {
  if (!farm || !reading) return null;

  let mainCrop = farm.mainCrop;
  if (mainCrop && (!mainCrop.name || !mainCrop.phMin)) {
    mainCrop = await Crop.findById(mainCrop);
  }

  if (!mainCrop) return null;

  const evaluation = evaluatePh(reading.value, mainCrop);

  if (evaluation.status === 'too_acidic') {
    const message = `Soil pH ${reading.value} on '${farm.name}' is below the suitable range (${mainCrop.phMin} to ${mainCrop.phMax}) for ${mainCrop.name}.`;
    const alert = await Alert.create({
      farm: farm._id,
      user: farm.owner,
      type: 'ph',
      level: 'warning',
      reading: reading._id,
      message,
    });
    return alert;
  }

  if (evaluation.status === 'too_alkaline') {
    const message = `Soil pH ${reading.value} on '${farm.name}' is above the suitable range (${mainCrop.phMin} to ${mainCrop.phMax}) for ${mainCrop.name}.`;
    const alert = await Alert.create({
      farm: farm._id,
      user: farm.owner,
      type: 'ph',
      level: 'warning',
      reading: reading._id,
      message,
    });
    return alert;
  }

  return null;
};

export default { createPhAlertIfNeeded };
