const express = require('express');
const User = require('./../../models/User');
const bcrypt = require('bcryptjs');
const auth = require('./../../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator/check');
const router = express.Router();

// @GET     GET api/user
router.get('/', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send('Server Errors');
    }
});

// Login
router.post(
    '/', [
        check('email', 'Please provide a valid email').isEmail(),
        check('password', 'Enter a password').exists()
    ],
    async(req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid users!' }] });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Invalid users!' }] });
            }

            const payload = { user: { id: user.id } };

            jwt.sign(
                payload,
                config.get('JwtSecret'), { expiresIn: 36000000 },
                (err, token) => {
                    if (err) throw err;
                    res.status(500).json({ token });
                }
            );
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Sever Error!');
        }
    }
);

module.exports = router;