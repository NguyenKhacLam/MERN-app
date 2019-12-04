const express = require('express');
const connectDB = require('./config/db');
const app = express();

// Connect database
connectDB();

app.use(express.json({ extented: false }));

app.get('/', (req, res) => {
    res.end("API's running!");
});

// Define route

app.use('/api/users', require('./routes/api/user'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/post', require('./routes/api/post'));
app.use('/api/auth', require('./routes/api/auth'));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});