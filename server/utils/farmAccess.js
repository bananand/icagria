import Farm from '../models/Farm.js';
import ApiError from './ApiError.js';

export const getFarmForUser = async (user, farmId, { write = false } = {}) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (user.role === 'buyer') {
    throw new ApiError(403, 'Forbidden: Buyers cannot access farm resources');
  }

  if (!farmId) {
    throw new ApiError(400, 'Farm ID is required');
  }

  const farm = await Farm.findById(farmId);
  if (!farm) {
    throw new ApiError(404, 'Farm not found');
  }

  if (user.role === 'admin') {
    if (write) {
      throw new ApiError(403, 'Forbidden: Admin has read-only access to farms');
    }
    return farm;
  }

  if (user.role === 'farmer') {
    if (farm.owner.toString() !== user._id.toString()) {
      throw new ApiError(403, 'Forbidden: Farm does not belong to you');
    }
    return farm;
  }

  throw new ApiError(403, 'Forbidden: Access denied');
};

export default { getFarmForUser };
