const Menu = require("../models/Menu");

// Get all menu items
exports.getMenus = async (req, res) => {
    try {
        const menus = await Menu.find().sort({ createdAt: -1 });
        res.json(menus);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Add menu item
exports.createMenu = async (req, res) => {
    try {
        console.log("Create Menu Request Body:", req.body);
        console.log("Create Menu Request File:", req.file);

        const { name, description, price, category, variants, available } = req.body;
        let image = req.body.image;

        if (req.file) {
            image = req.file.location; // S3 URL
        }

        if (!name || !category) {
            return res.status(400).json({ message: "Please provide name and category" });
        }

        // Validation: Either price OR variants must be present
        // Note: When sending FormData, variants might be a JSON string, so parsing might be needed if it's sent as string
        let parsedVariants = variants;
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            } catch (e) {
                parsedVariants = [];
            }
        }

        if (!price && (!parsedVariants || parsedVariants.length === 0)) {
            return res.status(400).json({ message: "Please provide either a base price or variants" });
        }

        const menu = await Menu.create({
            name,
            description,
            price: price || 0,
            variants: parsedVariants || [],
            category,
            image,
            available
        });

        res.status(201).json(menu);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update menu item
// Update menu item
exports.updateMenu = async (req, res) => {
    try {
        console.log("Update Menu Request Body:", req.body);
        console.log("Update Menu Request File:", req.file);

        const menu = await Menu.findById(req.params.id);

        if (!menu) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        const updateData = { ...req.body };

        if (req.file) {
            updateData.image = req.file.location;
        }

        // Parse variants if they are sent as string (Multipart/form-data)
        if (typeof updateData.variants === 'string') {
            try {
                updateData.variants = JSON.parse(updateData.variants);
            } catch (e) {
                // Keep existing variants if parsing fails or handle error
                delete updateData.variants;
            }
        }

        const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json(updatedMenu);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete menu
exports.deleteMenu = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        await Menu.findByIdAndDelete(req.params.id);
        res.json({ message: "Menu deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
