// ==================== controllers/newsletterController.js ====================
const Newsletter = require('../models/Newsletter');

// ==================== Public Endpoints ====================

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('📧 Newsletter subscription request for:', email);
    
    // Check if already subscribed
    const existing = await Newsletter.findByEmail(email);
    
    if (existing) {
      if (existing.is_active) {
        console.log('⚠️  Already subscribed:', email);
        return res.status(400).json({ 
          error: 'This email is already subscribed to our newsletter' 
        });
      }
      
      // Reactivate subscription
      console.log('🔄 Reactivating subscription for:', email);
      await Newsletter.activate(email);
      
      console.log('✅ Subscription reactivated:', email);
      
      return res.json({ 
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.' 
      });
    }
    
    // Create new subscription
    const subscriber = await Newsletter.create(email);
    
    console.log('✅ New subscriber added:', email);
    
    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! You will receive our latest updates.',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        subscribed_at: subscriber.subscribed_at
      }
    });
  } catch (error) {
    console.error('❌ Subscribe error:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'This email is already subscribed' });
    }
    res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('🚫 Unsubscribe request for:', email);
    
    const subscriber = await Newsletter.deactivate(email);
    
    if (!subscriber) {
      console.log('❌ Subscriber not found:', email);
      return res.status(404).json({ error: 'Email not found in our subscriber list' });
    }
    
    console.log('✅ Unsubscribed successfully:', email);
    
    res.json({ 
      success: true,
      message: 'You have been unsubscribed successfully. We are sorry to see you go!' 
    });
  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe. Please try again later.' });
  }
};

// ==================== Admin Endpoints ====================

// Get all subscribers (with pagination and filtering)
exports.getAllSubscribers = async (req, res) => {
  try {
    const { active, page = 1, limit = 50 } = req.query;
    
    console.log('📋 Fetching subscribers - Page:', page, 'Active:', active || 'all');
    
    let subscribers;
    
    if (active !== undefined) {
      const isActive = active === 'true' || active === '1';
      subscribers = await Newsletter.findByStatus(isActive);
    } else {
      subscribers = await Newsletter.findAll();
    }
    
    // Apply pagination
    const offset = (page - 1) * parseInt(limit);
    const paginatedSubscribers = subscribers.slice(offset, offset + parseInt(limit));
    
    console.log('✅ Found', subscribers.length, 'subscribers');
    
    res.json({ 
      success: true,
      subscribers: paginatedSubscribers,
      pagination: {
        total: subscribers.length,
        totalPages: Math.ceil(subscribers.length / parseInt(limit)),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Get all subscribers error:', error);
    res.status(500).json({ error: 'Failed to get subscribers' });
  }
};

// Get subscriber by ID
exports.getSubscriberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Fetching subscriber:', id);
    
    const subscriber = await Newsletter.findById(id);
    
    if (!subscriber) {
      console.log('❌ Subscriber not found:', id);
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    
    console.log('✅ Subscriber found:', subscriber.email);
    
    res.json({
      success: true,
      subscriber
    });
  } catch (error) {
    console.error('❌ Get subscriber error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriber' });
  }
};

// Delete subscriber
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️  Deleting subscriber:', id);
    
    const subscriber = await Newsletter.deleteById(id);
    
    if (!subscriber) {
      console.log('❌ Subscriber not found:', id);
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    
    console.log('✅ Subscriber deleted:', id);
    
    res.json({ 
      success: true,
      message: 'Subscriber deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete subscriber error:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
};

// Get newsletter statistics
exports.getNewsletterStats = async (req, res) => {
  try {
    console.log('📊 Fetching newsletter statistics');
    
    const totalSubscribers = await Newsletter.countTotal();
    const activeSubscribers = await Newsletter.countActive();
    const inactiveSubscribers = totalSubscribers - activeSubscribers;
    
    // Get recent subscribers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscribers = await Newsletter.countRecentSubscribers(thirtyDaysAgo.toISOString());
    
    const stats = {
      total: totalSubscribers,
      active: activeSubscribers,
      inactive: inactiveSubscribers,
      recentSubscribers,
      activeRate: totalSubscribers > 0 
        ? ((activeSubscribers / totalSubscribers) * 100).toFixed(2) 
        : 0
    };
    
    console.log('✅ Newsletter stats:', stats);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get newsletter stats error:', error);
    res.status(500).json({ error: 'Failed to get newsletter statistics' });
  }
};

// Bulk delete subscribers
exports.bulkDeleteSubscribers = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Subscriber IDs array is required' });
    }
    
    console.log('🗑️  Bulk deleting subscribers:', ids.length);
    
    let deletedCount = 0;
    const errors = [];
    
    for (const id of ids) {
      try {
        const deleted = await Newsletter.deleteById(id);
        if (deleted) deletedCount++;
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }
    
    console.log('✅ Bulk delete completed:', deletedCount, 'deleted');
    
    res.json({
      success: true,
      message: `${deletedCount} subscriber(s) deleted successfully`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete subscribers' });
  }
};

// Export subscribers as CSV
exports.exportSubscribers = async (req, res) => {
  try {
    const { active } = req.query;
    
    console.log('📥 Exporting subscribers');
    
    let subscribers;
    
    if (active !== undefined) {
      const isActive = active === 'true' || active === '1';
      subscribers = await Newsletter.findByStatus(isActive);
    } else {
      subscribers = await Newsletter.findAll();
    }
    
    // Generate CSV
    let csv = 'ID,Email,Subscribed At,Status\n';
    
    subscribers.forEach(sub => {
      csv += `${sub.id},"${sub.email}","${sub.subscribed_at}","${sub.is_active ? 'Active' : 'Inactive'}"\n`;
    });
    
    console.log('✅ CSV generated:', subscribers.length, 'records');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csv);
  } catch (error) {
    console.error('❌ Export subscribers error:', error);
    res.status(500).json({ error: 'Failed to export subscribers' });
  }
};
