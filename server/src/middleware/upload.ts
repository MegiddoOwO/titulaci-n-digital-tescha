import multer from "multer";

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
});
