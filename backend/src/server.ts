import express, { Router } from "express";
import cors from "cors";
import path from "path";
import {
  clearTempFiles,
  multerErrorHandler,
  singleFileHandler,
} from "./utils/multer";
import { addFile, deleteFile, getAllFiles, getFile } from "./utils/sqlite";
import {
  deleteFromS3,
  getSignedDownloadURL,
  isDeleteSuccess,
  isUploadSuccess,
  uploadToS3,
} from "./utils/s3";

const app = express();
app.use(cors());
app.use(express.json());
// want to allow the expose frontend dist folder to be served

const frontendPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

const apiRouter = Router();

// Handling uploads
apiRouter.post(
  "/upload",

  singleFileHandler, // handle the file upload using multer
  (req, res, next) => {
    // basically checking if the file is uploaded
    /*
    console.log(`req body is `, req.body);
    // Check if 'file' field exists in request
    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      res.status(400).json({
        error: "Invalid content type. Multipart/form-data required",
      });
      return;
    } else console.log("content type is multipart/form-data");
    console.log("req file is ", req.file);
    console.log("Done");
    */
    next();
  },
  async (req, res) => {
    // upload the file to s3 and save the file to the sqlite db
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    // temproray commented
    const fileUploadToS3 = await uploadToS3(req.file?.path, req.file?.filename);
    if (!isUploadSuccess(fileUploadToS3)) {
      res.status(400).json({ error: "File upload failed to s3" });
      return;
    }

    // lets save to the sqlite db
    const fileID = await addFile(req.file.originalname, req.file.filename);
    if (!fileID) {
      res.status(400).json({ error: "File upload failed to sqlite" });
      return;
    }

    // Lets delete the local file in the server
    // console.log(`\n \n we need to delete this file `, req.file);
    const isFileDeleted = clearTempFiles(req.file.path);
    console.log("local file copy deleted successfully", isFileDeleted);

    // if (!isFileDeleted) {
    //   res.status(400).json({ error: "File upload failed to sqlite" });
    //   return;
    // }
    res.status(200).json({
      downloadUrl: `${process.env.VITE_DOMAIN_NAME||"http//localhost:4001"}/d/${fileID}`,
      message: "File uploaded successfully",
    });
,
    // FUTURE WORK ⚒️
    // Now we send the url through which the user can share the file.
    // On the spot we will have some api to turn this url into some QR code
  }
);

// This was just dummy to check if the download is working or not
apiRouter.get("/download/:location", (req, res) => {
  console.log("req.params.location is for the download  ", req.params.location);
  if (!req.params.location || req.params.location == "123") {
    res.sendFile(path.resolve(__dirname, "../uploads/dummy/harsheen.jpg"));
  } else if (req.params.location)
    res.sendFile(
      path.resolve(__dirname, `../../uploads/${req.params.location}`)
    );
});

// To see all the files that are uploaded
apiRouter.get("/dall", async (req, res) => {
  const files = await getAllFiles();
  res.status(200).json({ files });
});

apiRouter.get("/del/:id", async (req, res) => {
  const id = req.params.id;
  console.log("The delete id is ", id);
  const s3FilePath = (await getFile(id)).s3path;
  const deleteResponse = await deleteFromS3(s3FilePath);
  if (deleteResponse===false)
    res.status(400).json({ error: "File deletion failed, not found" });
  else if (isDeleteSuccess(deleteResponse)) {
    const isFileDeleted = await deleteFile(id);
    if (isFileDeleted === null) {
      console.log('The delete was successful in file db');
      res.status(200).json({ message: "File deleted successfully" });
    } else res.status(400).json({ error: "File deletion failed" });
  } else {
    res.status(400).json({ error: "File deletion failed" });
  }
});

// The actual implementation to send the filename and the url
// the frontend will make a request to 4001/api/v0/d/id and get the file name and the url
apiRouter.get("/d/:id", async (req, res) => {
  // make a request to 4001/api/v0/download/path and get the file name and the url

  const id = req.params.id;
  const file = await getFile(id);
  console.log("file info in the /d is ", file);

  const downloadUrl = await getSignedDownloadURL(file?.s3path, file.file_name);
  if (!downloadUrl) {
    res.status(400).json({ error: "File download failed" });
    return;
  }
  res.status(200).json({
    filename: file?.file_name,
    downloadUrl: downloadUrl,
  });
});

// the base api route
app.use("/api/v0", apiRouter);

// To handle all the remaining routes to send them to the frontend
app.get("*", (req, res) => {
  console.log("route hit", req.path);
  res.sendFile(path.resolve(frontendPath, "index.html"));
});

// @ts-ignore
app.use(multerErrorHandler);

export default app;
