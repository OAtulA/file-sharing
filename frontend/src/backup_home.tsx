import { ChangeEvent, FormEvent, useState } from "react";

function FileSharingPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // checking for null files
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter(
      (file) => file.size <= 250 * 1024 * 1024
    );
    const invalidFiles = selectedFiles.filter(
      (file) => file.size > 250 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      setMessage("Some files exceed the 250MB limit and were not added.");
    } else {
      setMessage("");
    }

    setFiles([...files, ...validFiles]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) {
      setMessage("Please select valid files.");
      return;
    }
    // Handle file upload logic here
    const uploadFileReq = new Promise((resolve, reject) => {
      const formData = new FormData();
      // files.forEach((file) => {
        formData.append("file", files[0]);
      // });
      fetch("http://localhost:4001/api/v0/upload", {
        method: "POST",
        body: formData,
      }).then((response) => {
        if (!response.ok) {
          reject("Network response was not ok");
        }
        resolve(response);
      });
    });

    uploadFileReq.then((oj) => {
      console.log("response is ", oj);
      setMessage("Files uploaded successfully.");
      setFiles([]); // Clear the files after upload
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          File Sharing
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Upload files up to 250MB securely.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="fileInput"
              className="block text-gray-700 font-medium mb-2"
            >
              Select Files
            </label>
            <input
              type="file"
              id="fileInput"
              onChange={(v) => handleFileChange(v)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          {message && <p className="text-red-500 text-sm mb-4">{message}</p>}
          {files.length > 0 && (
            <ul className="text-sm text-gray-700 mb-4">
              {files.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          )}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}

export default FileSharingPage;
