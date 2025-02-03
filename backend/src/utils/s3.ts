// This is for the s3 bucket
/**
 * I am just having the utility to upload the files with a deadline
 * I will just read and write the files to the s3 bucket
 *
 * I am going to write, read and delete the files from the s3 bucket.
 * I will delete the files after a certain size limit is hit.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  PutObjectCommandOutput,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "node:fs";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import { Upload } from "@aws-sdk/lib-storage";

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10_000, // 10 seconds
  }),
});

// Upload File
/**
 *
 * @param filepath - path of File to be uploaded
 * @param key - The file path in the s3 bucket
 * @returns response
 *
 * I may check if the response is success or not using the isUploadSuccess function
 */
// async function uploadToS3(filepath: string, key: string) {
//   const file = createReadStream(filepath);
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME || "",
//     Key: key,
//     Body: file,
//   };

//   try {
//     const command = new PutObjectCommand(params);
//     const response = await s3Client.send(command);
//     return response;
//   } catch (error) {
//     console.error("S3 Upload Error:", error);
//     throw error;
//   }
// }
async function uploadToS3(filepath: string, key: string) {
  const file = createReadStream(filepath);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME || "",
    Key: key,
    Body: file,
  };

  try {
    const upload = new Upload({
      client: s3Client,
      params,

      // Optional configurations
      queueSize: 4, // Number of concurrent parts to upload
      partSize: 5 * 1024 * 1024, // 5MB part size
      leavePartsOnError: false, // Automatically clean up failed parts
    });

    // Optional: Track upload progress
    upload.on("httpUploadProgress", (progress) => {
      console.log(`Upload progress: ${progress.loaded} / ${progress.total}`);
    });

    // Perform the upload
    const result = await upload.done();
    return result;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
}

const isUploadSuccess = (response: PutObjectCommandOutput): boolean => {
  if (
    response.$metadata.httpStatusCode === 200 ||
    response.$metadata.httpStatusCode === 204
  ) {
    return true;
  } else {
    return false;
  }
};

import { HeadObjectCommand } from "@aws-sdk/client-s3";

export async function doesObjectExist(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    );
    console.log(`Object exists for key: ${key}`);
    return true;
  } catch (error: any) {
    console.error(`Error checking object existence for key: ${key}`, error);
    return false;
  }
}

/**
 * Delete File
 *
 * @param key The actual file path in the s3 bucket
 * @returns response
 */
async function deleteFromS3(key: string) {
  const objectExists = await doesObjectExist(key);
  if (!objectExists) {
    console.log("Object does not exist in S3");
    return false;
  }
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME || "",
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    const response = await s3Client.send(command);
    console.log("S3 Delete Response:", response);
    return response;
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw error;
  }
}

const isDeleteSuccess = (response: DeleteObjectCommandOutput): boolean => {
  if (
    response.$metadata.httpStatusCode === 200 ||
    response.$metadata.httpStatusCode === 204
  ) {
    return true;
  } else {
    return false;
  }
};

/**
 *
 * @param key | string, the actual file path in the s3 bucket
 * @returns signedUrl | string, The signed url to download the file
 */
const getSignedDownloadURL = async (
  key: string,
  filename?: string
): Promise<string> => {
  // const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`;
  filename = filename === undefined ? "dummy.jpg" : filename;
  const signedUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key, // Key from your database
      ResponseContentDisposition: `attachment; filename="${filename}"`, // Specify the desired filename
    }),
    { expiresIn: 3600 } // URL expires in 1 hour
  );

  return signedUrl;
};

export {
  uploadToS3,
  deleteFromS3,
  isDeleteSuccess,
  isUploadSuccess,
  getSignedDownloadURL,
};
