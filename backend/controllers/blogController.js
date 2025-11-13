// ==================== controllers/blogController.js ====================
const Blog = require('../models/Blog');

exports.getPublishedPosts = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { posts, total } = await Blog.findAll({
      category,
      status: 'published',
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      posts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get published posts error:', error);
    res.status(500).json({ error: 'Failed to get blog posts' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Blog.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only return published posts for public access
    if (post.status !== 'published') {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ post });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ error: 'Failed to get blog post' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Blog.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Admin routes
exports.getAllPosts = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { posts, total } = await Blog.findAllForAdmin({
      status,
      category,
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      posts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ error: 'Failed to get blog posts' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content, excerpt, category, author, image_url, status } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const post = await Blog.create({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category: category || 'General',
      author: author || req.admin.username,
      image_url: image_url || null,
      status: status || 'draft'
    });
    
    res.status(201).json({
      message: 'Blog post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, author, image_url, status } = req.body;
    
    const existingPost = await Blog.findById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = await Blog.update(id, {
      title: title || existingPost.title,
      content: content || existingPost.content,
      excerpt: excerpt || existingPost.excerpt,
      category: category || existingPost.category,
      author: author || existingPost.author,
      image_url: image_url !== undefined ? image_url : existingPost.image_url,
      status: status || existingPost.status
    });
    
    res.json({
      message: 'Blog post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Blog.delete(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
};