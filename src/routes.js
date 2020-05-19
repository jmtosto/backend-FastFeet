import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import FileController from './app/controllers/FileController';
import DeliveryController from './app/controllers/DeliveryController';
import ScheduleController from './app/controllers/ScheduleController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// Auth
routes.use(authMiddleware);

routes.put('/users', UserController.update);
routes.post('/recipients', RecipientController.store);

routes.post('/files', upload.single('file'), FileController.store);

routes.get('/deliverymans', DeliverymanController.index);
routes.post('/deliverymans', DeliverymanController.store);
routes.put('/deliverymans/:id', DeliverymanController.update);
routes.delete('/deliverymans/:id', DeliverymanController.delete);

routes.get('/deliveries', DeliveryController.index);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:deliveryId', DeliveryController.update);
routes.delete('/deliveries/:deliveryId', DeliveryController.delete);

routes.get('/deliveryman/:deliverymanId/deliveries', ScheduleController.index);
routes.put('/delivery/:deliveryId/start-delivery', ScheduleController.update);

export default routes;
