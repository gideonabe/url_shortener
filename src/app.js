import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes/index.js"
import { errorHandler } from "./middleware/error.middleware.js";
import { redirect } from "./modules/url/url.controller.js";
import prisma from "./config/prisma.js";

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

app.get("/db-test", async (req, res, next) => {
  try {
    const start = performance.now();

    const url = await prisma.url.findUnique({
      where: {
        shortCode: "kcsnmUs",
      },
      select: {
        id: true,
        longUrl: true,
        expiresAt: true,
      },
    });

    const dbDuration = performance.now() - start;

    res.json({
      dbDuration: `${dbDuration.toFixed(2)}ms`,
      found: !!url,
    });
  } catch (error) {
    next(error);
  }
});


app.get("/:shortCode", redirect);


app.use(errorHandler);

export default app;