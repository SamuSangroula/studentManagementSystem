import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { ensureSeedData } from './utils/seed.js';
import { bootstrapDatabase } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 5000);
const uploadDir = path.join(__dirname, '..', 'uploads');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(uploadDir));

app.use('/api', apiRouter);

app.use((err, req, res, next) => {
  void next;
  console.error(err);
  return res.status(500).json({ message: err.message || 'Server error' });
});

bootstrapDatabase()
  .then(() => ensureSeedData())
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
