import { IngestedDocument, Citation } from "../types";
import { apiFetch } from "./api";

/**
 * File validation configuration and constants
 */
export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "txt",
  "md",
  "epub",
  "png",
  "jpg",
  "jpeg",
] as const;

export type AllowedExtension = typeof ALLOWED_FILE_EXTENSIONS[number];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/plain",
  "text/markdown",
  "application/epub+zip",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  requireNonEmpty?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  fileMeta?: {
    name: string;
    cleanTitle: string;
    extension: string;
    mimeType: string;
    sizeBytes: number;
    formattedSize: string;
    fileType: "pdf" | "docx" | "pptx" | "txt";
  };
}

export interface CloudinaryUploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  folder?: string;
  tags?: string[];
  onProgress?: (progressPercent: number) => void;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  originalFilename: string;
  createdAt: string;
  thumbnailUrl?: string;
}

export interface ChromaDBChunk {
  id: string;
  docId: string;
  docTitle: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  score?: number;
  metadata?: {
    pageOrSlide?: number;
    sectionTitle?: string;
    keywords?: string[];
    cloudinaryUrl?: string;
  };
}

export interface ChromaDBIndexPayload {
  title: string;
  textContent: string;
  fileType?: "pdf" | "docx" | "pptx" | "txt";
  fileSizeBytes?: number;
  cloudinaryUrl?: string;
  subject?: string;
  targetExam?: string;
  tags?: string[];
}

export interface ChromaDBIndexResult {
  success: boolean;
  document: IngestedDocument;
  chunkSample?: ChromaDBChunk[];
  totalChunks: number;
  message: string;
  cloudinaryUrl?: string;
}

export interface RAGPipelineOptions {
  customTitle?: string;
  subject?: string;
  targetExam?: string;
  useCloudinary?: boolean;
  cloudinaryOptions?: CloudinaryUploadOptions;
  onProgress?: (stage: "validating" | "uploading" | "extracting" | "indexing" | "completed", percent: number) => void;
}

/**
 * Format bytes to human readable format (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Clean and format filename into a human-readable topic title
 */
export function cleanFileNameToTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Map file extension to supported document types
 */
export function mapExtensionToDocType(extension: string): "pdf" | "docx" | "pptx" | "txt" {
  const ext = extension.toLowerCase().replace(".", "");
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  return "txt";
}

/**
 * 1. File Validation Engine
 * Validates extension, MIME type, file size, and non-empty integrity.
 */
export function validateFile(
  file: File | Blob,
  options: FileValidationOptions = {}
): ValidationResult {
  const maxSize = options.maxSizeBytes || MAX_FILE_SIZE_BYTES;
  const allowedExts = options.allowedExtensions || (ALLOWED_FILE_EXTENSIONS as unknown as string[]);
  const allowedTypes = options.allowedMimeTypes || ALLOWED_MIME_TYPES;

  if (!file) {
    return { isValid: false, error: "No file provided for upload." };
  }

  // Size Check
  if (file.size === 0) {
    return { isValid: false, error: "The selected file is empty (0 bytes)." };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of ${formatBytes(maxSize)}.`,
    };
  }

  // File Name & Extension Check
  const name = "name" in file && typeof file.name === "string" ? file.name : "uploaded_document.txt";
  const extensionMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";

  if (!extension || !allowedExts.includes(extension)) {
    return {
      isValid: false,
      error: `Invalid file format (.${extension || "unknown"}). Supported formats are: ${allowedExts.map((e) => `.${e}`).join(", ")}`,
    };
  }

  // MIME Type Check (if available)
  if (file.type && allowedTypes.length > 0) {
    const isMimeValid = allowedTypes.some((allowed) => {
      if (allowed.endsWith("/*")) {
        const prefix = allowed.replace("/*", "");
        return file.type.startsWith(prefix);
      }
      return file.type === allowed;
    });

    if (!isMimeValid && file.type !== "application/octet-stream") {
      // Soft warning rather than hard failure for OS mime quirks
      console.warn(`MIME type mismatch (${file.type}) for extension .${extension}. Proceeding with extension parser.`);
    }
  }

  const docType = mapExtensionToDocType(extension);
  const cleanTitle = cleanFileNameToTitle(name);

  return {
    isValid: true,
    fileMeta: {
      name,
      cleanTitle,
      extension,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      formattedSize: formatBytes(file.size),
      fileType: docType,
    },
  };
}

/**
 * 2. Text Extractor for Client-Side or Fallback Previews
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // For plain text / markdown
    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = (e) => reject(new Error("Failed to read text file."));
      reader.readAsText(file);
      return;
    }

    // For images: use server-side OCR
    if (file.type.startsWith("image/")) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", "eng");

      apiFetch("/api/ocr/scan", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.text) {
            resolve(`[OCR Extracted: ${file.name}]\n\n${data.text}`);
          } else {
            reject(new Error(data.error || "OCR failed"));
          }
        })
        .catch((err) => reject(new Error(`OCR request failed: ${err.message}`)));
      return;
    }

    // For PDF, DOCX, PPTX: use server-side extraction
    const supportedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.ms-powerpoint",
    ];
    const isSupportedBinary = supportedTypes.includes(file.type) ||
      file.name.endsWith(".pdf") || file.name.endsWith(".docx") ||
      file.name.endsWith(".doc") || file.name.endsWith(".pptx") || file.name.endsWith(".ppt");

    if (isSupportedBinary) {
      const formData = new FormData();
      formData.append("file", file);

      apiFetch("/api/rag/extract-text", {
        method: "POST",
        body: formData,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Extract failed with status ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.success && data.text && data.text.trim().length > 10) {
            resolve(data.text.trim());
          } else {
            reject(new Error(`Failed to extract text from ${file.name}: ${data.error || "Empty extraction"}`));
          }
        })
        .catch((err) => {
          reject(new Error(`Text extraction failed for ${file.name}: ${err.message}`));
        });
      return;
    }

    // Fallback for unknown types
    const title = cleanFileNameToTitle(file.name);
    resolve(`[Document: ${title}]\nFile: ${file.name}\nSize: ${formatBytes(file.size)}\nType: ${file.type}`);
  });
}

/**
 * 3. Cloudinary Document Storage Integration
 * Uploads raw document or asset to Cloudinary CDN for persistent document delivery.
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const envObj = typeof import.meta !== "undefined" ? (import.meta as any).env || {} : {};
  const cloudName = options.cloudName || envObj.VITE_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = options.uploadPreset || envObj.VITE_CLOUDINARY_UPLOAD_PRESET || "";

  // If Cloudinary credentials are configured, execute direct unsigned upload to Cloudinary API
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      if (options.folder) formData.append("folder", options.folder);
      if (options.tags) formData.append("tags", options.tags.join(","));

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return {
        publicId: data.public_id,
        secureUrl: data.secure_url,
        format: data.format || file.name.split(".").pop() || "pdf",
        bytes: data.bytes || file.size,
        originalFilename: data.original_filename || file.name,
        createdAt: data.created_at || new Date().toISOString(),
        thumbnailUrl: data.thumbnail_url || data.secure_url,
      };
    } catch (err) {
      console.warn("Direct Cloudinary upload failed, falling back to local asset reference:", err);
    }
  }

  // Graceful fallback: local object URL descriptor for preview
  const previewUrl = URL.createObjectURL(file);
  return {
    publicId: `local_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
    secureUrl: previewUrl,
    format: file.name.split(".").pop() || "pdf",
    bytes: file.size,
    originalFilename: file.name,
    createdAt: new Date().toISOString(),
    thumbnailUrl: previewUrl,
  };
}

/**
 * 4. FastAPI / Backend /upload & ChromaDB Vector Indexing Service
 */
export async function uploadToFastAPIEndpoint(
  formData: FormData,
  onProgress?: (progressPercent: number) => void
): Promise<any> {
  const endpoints = ["/api/rag/upload", "/api/upload"];
  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      if (onProgress) onProgress(45);
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        if (onProgress) onProgress(85);
        return await res.json();
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("Failed to connect to upload endpoint.");
}

/**
 * 5. Index Document in ChromaDB Vector Database
 */
export async function indexInChromaDB(
  payload: ChromaDBIndexPayload
): Promise<ChromaDBIndexResult> {
  const res = await apiFetch("/api/rag/upload", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      textContent: payload.textContent,
      fileType: payload.fileType || "pdf",
      fileSizeBytes: payload.fileSizeBytes || payload.textContent.length * 2,
      cloudinaryUrl: payload.cloudinaryUrl,
      subject: payload.subject,
      targetExam: payload.targetExam,
      tags: payload.tags,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Vector indexing failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    success: true,
    document: data.document,
    chunkSample: data.chunkSample,
    totalChunks: data.document?.totalChunks || 1,
    message: data.message || "Document successfully indexed!",
    cloudinaryUrl: payload.cloudinaryUrl,
  };
}

/**
 * 6. Query ChromaDB Vector Index
 */
export async function queryChromaDB(
  query: string,
  docId?: string,
  topK = 4
): Promise<{ chunks: ChromaDBChunk[]; citations: Citation[] }> {
  const res = await apiFetch("/api/rag/query", {
    method: "POST",
    body: JSON.stringify({
      query: query.trim(),
      docId: docId || undefined,
      topK,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to query vector store: ${res.statusText}`);
  }

  const data = await res.json();
  const chunks: ChromaDBChunk[] = data.chunks || [];

  const citations: Citation[] = chunks.map((c, i) => ({
    id: i + 1,
    docTitle: c.docTitle,
    sectionTitle: c.metadata?.sectionTitle || `Section ${c.chunkIndex + 1}`,
    relevance: c.score || 90,
    snippet: c.text.slice(0, 180) + "...",
  }));

  return { chunks, citations };
}

/**
 * 7. End-to-End Orchestrated RAG Upload Pipeline
 * Validates, uploads to Cloudinary (optional), extracts content, and stores vectors in ChromaDB.
 */
export async function processAndIndexDocument(
  fileOrText: File | { title: string; textContent: string; fileType?: "pdf" | "docx" | "pptx" | "txt" },
  options: RAGPipelineOptions = {}
): Promise<ChromaDBIndexResult> {
  const { onProgress } = options;

  if (onProgress) onProgress("validating", 10);

  // Case A: Handling a File Object
  if (fileOrText instanceof File) {
    const validation = validateFile(fileOrText);
    if (!validation.isValid) {
      throw new Error(validation.error || "File validation failed.");
    }

    const fileMeta = validation.fileMeta!;
    const title = options.customTitle || fileMeta.cleanTitle;

    let cloudinaryUrl: string | undefined;

    // Optional Cloudinary Upload
    if (options.useCloudinary !== false) {
      if (onProgress) onProgress("uploading", 30);
      try {
        const cloudResult = await uploadToCloudinary(fileOrText, options.cloudinaryOptions);
        cloudinaryUrl = cloudResult.secureUrl;
      } catch (err) {
        console.warn("Cloudinary upload skipped or errored:", err);
      }
    }

    if (onProgress) onProgress("extracting", 50);
    const textContent = await extractTextFromFile(fileOrText);

    if (onProgress) onProgress("indexing", 75);
    const indexResult = await indexInChromaDB({
      title,
      textContent,
      fileType: fileMeta.fileType,
      fileSizeBytes: fileMeta.sizeBytes,
      cloudinaryUrl,
      subject: options.subject,
      targetExam: options.targetExam,
    });

    if (onProgress) onProgress("completed", 100);
    return indexResult;
  }

  // Case B: Handling Raw Text / Syllabus Snippet
  if (!fileOrText.title?.trim()) {
    throw new Error("Document title cannot be empty.");
  }
  if (!fileOrText.textContent?.trim()) {
    throw new Error("Document text content cannot be empty.");
  }

  if (onProgress) onProgress("indexing", 60);
  const indexResult = await indexInChromaDB({
    title: options.customTitle || fileOrText.title.trim(),
    textContent: fileOrText.textContent.trim(),
    fileType: fileOrText.fileType || "txt",
    fileSizeBytes: fileOrText.textContent.length * 2,
    subject: options.subject,
    targetExam: options.targetExam,
  });

  if (onProgress) onProgress("completed", 100);
  return indexResult;
}

/**
 * 8. Delete document from ChromaDB and local store
 */
export async function deleteDocumentFromStore(docId: string): Promise<boolean> {
  const res = await apiFetch(`/api/rag/document/${docId}`, {
    method: "DELETE",
  });
  return res.ok;
}

const uploadService = {
  validateFile,
  extractTextFromFile,
  uploadToCloudinary,
  uploadToFastAPIEndpoint,
  indexInChromaDB,
  queryChromaDB,
  processAndIndexDocument,
  deleteDocumentFromStore,
  formatBytes,
  cleanFileNameToTitle,
  mapExtensionToDocType,
};

export default uploadService;
