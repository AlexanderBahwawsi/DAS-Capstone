const { pool } = require('../config/db');

const userModel = {
    async create({first_name, last_name, email, password, bio='', role='submitter'}) {
        const { rows } = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, bio, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [first_name, last_name, email, password, bio, role]
        );
        return rows[0];
    },

    async findByEmail(email) {
        const {rows} = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0];
    },

    //findbyId
    async findById(id){
        const {rows} = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0];
    },
    //findAll
    async findAll(){
        const {rows} = await pool.query('SELECT id, first_name, last_name, email, password, bio, role, created_at FROM users ORDER BY created_at DESC');
        return rows;
    },
    //updateRole
    async updateRole(id, role){
        const {rows} = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            [role, id]
        );

        return rows[0];
    },
    //deletebyId
    async deleteById(id){
        const {rows} = await pool.query('DELETE FROM users WHERE id = $1',
            [id]
        );
        return rows;
    },

    async findByRole(role){
        const {rows} = await pool.query('SELECT * FROM users WHERE role = $1', [role]);
        return rows;
    }
};

module.exports = userModel;