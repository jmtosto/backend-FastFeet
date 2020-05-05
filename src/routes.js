import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// Auth
routes.use(authMiddleware);

routes.put('/users', UserController.update);
routes.post('/recipients', RecipientController.store);

routes.get('/deliverymans', DeliverymanController.index);
routes.post('/deliverymans', DeliverymanController.store);
routes.put('/deliverymans', DeliverymanController.update);
routes.delete('/deliverymans', DeliverymanController.delete);

export default routes;
