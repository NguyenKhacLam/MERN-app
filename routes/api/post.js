const express = require('express')
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('./../../middleware/auth');
const Post = require('./../../models/Post');
const User = require('./../../models/User');
const Profile = require('./../../models/Profile');


// @route       Get api/post
// @desc        get all post
// @access      private
router.get('/', auth, async(req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
})

// @route       Get api/post
// @desc        get one post
// @access      private
router.get('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404).json({ msg: 'Post not found!' });
        }

        res.status(200).json(post);
    } catch (error) {
        console.log(error.message);
        if (error.kind == 'ObjectId') {
            res.status(404).json({ msg: 'Invalid id!' });
        }
        res.status(500).send('Server Error!');
    }
})

// @route       Detele api/post
// @desc        delete one post
// @access      private
router.delete('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found!' });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorize' });
        }

        await post.remove()

        res.status(200).json({ msg: 'Post deleted!' });
    } catch (error) {
        console.log(error.message);
        if (error.kind == 'ObjectId') {
            res.status(404).json({ msg: 'Invalid id!' });
        }
        res.status(500).send('Server Error!');
    }
})

// @route       POST api/post
// @desc        create post
// @access      private
router.post('/', [
        auth, [
            check('text', 'Text is required').not().isEmpty()
        ]
    ],
    async(req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            })

            const post = await newPost.save();

            res.status(200).json(post);
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server Error!');
        }
    }
)


// @route       Put api/post/like/:id
// @desc        like post
// @access      private
router.put('/like/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already lieked' })
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.status(200).json(post.likes);
    } catch (error) {
        console.log(error.message);
        if (error.kind == 'ObjectId') {
            res.status(404).json({ msg: 'Invalid id!' });
        }
        res.status(500).send('Server Error!');
    }
})


// @route       Put api/post/like/:id
// @desc        unlike post
// @access      private
router.put('/unlike/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been lieked' })
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.status(200).json(post.likes);
    } catch (error) {
        console.log(error.message);
        if (error.kind == 'ObjectId') {
            res.status(404).json({ msg: 'Invalid id!' });
        }
        res.status(500).send('Server Error!');
    }
})

// @route       POST api/post/comment/:id
// @desc        create comment
// @access      private
router.post('/comment/:id', [
        auth, [
            check('text', 'Text is required').not().isEmpty()
        ]
    ],
    async(req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.id);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            }

            post.comment.unshift(newComment)

            await post.save();

            res.status(200).json(post.comment);
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server Error!');
        }
    }
)

module.exports = router;