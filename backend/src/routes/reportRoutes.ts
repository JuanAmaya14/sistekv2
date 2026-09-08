import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/',         reportController.getReport);
router.get('/download', adminOnly, reportController.downloadReport);

export default router;
