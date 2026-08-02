const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());

app.get('/api/forecast', (req, res) => {
    const scriptPath = path.join(__dirname, '..', 'parse_imd.py');
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            console.error('Failed to parse output', e);
            res.status(500).json({ error: 'Failed to parse output' });
        }
    });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
