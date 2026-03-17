import axios from "axios";
export default async function UploadReels(userID, video, title, description) {
  try {
    const formData = new FormData();
    formData.append("userID", userID);
    formData.append("file", {
      uri: video.uri,
      type: video.type || "video/mp4", // fallback if missing
      name: video.name || "upload.mp4", // fallback if missing
    });

    const response = await axios
      .post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/uploads/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .catch((error) => {
        if (error.response) {
          console.log("Server responded with:", error.response.data);
        } else if (error.request) {
          console.log(
            "Request was made but no response received:",
            error.request
          );
        } else {
          console.log(
            "Something happened in setting up the request:",
            error.message
          );
        }
      });

    if (response?.status === 200) {
      // Add to reels
      let data = JSON.stringify({
        filePath: response.data.filePath,
        userID: userID,
        title: title ?? "Untitled",
        description: description ?? "No Description ",
      });

      await axios
        .request({
          method: "POST",
          maxBodyLength: Infinity,
          url: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels`,
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        })
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          return error;
        });
    }
  } catch (error) {
    console.error(
      "Error uploading reel:",
      error.response ? error.response.data : error.message
    );
  }
};
