import express from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createListing);
router.get('/', getListings);
router.get('/:id', getListingById);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

export default router;
