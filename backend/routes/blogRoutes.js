// ==================== routes/blogRoutes.js ====================
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/posts', blogController.getPublishedPosts);
router.get('/posts/:id', blogController.getPostById);
router.get('/categories', blogController.getCategories);

// Admin routes (protected)
router.get('/admin/posts', authMiddleware, blogController.getAllPosts);
router.post('/admin/posts', authMiddleware, blogController.createPost);
router.put('/admin/posts/:id', authMiddleware, blogController.updatePost);
router.delete('/admin/posts/:id', authMiddleware, blogController.deletePost);

module.exports = router;