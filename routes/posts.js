var mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    userid : {type: mongoose.Schema.Types.ObjectId, ref:"user"},
    caption:String,
    media:[
      {
      url:String,
      type:String
    }
  ],
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }] ,
  comments: [{
    content: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    createdAt: { type: Date, default: Date.now },

  }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }] ,

  


  })

module.exports = mongoose.model('post',postSchema);                                             


// var mongoose = require('mongoose');

// const postSchema = mongoose.Schema({
//     userid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
//     caption: String,
//     media: {
//         url: String,
//         type: String // 'image' or 'video'
//     }
// });

// module.exports = mongoose.model('post', postSchema);