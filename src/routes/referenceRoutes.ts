import express from "express";
import { ReferenceController } from "../controllers/referenceController.js";
import { DataSource } from "typeorm";

const router = express.Router();
export const setupReferenceRoutes = (dataSource: DataSource) => {
    const controller = new ReferenceController(dataSource);
    
    router.post('/', controller.save.bind(controller));
    router.put('/', controller.save.bind(controller));
    router.get('/:id', controller.getRefById.bind(controller));
    router.get('/:customerId', controller.getReferences.bind(controller));
    router.get('/:customerId/customers', controller.getReferencesByCustomer.bind(controller));
    return router;
};