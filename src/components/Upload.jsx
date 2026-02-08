import { useState } from "react";

const Upload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fileUrl, setFileUrl] = useState("");

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const allowedFormats = ["jpg", "jpeg", "png", "gif", "pdf", "mp4", "mp3"];
    const maxSizeMB = 10;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setErrorMessage("");
        setSuccessMessage("");
        setFileUrl("");
        setFile(null);

        if (!selectedFile) return;

        if (!cloudName || !uploadPreset) {
            setErrorMessage("Missing .env config for Cloudinary");
            return;
        }

        const ext = selectedFile.name.split(".").pop().toLowerCase();
        if (!allowedFormats.includes(ext)) {
            setErrorMessage(`Invalid format. Allowed: ${allowedFormats.join(", ")}`);
            return;
        }

        if (selectedFile.size / 1024 / 1024 > maxSizeMB) {
            setErrorMessage(`File too large (Max ${maxSizeMB}MB)`);
            return;
        }

        setFile(selectedFile);
    };

    const uploadFile = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setErrorMessage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                setFileUrl(data.secure_url);
                setSuccessMessage("Upload complete!");
                onUploadSuccess(data.secure_url); // Callback to parent
                setFile(null);
            } else {
                setErrorMessage(data.error?.message || "Upload failed");
            }
        } catch (err) {
            setErrorMessage("Network Error");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="controls">
                <input type="file" onChange={handleFileChange} className="file-input" />
                <button
                    onClick={uploadFile}
                    disabled={!file || uploading}
                    className="action-btn"
                >
                    {uploading ? "Uploading..." : "⬆ Upload Media"}
                </button>
            </div>
            {errorMessage && <div className="msg error">{errorMessage}</div>}
            {successMessage && <div className="msg success">{successMessage}</div>}
            {fileUrl && (
                <div className="preview-link">
                    File ready: <a href={fileUrl} target="_blank" rel="noreferrer">View</a>
                </div>
            )}
        </div>
    );
};

export default Upload;