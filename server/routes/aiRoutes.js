const express  = require('express');
const { protect }     = require('../middleware/authMiddleware');
const { patientOnly } = require('../middleware/rbacMiddleware');
const { uploadSingle }= require('../middleware/uploadMiddleware');
const aiController    = require('../controllers/aiController');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai/scan
 * @desc    Upload food image → YOLOv8 detection → nutrition breakdown
 * @access  Patient only
 * @body    multipart/form-data: image (file), mealType (string)
 */
router.post('/scan', patientOnly, uploadSingle('image'), aiController.scanFoodImage);

/**
 * @route   GET /api/ai/scan/history
 * @desc    Paginated list of patient's past food scans
 * @access  Patient only
 * @query   page, limit, from (ISO date), to (ISO date)
 */
router.get('/scan/history', patientOnly, aiController.getScanHistory);

/**
 * @route   GET /api/ai/scan/:id
 * @desc    Single food scan detail
 * @access  Patient only (owns the scan)
 */
router.get('/scan/:id', patientOnly, aiController.getScanById);

/**
 * @route   POST /api/ai/chatbot
 * @desc    Send message to AI dietary chatbot
 * @access  Patient only
 * @body    { message: string, history: ChatMessage[] }
 */
router.post('/chatbot', patientOnly, aiController.getChatbotResponse);

module.exports = router;
