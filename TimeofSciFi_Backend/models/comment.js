const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    recommendationId: {
      type: Schema.Types.ObjectId,
      ref: 'Recommendation',
      required: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
