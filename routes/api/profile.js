const express = require('express');
const request = require('request');
const config = require('config');
const auth = require('./../../middleware/auth');
const Profile = require('./../../models/Profile');
const User = require('./../../models/User');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @GET     GET api/profile/me
// @GET     Get current user profile
// @access     private
router.get('/me', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            res.status(500).json({ msg: 'There is no profile for this user!' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
});

// @POST     POST api/profile
// @POST     Create or update user profile
// @access     private
router.post(
    '/', [
        auth,
        check('status', 'Status is required')
        .not()
        .isEmpty(),
        check('skills', 'Skills is required')
        .not()
        .isEmpty()
    ],
    async(req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }

        // Build profile Object

        const profileFields = {};
        profileFields.user = req.user.id;
        if (req.body.company) profileFields.company = req.body.company;
        if (req.body.website) profileFields.website = req.body.website;
        if (req.body.location) profileFields.location = req.body.location;
        if (req.body.bio) profileFields.bio = req.body.bio;
        if (req.body.status) profileFields.status = req.body.status;
        if (req.body.githubusername)
            profileFields.githubusername = req.body.githubusername;
        if (req.body.skills) {
            profileFields.skills = req.body.skills.split(',').map(el => el.trim());
        }

        // Build social object
        profileFields.social = {};
        if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
        if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
        if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
        if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
        if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                // Update
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
                return res.json(profile);
            }
            // Create
            profile = new Profile(profileFields);
            await profile.save();

            return res.status(200).json(profile);
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server Error!');
        }
        // console.log(profileFields);
        // res.send('Hello!');
    }
);

// @GET     GET api/profile
// @GET     Get all user profile
// @access     private

router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.status(200).json(profiles);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
});

// @GET     GET api/profile
// @GET     Get one user profile by ID
// @access  public

router.get('/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'No profile for this user' });
        }

        res.status(200).json(profile);
    } catch (error) {
        console.log(error.message);
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'No profile for this user' });
        }
        res.status(500).send('Server Error!');
    }
});

// @route     DELETE api/profile
// @desc     Delte one user profile + postby ID
// @access  private
router.delete('/', auth, async(req, res) => {
    try {
        // Remove profile and user
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        res.status(200).json({ msg: 'User deleted!' });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route     PUT api/profile/experience
// @desc     update profile
// @access  private
router.patch(
    '/experience', [
        auth, [
            check('title', 'Title is required')
            .not()
            .isEmpty(),
            check('company', 'Company is required')
            .not()
            .isEmpty(),
            check('from', 'From date is required')
            .not()
            .isEmpty()
        ]
    ],
    async(req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.experience.unshift(newExp);

            await profile.save();

            res.status(200).json(profile);
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server Error!');
        }
    }
);

// @route     PUT api/profile/experience/:exp_id
// @desc     update profile
// @access  private
router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Get removed index
        const removeIndex = profile.experience
            .map(el => el.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.status(200).json(profile);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route     Get api/profile/github/:username
// @desc     get user repos from github
// @access  public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'nodejs' }
        };
        request(options, (err, response, body) => {
            if (err) console.log(err);
            if (response.statusCode != 200) {
                res.status(404).json({ msg: 'No github profile found' });
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
});
module.exports = router;