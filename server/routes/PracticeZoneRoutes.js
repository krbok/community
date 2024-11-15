import { Router } from 'express';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import {
    initializePortfolio,
    getPortfolio,
    buyStock,
    sellStock
} from '../controllers/PracticeZoneController.js';

const practiceZoneRoutes = Router();

practiceZoneRoutes.get('/initialize', verifyToken, initializePortfolio);


practiceZoneRoutes.get('/portfolio', verifyToken, getPortfolio);


practiceZoneRoutes.post('/buy', verifyToken, buyStock);


practiceZoneRoutes.post('/sell', verifyToken, sellStock);

export default practiceZoneRoutes;