// ==================== controllers/contactController.js ====================
const Contact = require('../models/Contact');
const { sendContactNotification } = require('../utils/emailService');

exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });
    
    // Send notification to admin
    await sendContactNotification(contact);
    
    res.status(201).json({
      message: 'Message sent successfully',
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { contacts, total } = await Contact.findAll({
      status,
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      contacts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const contact = await Contact.updateStatus(id, status);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.delete(id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
