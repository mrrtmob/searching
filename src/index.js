const express = require('express')
const { Client } = require('@elastic/elasticsearch')
const { server } = require('./routes/route')
const app = express()
const port = 3000
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { scrap } = require('./utils/html')

// Set up multer for handling multipart/form-data
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/api/convert', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No files were uploaded.');
    }

    // Convert the uploaded file to HTML using LibreOffice
    const filePath = req.file.path;
    let outputFilePath = `${path.join(__dirname, '..', 'uploads')}`;
    console.log(outputFilePath)
    // Execute a command to convert the file to HTML using LibreOffice
    const libreOfficeCommand = `libreoffice --headless --convert-to html ${filePath} --outdir ${outputFilePath}`;
    exec(libreOfficeCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error converting file to HTML: ${error.message}`);
            return res.status(500).send('Error converting file to HTML.');
        }
        if (stderr) {
            console.error(`Error converting file to HTML: ${stderr}`);
            return res.status(500).send('Error converting file to HTML.');
        }

        // Read the converted HTML file from the parent directory

        await fs.readFile(path.join(__dirname, '..', req.file.path.replace('.docx', '.html')), 'utf-8', (err, data) => {
            if (err) {
                console.error(`Error reading HTML file: ${err.message}`);
                return res.status(500).send('Error reading HTML file.');
            }

            // Send the converted HTML content as response
            const htmlData = scrap(data)
            res.send(htmlData);

            // // Optionally, delete the temporary files
            // fs.unlinkSync(filePath);
            // fs.unlinkSync(outputFilePath);
        });
    });
});
// Connect to your Elasticsearch instance
const client = new Client({ node: 'http://localhost:9200' })

// Middleware to set the Access-Control-Allow-Origin header
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Set other CORS headers if needed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
// Middleware to parse JSON requests
app.use(express.json())

// Define a function to check and create index with mappings
async function ensureIndexExists(indexName) {
    const indexExists = await client.indices.exists({ index: indexName })
    if (!indexExists.body) {
        await client.indices.create({
            index: indexName,
            body: {
                mappings: {
                    properties: {
                        vector: {
                            type: "dense_vector",
                            dims: 1536
                        },
                        id: {
                            type: "integer"
                        },
                        name: {
                            type: "text"
                        },
                        text: {
                            type: "text"
                        }
                    }
                }
            }
        })
        console.log(`Index ${indexName} created with mappings.`)
    } else {
        console.log(`Index ${indexName} already exists.`)
    }
}

// Example usage
ensureIndexExists('test_vector').catch(console.error)



server(app)

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})
