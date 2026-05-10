const mongoose = require('mongoose');

// ─── Read Receipt sub-schema ────────────────────────────────────────────────

const ReadReceiptSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt:   { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Attachment sub-schema ──────────────────────────────────────────────────

const AttachmentSchema = new mongoose.Schema(
  {
    url:          { type: String, required: true },
    publicId:     { type: String },              // Cloudinary public_id
    originalName: { type: String },
    mimeType:     { type: String },
    sizeBytes:    { type: Number },
    thumbnailUrl: { type: String },
  },
  { _id: false }
);

// ─── Main ChatMessage Schema ────────────────────────────────────────────────

const ChatMessageSchema = new mongoose.Schema(
  {
    // ── Conversation context ───────────────────────────────────────────────
    /**
     * conversationId is a stable, sorted composite string of the two user IDs,
     * e.g. `${smallerId}_${largerId}` — makes querying a conversation O(1).
     */
    conversationId: { type: String, required: true, index: true },

    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Content ───────────────────────────────────────────────────────────
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'diet_plan', 'appointment', 'system', 'ai_chatbot'],
      default: 'text',
    },
    content: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    attachments: [AttachmentSchema],

    // Rich content payload (e.g. diet plan card, appointment card)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Status ─────────────────────────────────────────────────────────────
    isEdited:   { type: Boolean, default: false },
    editedAt:   { type: Date },
    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date },
    deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Read receipts ──────────────────────────────────────────────────────
    readBy: [ReadReceiptSchema],

    // ── Reply threading ────────────────────────────────────────────────────
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },

    // ── Reactions (emoji map) ──────────────────────────────────────────────
    reactions: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ─── Static helpers ──────────────────────────────────────────────────────────

/**
 * Generates a stable conversation ID from two user ObjectIds.
 * @param {string} idA
 * @param {string} idB
 * @returns {string}
 */
ChatMessageSchema.statics.makeConversationId = function (idA, idB) {
  return [idA.toString(), idB.toString()].sort().join('_');
};

/**
 * Fetch the last N messages in a conversation with cursor-based pagination.
 */
ChatMessageSchema.statics.getConversation = function (conversationId, { limit = 30, before } = {}) {
  const query = { conversationId, isDeleted: false };
  if (before) query.createdAt = { $lt: new Date(before) };

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'firstName lastName avatar role')
    .populate('receiver', 'firstName lastName avatar role')
    .populate('replyTo', 'content sender createdAt');
};

// ─── Indexes ──────────────────────────────────────────────────────────────────

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatMessageSchema.index({ sender: 1, createdAt: -1 });
ChatMessageSchema.index({ receiver: 1, isDeleted: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
