const express = require('express');
const morgan = require('morgan');
const {Database} = require('sqlite3');

const app = express();
app.use(morgan('dev'));
app.use(express.json());

const maxResults = 20;
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
    });
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

app.get('/api/products/search', (req, res) => {
    const searchparam = req.query.q || '';
    const orderBy = req.query.orderBy || '0';
    const direction = req.query.orderDescending === '1' ? 'DESC' : 'ASC';

    const page = parseInt(req.query.page) || 0;
    const offset = page * maxResults;

    const columnsMap = {
        "0": "name",
        "1": "brand",
        "2": "likeness",
        "3": "date_added"
    };

    const sortColumn = columnsMap[orderBy] || "name";
    const wildcard = `%${searchparam}%`;

    const query = `
        SELECT * FROM products 
        WHERE name LIKE ? OR brand LIKE ? 
        ORDER BY ${sortColumn} ${direction}
        LIMIT ? OFFSET ?
    `;

    db.all(query, [wildcard, wildcard, maxResults, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.use(express.static('public'));

const port = 3000;
app.listen(port, () => console.log(`Scanner running on http://localhost:${port}`));