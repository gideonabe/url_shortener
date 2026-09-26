import { Router } from "express";
import { create, redirect } from "./url.controller.js";
import { validate } from "../../middleware/validate.js";
import { createUrlSchema } from "./url.validation.js";

const router = Router();

router.post("/", validate(createUrlSchema), create);
// router.get("/:shortCode", redirect);

export default router;