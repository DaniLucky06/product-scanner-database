const express = require('express');
const {Database} = require('sqlite3');
const path = require('path');
const sqlite = require("node:sqlite");
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.listen(3000, () => console.log('Scanner running on http://localhost:3000'));

const db = new Database('./products.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the products database.');
    }
});

app.get('/api/products/get/:barcode', (req, res) => {
    const {barcode} = req.params;

    db.get('SELECT * FROM products WHERE barcode = ?', [barcode], (err, row) => {
        if (err) return res.status(500).json({error: err.message});

        if (row) {
            res.json({exists: true, ...row});
        } else {
            res.json({exists: false});
        }
    })
});

app.get('/api/products/getall', (req, res) => {
    db.all('SELECT * FROM products', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    })
});

app.post('/api/products', (req, res) => {
    const {barcode, brand, name, likeness, date_added, comment} = req.body;

    const query = `INSERT OR REPLACE INTO products (barcode, brand, name, likeness, date_added, comment) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(query, [barcode, brand, name, parseFloat(likeness), date_added, comment], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

app.post('/api/products/remove', (req, res) => {
    const {barcode} = req.body;

    const query = `DELETE FROM products WHERE barcode=?`;

    db.run(query, [barcode], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
})