require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Require all models
    const modelsPath = path.join(__dirname, 'models');
    fs.readdirSync(modelsPath).forEach(file => {
        if (file.endsWith('.js')) {
            require(path.join(modelsPath, file));
        }
    });

    const models = mongoose.models;
    let found = false;
    for (const modelName in models) {
        const Model = models[modelName];
        try {
            const docs = await Model.find({
                $or: [
                    { phone: { $regex: '9464225429' } },
                    { alternativeNumber: { $regex: '9464225429' } },
                    { whatsappNumber: { $regex: '9464225429' } },
                    { contactNumber: { $regex: '9464225429' } },
                    { mobile: { $regex: '9464225429' } }
                ]
            });
            if (docs.length > 0) {
                console.log(`Found in ${modelName}:`, docs);
                found = true;
            }
        } catch (e) {
            // ignore schema errors
        }
    }
    if (!found) {
        console.log("Not found in any standard phone fields in any model.");
    }
    process.exit(0);
});
