const { Pool } = require('pg');
const stores = require('./stores.json');

class ModelClass {
    constructor() {
        this.connection = new Pool({
            user: 'postgres',
            host: process.env.DB_HOST || "localhost",
            database: 'postgres',
            password: '1234',
            port: 5432,
        });
    }

    async connectDatabase() {
        await this.connection.connect();
    }

    async setupDatabase() {
        await this.connection.query(`
            CREATE TABLE IF NOT EXISTS public.stores
            (
                id SERIAL,
                name text,
                url text,
                district text,
                rating integer,
                CONSTRAINT stores_pkey PRIMARY KEY (id)
            )
        `);

        await this.connection.query(`
            ALTER TABLE IF EXISTS public.stores
                OWNER to postgres
        `);

        for (const store of stores) {
            const { rows } = await this.connection.query(`
                SELECT * FROM stores WHERE name = $1
            `, [store.name]);

            if (rows.length === 0) {
                console.log(`Inserting ${store.name}`);
                await this.connection.query(`
                    INSERT INTO stores (name, url, district, rating)
                    VALUES ($1, $2, $3, $4)
                `, [store.name, store.url, store.district, store.rating]);
            }
        }
    }

    async getStores() {
        try {
            const { rows } = await this.connection.query(`
                SELECT * FROM stores ORDER BY name;
            `);
            return rows;
        } catch (error) {
            console.error("Failed to get stores from the database", error);
            throw error;
        }
    }

     async getStoresByDistrict(district) {
        try {
            
            const query = `
                SELECT * FROM stores
                WHERE district = $1
                ORDER BY name;
            `;
            const { rows } = await this.connection.query(query, [district]);
            return rows;
        } catch (error) {
            console.error("Failed to get stores by district from the database", error);
            throw error;
        }
    }

    // Inside ModelClass

async getStoreById(id) {
    const query = `SELECT * FROM stores WHERE id = $1`;
    const result = await this.connection.query(query, [id]);
    return result; // This should be an object containing a 'rows' array
}


async updateStore(id, name, url, district, rating) {
    // Convert rating to an integer or set it to null if empty
    const ratingValue = rating ? parseInt(rating, 10) : null;

    // You might want to add additional checks to ensure ratingValue is a valid integer

    const query = `
        UPDATE stores
        SET name = $1, url = $2, district = $3, rating = $4
        WHERE id = $5
    `;
    await this.connection.query(query, [name, url, district, ratingValue, id]);
}


}

module.exports = ModelClass;
