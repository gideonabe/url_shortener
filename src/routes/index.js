import { Router } from "express";
import urlRoutes from "../modules/url/url.routes.js";

const router = Router();

router.use("/urls", urlRoutes);

export default router;