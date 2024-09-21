const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(bodyParser.json());


const pool = new Pool({
    connectionString: 'postgresql://openly-forgiving-turtle.data-1.use1.tembo.io:5432/postgres?user=postgres&password=S3nvVihgjiBMQZ9U',
    ssl: {
        rejectUnauthorized: false
    }
});


app.get('/validationUser', async (req,res) =>  {
    console.log(req.query)
    const username = req.query.username;
    const password = req.query.password;
    console.log(username)
    console.log(password)
    try {
        const result = await pool.query(`
                SELECT user_id, user_name, password 
                FROM users 
                WHERE user_name= $1 
                AND password= $2`,[username,password]);
        if (result.rows.length === 0) {
            // Eğer sonuç yoksa, uygun bir yanıt döndür
            throw new Error('No user found with the provided credentials');
            //res.status(404).json({ error: 'No user found with the provided credentials' });
        } else {
            // Eğer sonuç varsa, ilk satırı döndür
            res.status(200).json(result.rows[0]);
        }

    }catch (error){
        console.error('Database query error:', error);
        res.status(500).json({error: error});
    }

});

app.get('/borclar', async (req,res) =>  {
    const  username  = req.query.username;
    console.log(username)

    try {
        const result = await pool.query(`
        SELECT 
        b.borc,
        u_owner.user_name AS borc_owner_name,
        u_target.user_name AS borc_target_name
        FROM 
        borclar b
        JOIN 
        users u_owner ON b.borc_owner = u_owner.user_id
        JOIN 
        users u_target ON b.borc_target = u_target.user_id
        WHERE 
        b.borc_owner = (SELECT user_id FROM users WHERE user_name = $1)`,[username]);
        res.status(200).json(result.rows);
        console.log(result)
    }catch (error) {
        console.error('Error fetching data from database:', error);
        res.status(500).json({error: error});
    }
} )

app.get('/alacaklar', async (req,res) =>  {
    const  username  = req.query.username;
    console.log(username)
    try {
        const result = await pool.query(`
        SELECT 
        b.borc,
        u_owner.user_name AS borc_owner_name,
        u_target.user_name AS borc_target_name
        FROM 
        borclar b
        JOIN 
        users u_owner ON b.borc_owner = u_owner.user_id
        JOIN 
        users u_target ON b.borc_target = u_target.user_id
        WHERE 
        b.borc_target = (SELECT user_id FROM users WHERE user_name = $1)`,[username]);
        res.status(200).json(result.rows);
        console.log(result)
    }catch (error) {
        console.error('Error fetching data from database:', error);
        res.status(500).json({error: error});
    }
} )


app.post('/save-tutar', async (req, res) => {
    const { tutar,borc_owner,borc_target } = req.body;
    console.log(tutar)
    console.log(borc_owner)
    console.log(borc_target)
    try {
        const result = await pool.query(`
            UPDATE borclar
            SET borc = borc + $1
            WHERE borc_owner = (SELECT user_id FROM users WHERE user_name = $2)
            AND borc_target = (SELECT user_id FROM users WHERE user_name = $3)
            RETURNING *`, [tutar,borc_owner,borc_target]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/delete-tutar', async (req, res) => {
    const { tutar,borc_owner,borc_target } = req.body;
    console.log(tutar)
    console.log(borc_owner)
    console.log(borc_target)
    try {
        const result = await pool.query(`
            UPDATE borclar
            SET borc = borc - $1
            WHERE borc_owner = (SELECT user_id FROM users WHERE user_name = $2)
            AND borc_target = (SELECT user_id FROM users WHERE user_name = $3)
            RETURNING *`, [tutar,borc_owner,borc_target]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: error.message });
    }
});




const checkDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL connected');
        client.release();
    } catch (error) {
        console.error('Error connecting to PostgreSQL:', error.message);
    }
};

checkDatabaseConnection().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
} )
