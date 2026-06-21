const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// Configure Cloudflare R2 Client (S3 Compatible API)
const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

// Configure Multer Storage for R2
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.R2_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, `yo-yo-biryani/${file.fieldname}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetypes = /image\/jpeg|image\/png|image\/webp/;

        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images Only (jpeg, jpg, png, webp)!'));
        }
    }
});

const uploadDoc = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.R2_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, `documents/${file.fieldname}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for docs
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp|pdf|doc|docx|txt|xls|xlsx/;
        const mimetypes = /image\/jpeg|image\/png|image\/webp|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|text\/plain|application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/;

        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Allowed formats: jpeg, jpg, png, webp, pdf, doc, docx, txt, xls, xlsx!'));
        }
    }
});

module.exports = { upload, uploadDoc };
