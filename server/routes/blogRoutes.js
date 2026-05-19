const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect } = require('../middleware/authMiddleware');
const { verifiedDoctor, adminOnly } = require('../middleware/rbacMiddleware');

const { uploadSingle } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// Create blog (Doctor only)
router.post('/', protect, verifiedDoctor, uploadSingle(), async (req, res) => {
  try {
    const { title, content, image } = req.body;
    let imageUrl = typeof image === 'string' ? image : undefined;

    if (req.file) {
      const uploadToCloudinary = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'blogs' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
      };
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const blog = await Blog.create({
      title,
      content,
      image: imageUrl,
      author: req.user._id,
      status: 'pending'
    });
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get my blogs (Doctor only)
router.get('/my', protect, verifiedDoctor, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: blogs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all approved blogs (Patient & Public)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'approved' })
      .populate('author', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: blogs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update blog (Doctor only)
router.patch('/:id', protect, verifiedDoctor, uploadSingle(), async (req, res) => {
  try {
    const { title, content, image } = req.body;
    let imageUrl = typeof image === 'string' ? image : undefined;

    if (req.file) {
      const uploadToCloudinary = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'blogs' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
      };
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const updateData = { title, content, status: 'pending' };
    if (imageUrl !== undefined) {
      updateData.image = imageUrl;
    }

    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      updateData,
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found or not authorized' });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get pending blogs (Admin only)
router.get('/pending', protect, adminOnly, async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'pending' }).populate('author', 'firstName lastName');
    res.status(200).json({ success: true, data: blogs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all blogs (Admin only)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author', 'firstName lastName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: blogs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update blog status (Admin only)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const blog = await Blog.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete blog (Doctor can delete own, Admin can delete any)
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // If doctor, check ownership
    if (req.user.role === 'doctor' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // If patient, deny
    if (req.user.role === 'patient') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
