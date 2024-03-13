const express = require('express');
const mongoose = require('mongoose');
const multer = require("multer");
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'uploads')); // Specify the destination folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://localhost/document_manager', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define Document schema
const documentSchema = new mongoose.Schema({
  enrollmentNo: String,
  documentName: String,
  documentType: String,
  filePath: String, // Add the filePath field
});


const Document = mongoose.model('Document', documentSchema);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  const documents = [];
  res.render('index', {
    documents
  });
});

app.get('/add-document', (req, res) => {
  res.render('addDocument');
});

app.post('/add-document', upload.single('documentFile'), async (req, res) => {
  const { enrollmentNo, documentName, documentType } = req.body;
  const documentFile = req.file;

  try {
    // Assuming 'uploads' is the folder where documents are stored
    const filePath = path.join('uploads', documentFile.filename);

    await Document.create({ enrollmentNo, documentName, documentType, filePath });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// app.post('/view-documents', async (req, res) => {
//   const { enrollmentNo } = req.body;

//   try {
//     const documents = await Document.find({ enrollmentNo });
//     res.render('index', { documents });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.post('/view-documents', async (req, res) => {
  const { enrollmentNo } = req.body;

  try {
    const documents = await Document.find({ enrollmentNo });
    res.render('viewDocuments', { documents });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/download/:documentId', async (req, res) => {
  const { documentId } = req.params;

  try {
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).send('Document not found');
    }

    // Set the file path based on your document storage location
    const filePath = document.filePath ? path.join(__dirname, 'public', document.filePath) : '';


    // Set the appropriate content type based on your document type
    const contentType = 'application/pdf'; // Adjust as needed

    // Send the file as a download
    res.download(filePath, `${document.documentName}.${document.documentType}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
