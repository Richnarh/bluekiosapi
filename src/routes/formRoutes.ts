import express from "express";
import { DataSource } from "typeorm";
import { FormController } from "../controllers/formController.js";

const router = express.Router();
export const setupFormsRoutes = (dataSource: DataSource) => {
    const controller = new FormController(dataSource);
    
    router.post('/', controller.save.bind(controller));
    router.put('/', controller.save.bind(controller));
    router.get('/:id', controller.findById.bind(controller));
    router.post('/user-form', controller.saveForm.bind(controller));
    router.get('/s/:id', controller.getUrl.bind(controller));
    return router;
};