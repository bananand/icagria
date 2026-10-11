import Farm from '../models/Farm.js';
import Planting from '../models/Planting.js';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';

/**
 * Delete a farm and all associated plantings, devices, readings, and alerts
 * @param {string|mongoose.Types.ObjectId} farmId
 */
export const deleteFarmCascade = async (farmId) => {
  await Planting.deleteMany({ farm: farmId });
  await Device.deleteMany({ farm: farmId });
  await PhReading.deleteMany({ farm: farmId });
  await Alert.deleteMany({ farm: farmId });
  await Farm.deleteOne({ _id: farmId });
};

export default { deleteFarmCascade };
