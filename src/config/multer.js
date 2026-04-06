import multer from "multer";
import path from "path";
import fs from "fs";

const uploadBasePath = "src/data/uploads";

if (!fs.existsSync(uploadBasePath)) {
  fs.mkdirSync(uploadBasePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadBasePath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const uniqueName = `${Date.now()}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;