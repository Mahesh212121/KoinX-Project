const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Trade = require('./models/Trade');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

mongoose.connect('mongodb://localhost:27017/crypto-trades', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post('/upload', upload.single('KoinX Assignment CSV Sample.csv'), async (req, res) => {
  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      const [baseCoin, quoteCoin] = data.Market.split('/');
      results.push({
        utcTime: new Date(data.UTC_Time),
        operation: data.Operation.toLowerCase(),
        baseCoin,
        quoteCoin,
        amount: parseFloat(data['Buy/Sell Amount']),
        price: parseFloat(data.Price),
      });
    })
    .on('end', async () => {
      try {
        await Trade.insertMany(results);
        fs.unlinkSync(filePath);  // Clean up the uploaded file
        res.status(200).send('File successfully processed and data stored.');
      } catch (error) {
        res.status(500).send('Error storing data.');
      }
    });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
