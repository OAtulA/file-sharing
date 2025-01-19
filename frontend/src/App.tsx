import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import "./App.css";

interface iDataUploadRes {
  downloadUrl: string;
  message: string;
}

const domain = import.meta.env.VITE_DOMAIN_NAME

function FileSharingPage() {
  useEffect(() => {
    console.log("trying fetch on ", domain);
  }, []);
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState({ data: "", clr: "" });
  const [downloadUrl, setDownloadUrl] = useState("");
  const [uploading, setUploading] = useState(false);

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
      setMessage({ data: "No file selected", clr: "red" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    
    fetch(
      `${domain || "http://localhost:4001"}/api/v0/upload`,
      {
        method: "POST",
        body: formData,
      }
    )
      .then((response) => {
        if (!response.ok) {
          // Log detailed error
          return response.text().then((text) => {
            throw new Error(text);
          });
        }
        return response.json();
      })
      .then((data: iDataUploadRes) => {
        const usefulData = {
          downloadUrl: data.downloadUrl,
          message: data.message,
        };
        setDownloadUrl(usefulData.downloadUrl);
        console.log("Upload successful", usefulData);
        setMessage({ data: "File uploaded successfully", clr: "green" });
        setFile(undefined);
      })
      .catch((error) => {
        console.error("Upload error:", error);
        setMessage({ data: `Upload failed: ${error.message}`, clr: "red" });
      })
      .finally(() => {
        setUploading(false);
      });
  };

  return (
    <div>
      <div className=" h-[50vh] bg-gray-100 flex items-center justify-center p-4">
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
            {message.data && (
              <p className={`text-${message.clr}-500 text-sm mb-4`}>
                {message.data}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
            >
              Upload
            </button>
          </form>
        </div>

        {/* div to make a copyable text for the download url when downloadUrl is not empty */}
        {downloadUrl && <CopyableDiv displayText={downloadUrl} />}
      </div>
      {uploading && (
        <div className=" py-4 flex justify-center">
          <div className="relative bg-slate-300 rounded-3xl p-6">
            <LoadingCircle />
            <div className="left-[20%] top-[40%] font-extrabold text-3xl text-white absolute">
              upLoading{" "}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileSharingPage;

const CopyableDiv = ({ displayText }: { displayText: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(displayText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        width: "300px",
        marginLeft: "20px",
      }}
    >
      <div style={{ marginBottom: "10px", fontSize: "16px", color: "#333" }}>
        {displayText}
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: "8px 12px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

const LoadingCircle = () => {
  return <div className="loader h-52 w-52"></div>;
};
