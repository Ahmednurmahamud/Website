const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const ModelClass = require('./model.js');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const Model = new ModelClass();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    try {
        const selectedDistrict = req.query.district || '';
        let storesData = selectedDistrict
            ? await Model.getStoresByDistrict(selectedDistrict)
            : await Model.getStores();

        res.render('index', { stores: storesData, selectedDistrict });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.get('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await Model.getStoreById(id);

        if (rows.length === 0) {
            return res.status(404).send('Store not found');
        }

        res.render('edit', { store: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.post('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, district, rating } = req.body;

        await Model.updateStore(id, name, url, district, rating);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

const server = async () => {
    await Model.connectDatabase();
    await Model.setupDatabase();

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
};

server();
