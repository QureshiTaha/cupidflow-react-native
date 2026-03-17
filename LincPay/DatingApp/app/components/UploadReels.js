import axios from "axios";

export default async function UploadReels(userID, video, title, description) {
  try {
    const formData = new FormData();
    formData.append("userID", userID);
    formData.append("file", {
      uri: video.uri,
      type: video.type || "video/mp4",
      name: video.name || "upload.mp4",
    });

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/uploads/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    if (response?.status === 200) {
      const data = {
        filePath: response.data.filePath,
        userID,
        title: title ?? "Untitled",
        description: description ?? "No Description",
      };

      return await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels`,
        data,
        { headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error(
      "Error uploading reel:",
      error.response ? error.response.data : error.message
    );
  }
}
