// ==================== controllers/contactController.js ====================
const Contact = require('../models/Contact');
const { sendContactNotification } = require('../utils/emailService');

// ==================== Public Endpoints ====================

// Create new contact message
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    console.log('📧 Creating new contact message from:', email);
    
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });
    
    // Send notification to admin (don't block response if email fails)
    try {
      await sendContactNotification(contact);
      console.log('✅ Contact notification sent');
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
      // Continue anyway - message is saved
    }
    
    console.log('✅ Contact message created:', contact.id);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon!',
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        created_at: contact.created_at
      }
    });
  } catch (error) {
    console.error('❌ Create contact error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};

// ==================== Admin Endpoints ====================

// Get all contacts (with pagination and filtering)
exports.getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📋 Fetching contacts - Page:', page, 'Status:', status || 'all');
    
    const { contacts, total } = await Contact.findAll({
      status,
      limit: parseInt(limit),
      offset
    });
    
    console.log('✅ Found', total, 'contacts');
    
    res.json({
      success: true,
      contacts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Get all contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
};

// Get single contact by ID
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Fetching contact:', id);
    
    const contact = await Contact.findById(id);
    
    if (!contact) {
      console.log('❌ Contact not found:', id);
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log('✅ Contact found:', contact.id);
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('❌ Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['new', 'read', 'responded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: new, read, or responded' 
      });
    }
    
    console.log('🔄 Updating contact', id, 'to status:', status);
    
    const contact = await Contact.updateStatus(id, status);
    
    if (!contact) {
      console.log('❌ Contact not found:', id);
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log('✅ Contact status updated:', contact.id);
    
    res.json({
      success: true,
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    console.error('❌ Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

// Delete contact
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️  Deleting contact:', id);
    
    const contact = await Contact.delete(id);
    
    if (!contact) {
      console.log('❌ Contact not found:', id);
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log('✅ Contact deleted:', id);
    
    res.json({ 
      success: true,
      message: 'Contact deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

// Get contact statistics
exports.getContactStats = async (req, res) => {
  try {
    console.log('📊 Fetching contact statistics');
    
    const newCount = await Contact.countByStatus('new');
    const readCount = await Contact.countByStatus('read');
    const respondedCount = await Contact.countByStatus('responded');
    const total = await Contact.countTotal();
    
    const stats = {
      total,
      new: newCount,
      read: readCount,
      responded: respondedCount,
      responseRate: total > 0 ? ((respondedCount / total) * 100).toFixed(2) : 0
    };
    
    console.log('✅ Contact stats:', stats);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get contact stats error:', error);
    res.status(500).json({ error: 'Failed to get contact statistics' });
  }
};

// Bulk delete contacts
exports.bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }
    
    console.log('🗑️  Bulk deleting contacts:', ids.length);
    
    let deletedCount = 0;
    const errors = [];
    
    for (const id of ids) {
      try {
        const deleted = await Contact.delete(id);
        if (deleted) deletedCount++;
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }
    
    console.log('✅ Bulk delete completed:', deletedCount, 'deleted');
    
    res.json({
      success: true,
      message: `${deletedCount} contact(s) deleted successfully`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete contacts' });
  }
};
