const express = require('express');
const User = require('./../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// @GET     GET api/user
router.post(
    '/', [
        check('name', 'Name is required')
        .not()
        .isEmpty(),
        check('email', 'Please provide a valid email').isEmail(),
        check('password', 'Enter a password with 6 or more characters').isLength({
            min: 6
        })
    ],
    async(req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exist!' }] });
            }

            // Get user avatar
            const avatar = gravatar.url({
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            user = new User({
                name,
                email,
                password,
                avatar
            });

            // Ecrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

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