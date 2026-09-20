import { Router } from 'express';
import { ValuationController } from '../controllers/valuation.controller';

const router = Router();

router.post('/estimate', ValuationController.estimate);

export default router;
