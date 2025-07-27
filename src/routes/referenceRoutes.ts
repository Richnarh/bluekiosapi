import express from "express";
import { ReferenceController } from "@/controllers/referenceController";

const router = express.Router();
const controller = new ReferenceController();

router.get('/:customerId', controller.getReferences.bind(controller));
export default router;