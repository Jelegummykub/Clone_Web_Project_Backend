const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');
const dicomParser = require('dicom-parser');
const app = express();
const port = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));

const baseDirectory = path.join('C:', 'Users', 's6604', 'Oopweb', 'Data');
console.log('Base Directory:', baseDirectory);


const getFileTree = (dir) => {
  const result = [];
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      result.push({
        name: file,
        type: 'folder',
        contents: getFileTree(filePath),
      });
    } else {
      result.push({
        name: file,
        type: 'file',
      });
    }
  });

  return result;
};

app.get('/list-files', (req, res) => {
  try {
    const fileTree = getFileTree(baseDirectory)
    res.json(fileTree)
  } catch (err) {
    console.error('Error reading directory:', err);
    res.status(500).send('Error reading directory');
  }
});

app.get('/read-dicom', (req, res) => {
  const fileName = req.query.file;
  const filePath = path.join(baseDirectory, fileName);

  fs.readFile(filePath, (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          return res.status(500).send('Error reading file');
      }
      res.set('Content-Type', 'application/dicom');
      res.send(data);
  });
});

app.get('/read-csv', (req, res) => {
  const fileName = decodeURIComponent(req.query.file);
  const fullPath = path.join(baseDirectory, fileName);
  console.log('Full Path:', fullPath);

  fs.readFile(fullPath, 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          return res.status(500).send('Error reading file');
      }
      res.send(data);
  });
});


app.get('/read-file' , (req , res) => {
  const fileName = req.query.file
  const filePath = path.join(baseDirectory , fileName)

  fs.readFile(filePath , 'utf-8' , (err , data) => {
    if(err){
      return res.status(500).send('Error reading file');
    }
    res.send(data)
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});