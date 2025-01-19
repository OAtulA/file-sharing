import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface iData {
  filename: string;
  downloadUrl: string;
}

const domain = import.meta.env.VITE_DOMAIN_NAME

function DownloadPage() {
  const { path } = useParams();
  const [fileName, setFileName] = useState(""),
    [downloadURL, setDownloadUrl] = useState("");

    console.log("fetch is on the download page", domain)

  const dummyDownloadHandler = () => {
    // make a request to 4001/api/v0/download/path and get the file name and the url
    fetch(`${domain||"http://localhost:4001"}/api/v0/download/${path}`, { method: "GET" })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `harsheen.jpg`;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
      });
  };
  useEffect(() => {
    console.log("Some requests need to be made.");

    // make a download request to 4001/api/v0/d/path and get the file name and the url
    fetch(`${domain||"http://localhost:4001"}/api/v0/d/${path}`, { method: "GET" })
      .then((response) => {
        console.log("response is", response);
        return response.json();
      })
      .then((data: iData) => {
        console.log("data is ", data);
        setFileName(data.filename);
        setDownloadUrl(data.downloadUrl);
      });
  }, [path]);
  // we will have a context here to fetch the url and the file name and set
  // it to the a tag before the button to download
  return (
    <div>
      <h1 className="block text-center text-2xl text-orange-400 bg-slate-200 py-6">
        Download Page
      </h1>
      <div className="ps-[30%]">
        now the path is{" "}
        <div className="text-blue-500 font-bold inline"> {path}</div>
      </div>

      <div className="mt-4 w-full ">
        <div className="text-blue-300 w-fit ms-[30%] ">
          {" "}
          Download File: {fileName}
        </div>
        <div className="bg-purple-400 w-fit mx-auto">
          <a href={downloadURL} download={fileName}>
            <button className="bg-green-500 text-white p-2  "> Download</button>
          </a>
        </div>
      </div>

      <button
        className="w-fit p-2 bg-green-300 text-white mx-auto"
        onClick={dummyDownloadHandler}
      >
        Dummy Download check
      </button>
    </div>
  );
}

export default DownloadPage;
