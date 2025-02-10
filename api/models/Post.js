const mongoose = require('mongoose'); // import mongodb libraries into this file
const {Schema, model} = mongoose;

const PostSchema = new Schema({ // schema: define the structure (fields) of the document
  title:String,
  summary:String,
  content:String,
  cover:String,
  author:{type:Schema.Types.ObjectId, ref:'User'},
}, { // Schema options
  timestamps: true,
});

const PostModel = model('Post', PostSchema); // mode: actually used to interact with database

module.exports = PostModel; // makes it available to other files