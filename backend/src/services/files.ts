import path from "path";
import fs from "fs";
import crypto from "crypto";

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "pptx", "xlsx", "zip", "png", "jpg", "jpeg"]);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "..", "storage");

export class FileService {
  public static validateFile(fileName: string, sizeBytes?: number) {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      const err = new Error(`Unsupported file format '.${ext}'. Allowed formats: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`);
      (err as any).statusCode = 400;
      throw err;
    }
    if (sizeBytes !== undefined && sizeBytes > MAX_FILE_SIZE_BYTES) {
      const err = new Error(`File exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
      (err as any).statusCode = 400;
      throw err;
    }
    return ext;
  }

  public static async saveFile(file: Express.Multer.File, subfolder: string): Promise<{ relativeKey: string; sizeBytes: number; isClean: boolean }> {
    this.validateFile(file.originalname, file.size);

    const targetDir = path.join(STORAGE_DIR, subfolder);
    fs.mkdirSync(targetDir, { recursive: true });

    // Compute original name MD5 prefix
    const fileHash = crypto.createHash("md5").update(file.originalname).digest("hex").slice(0, 6);
    const uniqueName = `${fileHash}_${file.originalname}`;
    const filePath = path.join(targetDir, uniqueName);

    // Save file buffer
    fs.writeFileSync(filePath, file.buffer);

    // Check hash for virus scanning simulation
    const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const isClean = !sha256.includes("badhash");

    const relativeKey = path.join(subfolder, uniqueName).replace(/\\/g, "/");

    return {
      relativeKey,
      sizeBytes: file.size,
      isClean
    };
  }

  public static getFilePath(fileKey: string): string {
    const sanitizedKey = fileKey.replace(/\.\./g, "");
    return path.join(STORAGE_DIR, sanitizedKey);
  }
}
