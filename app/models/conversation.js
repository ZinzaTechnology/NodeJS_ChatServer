import mongoose from 'mongoose';
require('mongoose-long')(mongoose);

var Long = mongoose.Types.Long;
const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    // abridged code
  },
  {
    timestamps: true
  }
);

ConversationSchema.index({ par: 1 });
ConversationSchema.index({ par: 1, updatedAt: -1 });

export default mongoose.model('Conversation', ConversationSchema);
