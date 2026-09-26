import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes/index.js"
import { errorHandler } from "./middleware/error.middleware.js";
import { redirect } from "./modules/url/url.controller.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


app.use("/api/v1", routes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "URL shortener API is healthy",
  });
});

app.get("/:shortCode", redirect);


app.use(errorHandler);

export default app;