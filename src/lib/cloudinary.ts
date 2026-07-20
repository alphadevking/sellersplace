import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(buffer: Buffer): Promise<string> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sellersplace/products",
        resource_type: "image",
        // Incoming transformation: Cloudinary resizes/compresses before storing,
        // so the stored asset itself stays small — not just the raw upload.
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
      },
      (error, uploadResult) => {
        if (error || !uploadResult) reject(error ?? new Error("Cloudinary upload failed"));
        else resolve(uploadResult);
      }
    );
    stream.end(buffer);
  });
  return result.secure_url;
}
