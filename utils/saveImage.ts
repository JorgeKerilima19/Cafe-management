// utils/saveImage.ts
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Saves a base64-encoded image to the public/uploads folder
 * @param base64Data - Full base64 string (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
 * @returns Relative URL path (e.g., "/uploads/abc123.jpg")
 */
export async function saveBase64Image(base64Data: string): Promise<string> {
  // Validate input
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid base64 image data");
  }

  // Extract MIME type to determine extension
  let ext = "jpg"; // default
  if (base64Data.startsWith("data:image/png")) {
    ext = "png";
  } else if (
    base64Data.startsWith("data:image/jpeg") ||
    base64Data.startsWith("data:image/jpg")
  ) {
    ext = "jpg";
  } else if (base64Data.startsWith("data:image/webp")) {
    ext = "webp";
  }

  // Remove data URL prefix (everything before the comma)
  const base64 = base64Data.split(",")[1];
  if (!base64) {
    throw new Error("Invalid base64 format");
  }

  const buffer = Buffer.from(base64, "base64");
  const filename = `${uuidv4()}.${ext}`;
  const filepath = join(process.cwd(), "public", "uploads", filename);

  await writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}
