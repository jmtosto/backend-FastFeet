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
import CompletedDeliveryController from './app/controllers/CompletedDeliveryController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

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

routes.put(
  '/delivery/:deliveryId/finish-delivery',
  CompletedDeliveryController.update
);

routes.get('/delivery/with-problem', DeliveryProblemController.index);
routes.get('/delivery/:deliveryId/problems', DeliveryProblemController.show);
routes.post('/delivery/:deliveryId/problems', DeliveryProblemController.store);
routes.delete(
  '/problem/:problemId/cancel-delivery',
  DeliveryProblemController.delete
);

export default routes;
