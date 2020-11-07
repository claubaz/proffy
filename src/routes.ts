import { Router } from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';

const routes = Router();

const classesController = new ClassesController();
const connectionsController = new ConnectionsController();

console.log("INIT ROUTES")
routes.post('/classes', classesController.create );
routes.get('/classes', classesController.index );
routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.index);

export default routes;