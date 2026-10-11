import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import cropRoutes from './crops.js';
import farmRoutes from './farms.js';
import plantingRoutes from './plantings.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/crops', cropRoutes);
router.use('/farms', farmRoutes);
router.use('/plantings', plantingRoutes);

export default router;
