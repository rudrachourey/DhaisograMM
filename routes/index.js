var express = require('express');
const passport = require('passport');
const { Strategy } = require('passport-local');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const multer = require('multer');
const crypto = require('crypto')
const path = require('path')
const cloudinary = require('cloudinary').v2;
const localStrategy = require('passport-local');
const { render } = require('ejs');
const bodyParser = require('body-parser');
const { post } = require('../app');
const { default: mongoose } = require('mongoose');
const formidable = require('formidable');
const posts = require('./posts');
passport.use(new localStrategy(userModel.authenticate()));
/* GET home page. */





var user

function registerOnSocket() {
  console.log(user)
  // socket.emit('register', (user));
}




router.get('/api/users', (req, res) => {
  userModel.findOne((err, users) => {
    if (err) throw err;
    res.json(users);
  });
});





//////////////////////********************* REGISTER ROUT *********************//////////////////////////


router.get('/', function (req, res, next) {
  res.render('index', { title: 'MyApp' });
});





router.post('/register', function (req, res, next) {
  var data = new userModel({
    email: req.body.email,
    name: req.body.name,
    username: req.body.username,
  })
  userModel.register(data, req.body.password)
    .then(function (createduser) {
      passport.authenticate('local')(req, res, function () {
        res.redirect("/profile")
      })
    })
});



//////////////////////********************* END OF REGISTER ROUT *********************//////////////////////////








//////////////////////********************* PROFILE sECTION ROUT *********************//////////////////////////


router.get('/profile', isLoggedIn, async function (req, res, next) {
  try {
    const loggedinUser = await userModel.findOne({ username: req.session.passport.user });

    // Fetch the user's own posts
    const newposts = await postModel.find({ userid: loggedinUser._id }).populate("userid");

    // Sort the newposts array in reverse order based on createdAt timestamp
    const sortedNewPosts = newposts.sort((a, b) => b.createdAt - a.createdAt);

    // Fetch the saved posts for the user
    const savedPosts = await postModel.find({ savedBy: loggedinUser._id }).populate("userid");

    res.render("profile", { newposts: sortedNewPosts, savedPosts, loggedinUser });
  } catch (err) {
    console.error("Error fetching user data or posts:", err);
    res.status(500).send("An error occurred while fetching user data or posts.");
  }
});




//////////////////////********************* END OF PROFILE sECTION ROUT *********************//////////////////////////






//////////////////////********************* LOGIN SECTION ROUT *********************//////////////////////////



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else { res.redirect('/login') }
}





router.get('/login', function (req, res, next) {
  res.render('login')
})


router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}), function (req, res) { })



router.get("/logout/:id", function (req, res) {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
})



//////////////////////********************* END OF LOGIN SECTION ROUT *********************//////////////////////////





//////////////////////********************* DELETE ACCOUNT SECTION ROUT *********************//////////////////////////





router.get("/delete", isLoggedIn, function (req, res) {
  userModel.findOneAndDelete({ username: req.session.passport.user })
    .then(function (deleteduser) {
      res.redirect("/login", deleteduser);
    })
})




//////////////////////********************* END OF DELETE ACCOUNT SECTION ROUT *********************//////////////////////////



//////////////////////*********************  DELETE OF POSTS SECTION ROUT *********************//////////////////////////



router.delete('/delete/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        
        const deletedPost = await postModel.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Find the user and remove the post from their posts array
        const userId = deletedPost.userid;
        await userModel.findByIdAndUpdate(userId, { $pull: { posts: postId } });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});








//////////////////////********************* LIKE SECTION ROUT *********************//////////////////////////




router.post('/like/:id', isLoggedIn, (req, res) => {
  const postId = req.params.id;

  // Check if the provided postId is a valid ObjectId
  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: 'Invalid postId' });
  }

  postModel.findById(postId, (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to find post' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the user already liked the post
    const isLiked = post.likes && post.likes.includes(req.user._id);

    if (isLiked) {
      // User already liked the post, so remove their ID from the likes array (dislike)
      post.likes = post.likes.filter(userId => userId.toString() !== req.user._id.toString());
    } else {
      // User has not liked the post yet, so add their ID to the likes array (like)
      post.likes.push(req.user._id);
    }

    // Save the updated post
    post.save((err, updatedPost) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save like on post' });
      }

      // Add or remove the post's _id to/from the likes array in the user model
      userModel.findByIdAndUpdate(
        req.user._id,
        { [isLiked ? '$pull' : '$push']: { likes: postId } },
        { new: true },
        (err, updatedUser) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update user likes' });
          }

          // Send a JSON response with the updated like count and whether the user has liked the post
          res.json({ likeCount: updatedPost.likes.length, isLiked });
        }
      );
    });
  });
});


router.post('/save/:id', isLoggedIn, async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the post is already saved by the user
    const isSaved = post.savedBy.includes(req.user._id);

    if (!isSaved) {
      // Save the user's _id in the post's savedBy array
      post.savedBy.push(req.user._id);
    } else {
      // Unsave the post by removing the user's _id from the savedBy array
      post.savedBy = post.savedBy.filter(userId => userId.toString() !== req.user._id.toString());
    }

    // Save the updated post
    await post.save();

    // Send the updated savedBy array in the response
    res.json({ message: 'Post saved/unsaved successfully', savedBy: post.savedBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save/unsave post' });
  }
});




router.get('/posts/:postId', (req, res) => {
  const postId = req.params.postId;

  // Find the post using postId and populate the 'likes' array with user details
  postModel.findById(postId)
    .populate('userid')
    .populate('likes')
    .exec((err, post) => {
      if (err || !post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Render the post details page and pass the post data to the template
      res.render('post_details', { post });
    });
});








//////////////////////********************* END OF LIKE SECTION ROUT *********************//////////////////////////








//////////////////////********************* EDIT SECTION ROUT *********************//////////////////////////


router.get('/edit', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedinUser) {
      res.render('edit', { loggedinUser });
    })
});



router.post('/update', isLoggedIn, function (req, res, next) {
  userModel.findOneAndUpdate({ username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio:req.body.bio })
    .then(function (user) {
      res.redirect("/profile");
    })
});



//////////////////////********************* END OF EDIT SECTION ROUT *********************//////////////////////////









////////////////////*********************** FOLLOW SECTION ROUT ****************/////////////////////////




router.get("/friend/:id", isLoggedIn, async function (req, res) {
  try {
    // Find the logged-in user
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Find the user to be followed/unfollowed based on the id provided in the URL
    const jiskoFriendBnanaHai = await userModel.findOne({ _id: req.params.id });

    if (!jiskoFriendBnanaHai) {
      return res.status(404).send("User not found.");
    }

    // Check if the logged-in user is already following the user to be unfollowed
    const isFollowing = user.following.includes(jiskoFriendBnanaHai._id);

    if (isFollowing) {
      // If already following, unfollow the user
      user.following = user.following.filter(id => id.toString() !== jiskoFriendBnanaHai._id.toString());
      jiskoFriendBnanaHai.followers = jiskoFriendBnanaHai.followers.filter(id => id.toString() !== user._id.toString());
    } else {
      // If not following, follow the user (your existing follow logic)
      user.following.push(jiskoFriendBnanaHai._id);
      jiskoFriendBnanaHai.followers.push(user._id);
    }

    // Save the changes in both users
    await user.save();
    console.log("User saved:", user);

    await jiskoFriendBnanaHai.save();
    // console.log("jiskoFriendBnanaHai saved:", jiskoFriendBnanaHai);

    // Send the updated follower count and action status ("Follow" or "Unfollow") back to the client as JSON
    res.json({ followerCount: jiskoFriendBnanaHai.followers.length, isFollowing: !isFollowing });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error handling follow/unfollow.");
  }
});











////////////////////*********************** END OF FOLLOW SECTION ROUT ****************/////////////////////////







///////////////////******************** MESSAGE SECTION *****************/////////////////////////



router.get('/inbox', isLoggedIn, (req, res) => {
  userModel.find({ username: req.session.passport.user })
    .then((loggedinUser) => {
      userModel.find()
        .then((allusers) => {
          res.render('inbox', { allusers, loggedinUser, loggedinUser: JSON.stringify(loggedinUser), Allusers: JSON.stringify(allusers) })
          // console.log({loggedinUser})
        })
    })
})

router.get('/chatuser', isLoggedIn, (req, res) => {
  userModel.find({ username: req.session.passport.user })
    .then((loggedinUser) => {
      userModel.find()
        .then((user) => {
          res.render('allusers', ({ user, loggedinUser }))
          console.log({ user, loggedinUser })
        })
    })
})


///////////////////******************** END OF MESSAGE SECTION *****************/////////////////////////





////////////////****************************CREATE POST ROUT*********************//////////////////////////////





cloudinary.config({
  cloud_name: 'dc846i7fs',
  api_key: '818179237328558',
  api_secret: 'iXHvha8bnhT5egJhbedya0m8FUo',
  secure: true
});





router.post('/post', isLoggedIn, function (req, res, next) {
  const file = req.files.filepost;
  cloudinary.uploader.upload(file.tempFilePath, { resource_type: 'auto' }, (err, result) => {
    if (err) {
      // Handle error
      return res.status(500).json({ error: 'Error uploading file to Cloudinary' });
    }

    userModel.findOne({ username: req.session.passport.user })
      .then((loggedinUser) => {
        const newpost = new postModel({
          _id: new mongoose.Types.ObjectId(),
          userid: loggedinUser._id,
          caption: req.body.caption,
          media: result.url
        });

        newpost.save()
          .then(() => {
            loggedinUser.posts.push(newpost);
            loggedinUser.save()
              .then(() => {
                res.redirect("/profile");
              })
              .catch((error) => {
                console.error('Error saving user:', error);
                // Handle error
                res.status(500).json({ error: 'Error saving user' });
              });
          })
          .catch((error) => {
            console.error('Error saving post:', error);
            // Handle error
            res.status(500).json({ error: 'Error saving post' });
          });
      })
      .catch((error) => {
        console.error('Error finding user:', error);
        // Handle error
        res.status(500).json({ error: 'Error finding user' });
      });
  });
});













////////////////****************************END OF CREATE POST ROUT*********************//////////////////////////////







////////////**********************PROFILE PHOTO ROUT************//////////////////////////


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(13, function (err, buff) {
      const fn = buff.toString("hex") + path.extname(file.originalname);
      cb(null, fn);
    })
  }
})


const upload = multer({ storage: storage, fileFilter: fileFilter })
function fileFilter(req, file, cb) {
  if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/webp" || file.mimetype === "image/png") {
    cb(null, true);
  }
  else {
    cb(new Error("wrong File Choose"), false);
  }
}


router.post('/upload', isLoggedIn, upload.single(""), function (req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggdinuser) {
      loggdinuser.profileimage = req.file.filename;
      loggdinuser.save()
        .then(function () {
          res.redirect("back");
        })
    })
});






// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// router.post('/upload-profile-photo', upload.single('profilePhoto'), async (req, res) => {
//   try {
//     console.log("file from backend",req.file)
    
//     // Check if a file was uploaded
//     if (!req.file) {
//       console.log("file from backend if els",req.file)
      
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Upload the image to Cloudinary
//     cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
//       if (error) {
//         console.error(error);
//         return res.status(500).json({ error: 'Error uploading to Cloudinary' });
//       }

//       const loggedInUsername = req.session.passport.user; // Get the username from the session

//       // Update the user's profileImage field with the Cloudinary URL
//       try {
//         const user = await userModel.findOneAndUpdate(
//           { username: loggedInUsername },
//           { profileimage: result.url },
//           { new: true }
//         );

//          console.log("user from bakcend",user)
//         // Return the Cloudinary URL in the response
//         return res.json({ imageUrl: result.url });
//       } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: 'Error updating user profile' });
//       }
//     }).end(req.file.buffer);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Server error' });
//   }
// });






////////////********************** END OF PROFILE PHOTO ROUT************//////////////////////////






/////////////////******************HOME PAGE ROUT*************************///////////////////////






  router.get('/home', async (req, res, next) => {
    try {
      const loggedinUser = await userModel.findOne({ username: req.session.passport.user });
  
      const followingIds = loggedinUser.following.map(follower => follower._id);
      followingIds.push(loggedinUser._id);
  
      const [userposts, userstories] = await Promise.all([
        postModel.find({ userid: { $in: followingIds } })
          .populate('userid')
          .populate({
            path: 'likes',
            select: 'username profileimage name'
          })
          .sort({ createdAt: -1 }),
  
        userModel.find({ _id: { $in: followingIds } })
          .select('stories')
          .populate('stories')
      ]);
  
      const populatedUserPosts = userposts.map((post) => {
        const sortedLikes = post.likes.sort((a, b) => a.createdAt - b.createdAt);
        const lastLikedBy = sortedLikes.length > 0 ? sortedLikes[sortedLikes.length - 1].username : null;
        return { ...post._doc, lastLikedBy: lastLikedBy };
      });
  // console.log( {"userstoriesssssss":userstories})
      res.render('home', { loggedinUser, userposts: populatedUserPosts, userstories });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  










  router.get('/posts/:postId/likes', function(req, res, next) {
    const postId = req.params.postId;
  
    postModel
      .findById(postId)
      .populate('likes', 'username profileimage name') // Select the fields you want to display for each liker
      .exec()
      .then((post) => {
        // console.log(post)
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
  
        res.status(200).json(post.likes);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch likes for the post' });
      });
  });













  router.get('/posts/:postId/details', function(req, res, next) {
    const postId = req.params.postId;
    
    postModel
      .findById(postId)
      .populate('userid', 'username profileimage ')
      .populate('likes', 'username profileimage name')
      .exec()
      .then((post) => {
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
  
        // Assuming comments are stored as a subdocument within the post, populate the 'comments' field
        postModel.populate(post, { path: 'comments.user', select: 'username profileimage' }, function(err, populatedPost) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch post details' });
          }
  
          res.status(200).json(populatedPost);
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch post details' });
      });
  });
  











/////////////////////////******************END OF FORM PAGE ROUT ****************///////////////////////






router.get('/cart/:id', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (user) {
      user.cart.push(req.params.id);
      user.save().then(function () {
        res.redirect("back");
      })
    })
});



router.get('/remove/cart/:id', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedinUser) {
      var index = loggedinUser.cart.indexOf(req.params.id);
      loggedinUser.cart.splice(index);
      loggedinUser.save().then(function () {
        res.redirect("back");
      })
    })
})


















////////////////////******************* SEARCH SECTION ROUT *************************//////////////////////



router.post('/getFruits', async function (req, res, next) {
  let payload = req.body.payload.trim();
  let search = await userModel.find({ name: { $regex: new RegExp('^' + payload + '.*', 'i') } }).exec();
  //limit Search results to 10
  search = search.slice(0, 10);
  res.send({ payload: search })
  // console.log({payload:search});
});



/////////////////////////****************** END OF SEARCH ROUT ****************///////////////////////








/////////////////////////***************** */ SEARCH USER PROFILE ROUT ****************///////////////////////


router.get("/userprofile/:id", isLoggedIn, function (req, res) {
  const profileUserId = req.params.id; // Get the ID of the user whose profile you are visiting

  userModel.findOne({ _id: profileUserId }, (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching user.");
    }

    if (!user) {
      console.log('User not found');
      return res.status(404).send("User not found.");
    }

    userModel.findOne({ username: req.session.passport.user })
      .then((loggedinUser) => {
        // Find posts for the profile user only
        postModel.find({ userid: profileUserId })
          .populate('userid')
          .then((userposts) => {
            // console.log(userposts, "postsprofile console////////////////???????????");
            res.render('allusers', { user, loggedinUser, userposts });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send("Error fetching posts.");
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error fetching logged-in user.");
      });
  });
});



/////////////////////////******************END OF SEARCH USER PROFILE ROUT ****************///////////////////////




////////////////////*********************** COMMENT SECTION ROUT ****************/////////////////////////




  router.post('/comments/:postId', async (req, res, next) => {
    try {
      const postId = req.params.postId;
      const { content } = req.body;
      console.log({"backend post id":postId})
      console.log({"backend content":content})
      // Find the post by ID
      const post = await postModel.findById(postId);
      console.log("finded post",post)
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Create a new comment object
      const newComment = {
        content: content,
        user: req.user._id, // Assuming you have authentication middleware that sets the user ID in req.user
      };

      console.log({newComment:"data base me comment added"})


      // Save the comment to the post's comments array
      post.comments.push(newComment);
      await post.save();

      // Return a success response
      res.status(200).json({ message: 'Comment posted successfully', comment: newComment });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });




  router.get('/postscomment/:postId/details', async (req, res, next) => {
    try {
      const postId = req.params.postId;
      const post = await postModel
        .findById(postId)
        .populate('comments.user', 'username profileimage _id')
        .populate('userid', 'username profileimage _id')

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Map commentsData to include user information
      const commentsData = post.comments.map((comment) => {
        return {
          content: comment.content,
          userProfileImage: comment.user.profileimage,
          username: comment.user.username,
          userid:comment.user._id
        };
      });

      console.log({"user id aa gyiiiiiiiiiii":commentsData});

      // Loop through the commentsData array to log the userProfileImage for each comment
      commentsData.forEach((comment) => {
        console.log(comment.userProfileImage);
      });

      res.status(200).json({ ...post._doc, commentsData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });





////////////////////*********************** EXPLORE SECTION ROUT ****************/////////////////////////



router.get('/explore', isLoggedIn, async (req, res) => {
  try {
      const loggedinUser = await userModel.findOne({ username: req.session.passport.user });

      // Fetch all users (excluding the logged-in user) and all posts with related data
      const allUsers = await userModel.find({ _id: { $ne: loggedinUser._id } });
      
      const userposts = await postModel.find({})
          .populate('userid', 'username profileimage')
          .populate({
              path: 'comments',
              populate: { path: 'user', select: 'username profileimage' }
          })
          .sort({ createdAt: -1 });

      res.render("explore", { loggedinUser, allUsers, userposts });
      // console.log(loggedinUser);
      // console.log(allUsers); 
      // console.log(userposts);
  } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error and redirect or render an error page
      res.redirect('/'); // Redirect to home page or error page
  }
});



////////////////////***********************END OF EXPLORE SECTION ROUT ****************/////////////////////////









////////////////////***********************STORY SECTION ROUT ****************/////////////////////////


router.post('/postStory', async (req, res) => {
  const story_img = req.files.story_img.tempFilePath;
  const loggedInUserId = req.user._id; // Assuming you're using Passport for authentication
    // console.log("story image", story_img);
  // console.log("loggedin user id", loggedInUserId);

  try {
    // Start Cloudinary upload
    const uploadResult = await cloudinary.uploader.upload(story_img, {
      folder: 'stories/' // You can customize the folder structure here
    });

    // Find the logged-in user by their ID and populate the necessary fields
    const user = await userModel.findById(loggedInUserId)
      .populate('followers', 'username profileimage')
      .populate('following', 'username profileimage');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new story object
    const newStory = {
      story_img: uploadResult.secure_url,
      username: user.username,
      who_posted: user.name,
      timestamp: Date.now(),
      expire_at: Date.now() + 24 * 60 * 60 * 1000 // Example: Expires after 24 hours
    };
    // console.log("new storyyyyyyyyyyyyyyyyy",newStory)

    // Add the new story to the user's stories array
    user.stories.push(newStory);

    // Save the updated user document
    await user.save();

    res.json({ message: 'Story posted successfully' ,newStory});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




router.get('/getStoryUsers', async (req, res) => {
  try {
    const storyUsers = await userModel.find({ stories: { $exists: true, $not: { $size: 0 } } }, 'profileimage _id');
    res.json(storyUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching story users' });
  }
});





router.get('/getUserStories/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by their ID
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userStories = user.stories; // Assuming stories are stored in an array within the user document
    
    // Send the user's stories
    // console.log({"specific users storiessssssss":userStories})
    res.json({ stories: userStories, profileImage: user.profileimage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});






router.delete('/deleteStory/:userId/:storyId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const storyId = req.params.storyId;
    console.log("userid from backen for deleting stories",userId)
    console.log("storyid from backen for deleting stories",storyId)
    // Find the user by ID
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the index of the story to be deleted
    const storyIndex = user.stories.findIndex(story => story._id.toString() === storyId);

    if (storyIndex === -1) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Remove the story from the user's array of stories
    user.stories.splice(storyIndex, 1);
    await user.save();

    res.status(204).send(); // Respond with a 204 status indicating success (No Content)
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Internal server error' }); // Respond with a 500 status indicating an error
  }
});



////////////////////***********************END OF STORY SECTION ROUT ****************/////////////////////////









////////////////////***********************FOLLOWERS FOLLOWING DISPLYING SECTION ROUT ****************/////////////////////////


router.get("/getFollowersAndFollowing", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const followers = await userModel.find({ _id: { $in: user.followers } })
      .select("username name profileImage"); // Select only the required fields

    const following = await userModel.find({ _id: { $in: user.following } })
      .select("username name profileImage"); // Select only the required fields

    res.json({ followers, following });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching followers and following." });
  }
});



router.get('/getFollowers/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const followers = await userModel.find({ _id: { $in: user.followers } })
      .select("username name profileImage");

    res.json({ followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching followers." });
  }
});

router.get('/getFollowing/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // console.log("userid from backend",userId)
    const user = await userModel.findById(userId);
    console.log("userid from backend", )
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Fetch the following using user.following
    const following = await userModel.find({ _id: { $in: user.following} })
      .select("username name profileImage");
    // console.log("user's following>.................>>>>>",following)
    res.json({ following });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching following." });
  }
});



////////////////////***********************END OF FOLLOWERS FOLLOWING DISPLYING SECTION ROUT ****************/////////////////////////


















module.exports = router;


