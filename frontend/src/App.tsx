import { ChangeEvent, FormEvent, useState } from "react";

function FileSharingPage() {
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFile(files[0]);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate file exists
    if (!file) {
      setMessage("No file selected");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
  
    fetch("http://localhost:4001/api/v0/upload", {
      method: "POST",
      body: formData,
    })
    .then((response) => {
      if (!response.ok) {
        // Log detailed error
        return response.text().then(text => {
          throw new Error(text);
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("Upload successful", data);
      setMessage("File uploaded successfully");
      setFile(undefined);
    })
    .catch((error) => {
      console.error("Upload error:", error);
      setMessage(`Upload failed: ${error.message}`);
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
