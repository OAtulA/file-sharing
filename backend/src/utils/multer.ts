import multer from "multer";
import fs, { realpathSync, unlink } from "fs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

const uploadDir = "./uploads/temp/";

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      callback(null, uploadDir);
    } catch (err) {
      console.log(`The error ocurred in multer upload is ${err}`);
    }
  },
  filename(_req, file, callback) {
    let s3name = crypto
      .randomBytes(Math.floor(Math.random() * (10 - 5 + 1)) + 5)
      .toString("hex");

    // Adding the file extension
    s3name += file.originalname.substring(file.originalname.lastIndexOf("."));
    console.log(`file name is `, s3name)
    callback(null, s3name);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 270000000, //250 mB
  },
});

export const singleFileHandler = upload.single("file");

// to delete the files after s3 upload
export const clearTempFiles = (filePath: string) => {
  console.log("filePath is in clearTempFiles ", filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    // console.log(`${filePath} has been deleted`);
    return true;
  } else {
    // console.log(`${filePath} does not exist`);
    return false;
  }
};

// @ts-ignore
const removeTempFiles = (req, res, next) => {
  try {
    const galleryImages = req.files?.galleryImages;
    const file = req.files?.file;
    if (file) {
      try {
        fs.unlinkSync(file[0].path);
      } catch (error: any) {
        console.log("error in removing file", error.message);
      }
    }

    if (galleryImages) {
      for (const image of galleryImages) {
        try {
          fs.unlinkSync(image.path);
        } catch (error: any) {
          console.log("error in removing gallery image", error.message);
        }
      }
    }
    console.log("\n", "temp files removed :)", "\n");
  } catch (error) {
    console.log("\nerror in removeTempFiles\n", error);
  }
};

import { MulterError } from "multer";

// Error handler for Multer
// @ts-ignore
export const multerErrorHandler = (err, req, res, next) => {
  // Clean up temporary files
  console.error("\n Error in multerErrorHandler \n");
  removeTempFiles(req, res, next); // Assuming req.file contains the uploaded file information

  if (err instanceof MulterError) {
    // Handle Multer-specific errors
    console.error("Multer Error:", err); // Log the error for debugging
    switch (err.code) {
      case "LIMIT_UNEXPECTED_FILE":
        return res
          .status(400)
          .json({ error: "Unexpected field", errorCode: err.code });
      case "LIMIT_FILE_SIZE":
        return res
          .status(400)
          .json({ error: "File size limit exceeded", errorCode: err.code });
      case "LIMIT_FILE_COUNT":
        return res
          .status(400)
          .json({ error: "Too many files", errorCode: err.code });
      default:
        return res
          .status(500)
          .json({ error: "Multer error", errorCode: err.code });
    }
  } else if (err) {
    // Handle other types of errors
    console.error("General Error:", err); // Log the error for debugging
    return res.status(500).json({ error: "Failed to upload image" });
  }

  next(); // Call next() only if no errors occurred
};
