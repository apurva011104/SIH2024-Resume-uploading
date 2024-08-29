const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const docxParser = require('docx-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir }); // Directory to save uploaded files

// Serve the HTML form at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ForPublic', 'index.html'));
});

app.post('/upload-resume', upload.single('resume'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(uploadDir, file.filename);
    let extractedText = '';

    try {
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            extractedText = data.text;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await new Promise((resolve, reject) => {
                docxParser.parseDocx(filePath, (data) => {
                    resolve(data);
                });
            });
        }

        console.log(extractedText);

        fs.unlinkSync(filePath);

        res.send("Resume processed successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing the resume.");
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
