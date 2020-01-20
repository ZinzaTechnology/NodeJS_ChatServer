import mongoose from 'mongoose';
require('mongoose-long')(mongoose);

var Long = mongoose.Types.Long;
const Schema = mongoose.Schema;

const MessageSchema = new Schema ({
  // abridged code
},
{
  timestamps: true
});

MessageSchema.index({cid: -1, au: 1, sa: -1, ss: 1});

export default mongoose.model('Message', MessageSchema);