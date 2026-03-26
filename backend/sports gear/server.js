const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// GET all gear
app.get('/api/gear', (req, res) => {
    const sql = "SELECT * FROM gear";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// GET gear by ID
app.get('/api/gear/:id', (req, res) => {
    const sql = "SELECT * FROM gear WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});

// POST new gear
app.post('/api/gear', (req, res) => {
    const { name, sport, type, usage_metric, max_usage, purchase_date } = req.body;
    const sql = 'INSERT INTO gear (name, sport, type, usage_metric, max_usage, purchase_date) VALUES (?,?,?,?,?,?)';
    const params = [name, sport, type, usage_metric, max_usage, purchase_date];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, ...req.body, current_usage: 0, status: 'Good' }
        });
    });
});

// UPDATE gear usage
app.put('/api/gear/:id', (req, res) => {
    const { current_usage, status } = req.body;
    // Build update query dynamically or just update usage/status
    const sql = `UPDATE gear SET current_usage = COALESCE(?, current_usage), status = COALESCE(?, status) WHERE id = ?`;
    const params = [current_usage, status, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

// DELETE gear
app.delete('/api/gear/:id', (req, res) => {
    const sql = 'DELETE FROM gear WHERE id = ?';
    db.run(sql, req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Recommendations Endpoint
app.get('/api/recommendations', (req, res) => {
    // Simple logic: If usage > 80% of max, recommend replacement.
    // Also can suggest new gear based on sport (mocked for now).
    const sql = "SELECT * FROM gear WHERE current_usage >= (max_usage * 0.8)";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        let recommendations = rows.map(item => ({
            type: 'Replacement',
            message: `Your ${item.name} is reaching its limit (${item.current_usage}/${item.max_usage} ${item.usage_metric}). Consider replacing it soon.`,
            related_product: `New ${item.type} for ${item.sport}`
        }));

        // Add some generic recommendations
        // In a real app, this would query a product catalog db
        const genericRecs = [
            { type: 'New', message: 'Check out the new Carbon Plate Running Shoes for improved speed.', sport: 'Running' },
            { type: 'Maintenance', message: 'Remember to restringe your racket every 3 months.', sport: 'Tennis' }
        ];

        res.json({
            "message": "success",
            "data": [...recommendations, ...genericRecs]
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
