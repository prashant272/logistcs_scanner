const express = require("express");
const router = express.Router();
const { getMenus, createMenu, updateMenu, deleteMenu } = require("../controllers/menuController");
const protect = require("../middleware/authMiddleware");

const { upload } = require("../services/uploadService");

// Public routes
router.get("/", getMenus);

const uploadWithLogging = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error("Upload Error:", err);
            return res.status(400).json({ message: "Image upload failed", error: err.message });
        }
        next();
    });
};

// Protected routes (Admin only)
router.post("/", protect, uploadWithLogging, createMenu);
router.put("/:id", protect, uploadWithLogging, updateMenu);
router.delete("/:id", protect, deleteMenu);

module.exports = router;
