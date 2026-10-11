import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import cropRoutes from './crops.js';
import farmRoutes from './farms.js';
import plantingRoutes from './plantings.js';
import deviceRoutes from './devices.js';
import readingRoutes from './readings.js';
import alertRoutes from './alerts.js';
import weatherRoutes from './weather.js';
import listingRoutes from './listings.js';
import inquiryRoutes from './inquiries.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/crops', cropRoutes);
router.use('/farms', farmRoutes);
router.use('/plantings', plantingRoutes);
router.use('/devices', deviceRoutes);
router.use('/readings', readingRoutes);
router.use('/alerts', alertRoutes);
router.use('/weather', weatherRoutes);
router.use('/listings', listingRoutes);
router.use('/inquiries', inquiryRoutes);

export default router;
