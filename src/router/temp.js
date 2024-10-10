const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // ต้องติดตั้ง npm install csv-parser
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));

// ตั้งค่า baseDirectory ให้ชี้ไปที่โฟลเดอร์ที่ถูกต้อง
const baseDirectory = path.join('C:', 'Users', 's6604', 'Oopweb', 'Data'); 
console.log('Base Directory:', baseDirectory);

// ฟังก์ชันสำหรับอ่านไฟล์ CSV
const readCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// ฟังก์ชันสำหรับอ่านไฟล์ DICOM
const readDcmFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, fileContent) => {
      if (err) return reject(err);
      const base64Content = fileContent.toString('base64'); // แปลงเป็น Base64
      resolve({ image: `data:image/jpeg;base64,${base64Content}` }); // ส่งคืนข้อมูลภาพ
    });
  });
};

// Route สำหรับอ่านไฟล์ CSV และ DICOM
app.get('/read-file', async (req, res) => {
  const { path: relativePath } = req.query; // รับเส้นทางไฟล์จาก query parameter
  const ext = relativePath ? relativePath.split('.').pop() : '';

  try {
    let content;
    const fullPath = path.join(baseDirectory, relativePath); // ใช้ baseDirectory

    // ตรวจสอบว่า fullPath มีเส้นทางที่ถูกต้องหรือไม่
    console.log('Attempting to read file at:', fullPath); // แสดงเส้นทางที่พยายามอ่าน

    if (ext === 'csv') {
      content = await readCsvFile(fullPath);
    } else if (ext === 'dcm') {
      content = await readDcmFile(fullPath);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error reading file' });
  }
});


// Route สำหรับสร้างไฟล์ต้นไม้ (tree structure)
app.get('/', (req, res) => {
  const createFileTree = (directory) => {
    const files = fs.readdirSync(directory);
    const fileTree = {};

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fileTree[file] = createFileTree(filePath);
      } else {
        if (!fileTree.files) {
          fileTree.files = [];
        }
        fileTree.files.push(file);
      }
    });

    return fileTree;
  };

  const fileTree = createFileTree(baseDirectory);
  res.json(fileTree);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});