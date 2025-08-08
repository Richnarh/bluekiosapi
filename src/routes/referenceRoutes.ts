import express from "express";
import { ReferenceController } from "@/controllers/referenceController";

const router = express.Router();
const controller = new ReferenceController();

router.post('/', controller.createRef.bind(controller));
router.put('/', controller.createRef.bind(controller));
router.get('/:id', controller.getRefById.bind(controller));
router.get('/:userId/:customerId', controller.getReferences.bind(controller));
router.get('/customer/:customerId/refs', controller.getReferencesByCustomer.bind(controller));
export default router;