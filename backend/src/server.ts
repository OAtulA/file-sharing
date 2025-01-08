import express, { Router } from "express";
import cors from "cors";
import path from "path";
import { multerErrorHandler, singleFileHandler } from "./utils/multer";

const app = express();
app.use(cors());
app.use(express.json());
// want to allow the expose frontend dist folder to be served
app.use(express.static(path.resolve(__dirname, "../../frontend/dist")));

app.get("/", (req, res) => {
  console.log("route hit /");
  res.sendFile(path.resolve(__dirname, "../../frontend/dist/index.html"));
});

const apiRouter = Router();

apiRouter.post(
  "/upload",
 
  singleFileHandler,
  (req, res, next) => {
    console.log(`req body is `, req.body);
    // Check if 'file' field exists in request
    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      res.status(400).json({
        error: "Invalid content type. Multipart/form-data required",
      });
      return;
    } else console.log("content type is multipart/form-data");
    console.log("req file is ", req.file);    
    console.log("Done")
    next(); 
  },
  (_req, res) => {
    res.status(200).send("File uploaded successfully");
    // File upload logic
  }
);

// the base api route
app.use("/api/v0", apiRouter);

// @ts-ignore
app.use(multerErrorHandler)

export default app;
