const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

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

app.post('/add-document', async (req, res) => {
  const { enrollmentNo, documentName, documentType } = req.body;

  try {
    await Document.create({ enrollmentNo, documentName, documentType });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/view-documents', async (req, res) => {
  const { enrollmentNo } = req.body;

  try {
    const documents = await Document.find({ enrollmentNo });
    res.render('index', { documents });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
