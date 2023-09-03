// const express = require('express');  
var mongoose = require("mongoose");
const passportlocalmongoose = require('passport-local-mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/Passportinsta")
const userSchema= mongoose.Schema({
  email:String,
  name:String,
  username:String,
  password:String,
  bio:String,
  Storys:String,
  profileimage:String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  comments: [
    {
      content: String, // Content of the comment
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'post' }, // Reference to the post for which the comment was made
      createdAt: { type: Date, default: Date.now }, // Timestamp for when the comment was made
    },
  ],
  stories: [
    {
      story_img: String,
      username: String,
      who_posted: String,
      timestamp: { type: Date, default: Date.now },
      expire_at: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 } // 24 hours later
    }
  ]
})
userSchema.plugin(passportlocalmongoose);
module.exports = mongoose.model("user", userSchema);
