/**
 * Mock server for testing the Quick OCI Object Manager extension
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.text());

// Store mock bucket contents
let bucketContents = {
  objects: [
    { name: 'file1.txt', size: 100, timeModified: new Date().toISOString() },
    { name: 'file2.txt', size: 200, timeModified: new Date().toISOString() },
    { name: 'folder1/', size: 0, timeModified: new Date().toISOString() },
    { name: 'folder1/file3.txt', size: 300, timeModified: new Date().toISOString() },
    { name: 'FunnyFolder/', size: 0, timeModified: new Date().toISOString() },
    { name: 'FunnyFolder/joke.txt', size: 120, timeModified: new Date().toISOString() },
    { name: 'FunnyFolder/meme.jpg', size: 500, timeModified: new Date().toISOString() }
  ]
};

// Store deleted files index
let deletedFilesIndex = {
  deletedFiles: []
};

// Root endpoint
app.get('/', (req, res) => {
  res.send('Mock OCI Object Storage Server');
});

// Get bucket contents
app.get('/mock-bucket/', (req, res) => {
  const prefix = req.query.prefix || '';
  
  // Filter objects based on prefix
  const filteredObjects = bucketContents.objects.filter(obj => {
    return obj.name.startsWith(prefix);
  });
  
  res.json({
    objects: filteredObjects
  });
});

// Get logically-deleted-files.json
app.get('/mock-bucket/logically-deleted-files.json', (req, res) => {
  res.json(deletedFilesIndex);
});

// Update logically-deleted-files.json
app.put('/mock-bucket/logically-deleted-files.json', (req, res) => {
  try {
    deletedFilesIndex = req.body;
    console.log('Updated deleted files index:', deletedFilesIndex);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error updating deleted files index:', error);
    res.status(500).send('Error');
  }
});

// Upload a file
app.put('/mock-bucket/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Add the file to bucket contents if it doesn't exist
  const existingFile = bucketContents.objects.find(obj => obj.name === filename);
  if (!existingFile) {
    bucketContents.objects.push({
      name: filename,
      size: req.body.length || 0,
      timeModified: new Date().toISOString()
    });
  }
  
  console.log(`Uploaded file: ${filename}`);
  res.status(200).send('OK');
});

// Delete a file
app.delete('/mock-bucket/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Remove the file from bucket contents
  bucketContents.objects = bucketContents.objects.filter(obj => obj.name !== filename);
  
  console.log(`Deleted file: ${filename}`);
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
