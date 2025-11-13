// ==================== controllers/newsletterController.js ====================
const Newsletter = require('../models/Newsletter');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if already subscribed
    const existing = await Newsletter.findByEmail(email);
    
    if (existing) {
      if (existing.is_active) {
        return res.status(400).json({ error: 'Already subscribed' });
      }
      // Reactivate subscription
      await Newsletter.activate(email);
      return res.json({ message: 'Subscription reactivated successfully' });
    }
    
    // Create new subscription
    const subscriber = await Newsletter.create(email);
    
    res.status(201).json({
      message: 'Subscribed successfully',
      subscriber
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Already subscribed' });
    }
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    const subscriber = await Newsletter.deactivate(email);
    
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.findAll();
    
    res.json({ subscribers });
  } catch (error) {
    console.error('Get all subscribers error:', error);
     res.status(500).json({ error: 'Failed to get subscribers' });
  }
};