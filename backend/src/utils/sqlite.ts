import { randomBytes } from "node:crypto";

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(
  "./mydb.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err: any) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the database");
  }
);

// create table if not exists
const createTableIfNotExists = () => {
  db.exec(
    `
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      s3path TEXT NOT NULL
    )`,
    (err: any) => {
      if (err) {
        console.error("Error creating table:", err.message);
      } else {
        console.log("Files table created successfully");
      }
    }
  );
};

createTableIfNotExists();

/**
 * This works after the file is uploaded to s3
 * 
 * @param filename string : Pass original filename
 * @param s3path string : The s3 path on uploaded file
 * @returns id  string: Which can be used to share and download the file
 */
export const addFile = (filename: string, s3path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const length = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    const id = randomBytes(length).toString("hex").slice(0, 10);

    db.run(
      `INSERT INTO files (id, file_name, s3path) VALUES (?, ?, ?)`,
      [id, filename, s3path],
      (err: any) => {
        if (err) {
          console.error("Insert error:", err);
          reject(err);
        } else {
          resolve(id);
        }
      }
    );
  });
};

/**
 * It returns the file info with the id, filename and s3path
 * 
 * @param id string : The id of the file to be fetched
 * @returns - { id: string ,filename: string; s3path: string } 
 * 
 * Here filename is the original filename and s3path is the s3 path of the file
 */
export const getFile = (id: string): Promise<{ id: string, file_name: string; s3path: string }>  => {
  return new Promise((resolve, reject) => {
    console.log("Fetching file with ID:", id); // Log the ID being queried
    db.get(`SELECT id, file_name, s3path FROM files WHERE id = ?`, [id], (err: any, row: any) => {
      if (err) {
        console.error("Error fetching file:", err);
        reject(err);
      } else if (!row) {
        console.error("File not found for ID:", id); // Log the ID that was not found
        reject(new Error("File not found"));
      } else {
        console.log("File found:", row); // Log the row returned
        resolve(row);
      }
    });
  });
};
// export const getFile = (id: string): Promise<{ id: string ,file_name: string; s3path: string }> => {
//   return new Promise((resolve, reject) => {
//     db.get(`SELECT id, file_name, s3path FROM files WHERE id = ?`, [id], (err: any, row: any) => {
//       if (err) {
//         console.error("Error fetching file:", err);
//         reject(err);
//       } else if (!row) {
//         console.error("File not found");
//         reject(new Error("File not found"));
//       } else {
//         resolve(row);
//       }
//     });
//   });
// };

/**
 * To get all the files in the database only for testing purposes
 * @returns - array of objects with id, filename and s3path
 */
export const getAllFiles = (): Promise<{ id: string ,filename: string; s3path: string }[]> => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, file_name, s3path FROM files`, (err: any, rows: any[]) => {
      if (err) {
        console.error("Error fetching files:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 
 * @param id string : The id of the file to be deleted
 * @returns - err or null if deleted
 */
export const deleteFile = (id: string)  => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM files WHERE id = ?`, [id], (err: any) => {
      if (err) {
        console.error("Error deleting file:", err);
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
};

export default db