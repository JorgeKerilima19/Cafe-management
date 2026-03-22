import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function saveBase64Image(base64Data: string): Promise<string> {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid base64 image data");
  }

  let ext = "jpg";
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

  const base64 = base64Data.split(",")[1];
  if (!base64) {
    throw new Error("Invalid base64 format");
  }

  const buffer = Buffer.from(base64, "base64");
  const filename = `${uuidv4()}.${ext}`;

  const uploadDir = join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}
