// const router = require('express').Router();
// const express = require('express')
// const {createClient} = require('@supabase/supabase-js');


// const app = express()
// app.use(express.json());
// app.use(express.urlencoded({extended: true}));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

app.post('/api/auth/login', (req, res)=>{
    //return signup.html
});

app.post('api/auth/register', async(req, res) =>{
    const {email, password} = req.body;
    const {data, error} = await supabase.auth.signUp({
        email,
        password
    });
    if (error){
        return res.status(400).json({error: error.message});
    }

    return res.status(200).json({message: 'User created successfully'});
});

app.get('api/auth/me', async(req, res) => {
    //user logged in
})

// TODO: Add auth routes (POST /register, POST /login, GET /me)

module.exports = router;