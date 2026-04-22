import multer from "multer";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = {
	"image/jpeg": "image",
	"image/png": "image",
	"image/gif": "image",
	"image/webp": "image",
	"video/mp4": "video",
	"video/webm": "video",
	"audio/mpeg": "audio",
	"audio/wav": "audio",
	"audio/ogg": "audio",
	"audio/webm": "audio",
	"audio/mp4": "audio",
	"application/pdf": "document",
	"application/msword": "document",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
	"application/vnd.ms-excel": "document",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
	"text/plain": "document",
	"application/zip": "document",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve("backend/uploads"));
	},
	filename: (req, file, cb) => {
		const uniqueId = crypto.randomBytes(8).toString("hex");
		const ext = path.extname(file.originalname);
		cb(null, `${uniqueId}-${Date.now()}${ext}`);
	},
});

const fileFilter = (req, file, cb) => {
	if (ALLOWED_TYPES[file.mimetype]) {
		cb(null, true);
	} else {
		cb(new Error(`File type ${file.mimetype} is not allowed`), false);
	}
};

export const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: MAX_SIZE },
});

export function getFileType(mimetype) {
	return ALLOWED_TYPES[mimetype] || "document";
}
