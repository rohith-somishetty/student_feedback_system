import multer from 'multer';

// Use memory storage so we can pipe the buffer to Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, GIF, and PDF files are allowed'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
