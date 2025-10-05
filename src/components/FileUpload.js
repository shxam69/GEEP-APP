import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function FileUpload({ userRef, storage }) {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    const fileRef = ref(storage, `uploads/${userRef.id}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    alert(`File uploaded! URL: ${url}`);
  };

  return (
    <div style={{ margin: "10px" }}>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default FileUpload;
