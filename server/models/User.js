const { pool } = require('../config/db');

const userModel = {
    async create(fields) {
        const { rows } await pool.query(
            'INSERT INTO users (...) VALUES ($1, $2, $3, $4) RETURNING *',
            [first_name, last_name, email, password]
        )
        return rows[0];
    },

    async findByEmail(email) => {
        const {rows} = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0];
    }
};

module.exports = userModel;