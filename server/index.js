const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/payment', require('./routes/paymentRoutes'));

// Serve static files from the client directory
const clientPath = path.join(__dirname, '../client');
console.log('Serving static files from:', clientPath);
app.use(express.static(clientPath));

// Fallback to index.html for SPA-like behavior
app.get('/', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

// Remove catch-all for now to isolate issue, or try explicit path
// app.get('*', (req, res) => {
//     res.sendFile(path.join(clientPath, 'index.html'));
// });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
