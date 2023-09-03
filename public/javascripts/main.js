/////////////////************SEARCH SECTION SCRIPT ******************////////////////////////////////// */
let loggedinUserId;

document.addEventListener('DOMContentLoaded', function() {


var search = document.querySelector("#searchicon");
var searchbar = document.querySelector('#searchbar');
var nav = document.querySelector('nav');
var flag = 0;



search.addEventListener("click", function (event) {
    event.stopPropagation();
    if (flag === 0) {
        gsap.to(searchbar,{
            width:"25%",
            ease:Expo.easeInOut
        })
     
        // nav.style.width = "5%";
        flag = 1;
    } else {
        gsap.to(searchbar,{
            width:0,
            ease:Expo.easeInOut
        })
        

        flag = 0;
    }
});



document.addEventListener('click', function (event) {
    // Check if the clicked element is inside the #searchbar or the #searchicon itself
    if (!searchbar.contains(event.target) && event.target !== search) {
        // Hide the #searchbar when clicking outside
        searchbar.style.width = 0;
        nav.style.width = '15%';
        flag = 0;
    }
});


});



function sendData(e) {
    const searchResults = document.getElementById('bottomsearch')
    var match = e.value.match(/^ [a-zA-Z]*/)

    let match2 = e.value.match(/\s*/);
    if (match2[0] === e.value) {
        searchResults.innerHTML = '';
        return;
    }


    // if(match[0] === e.value && e.value.length >= 1 ){
    fetch('getFruits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: e.value })
    }).then(res => res.json()).then(data => {
        let payload = data.payload
        //    console.log(payload )
        searchResults.innerHTML = '';
        if (payload.length < 1) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }
        payload.forEach((item, index) => {
            if (index > 0) searchResults.innerHTML += '<hr>';
            searchResults.innerHTML += `<div class="searchcard" userId='${item._id}' > 
                <div class="searchpic">
                <img src="../images/uploads/${item.profileimage}" alt="">
                </div>
                <div class="searchname">
                  <h3>${item.username}</h3>
                  <h5>${item.name}</h5>
                </div>
                 </div>`
        });

        var searchcard = document.querySelectorAll(".searchcard")


        searchcard.forEach(u => {
            u.addEventListener('click', function (e) {
                var userID = u.getAttribute('userId')
                // console.log(userID)
                if (userID === loggedinUserId) {
                    window.location = `/profile`; // Redirect to the logged-in user's profile
                } else {
                    window.location = `/userprofile/${userID}`
                }
            })
        })

    })
    return;
}






/////////////////************END OF SEARCH SECTION SCRIPT ******************////////////////////////////////// */








/////////////////************LIKE SECTION SCRIPT ******************////////////////////////////////// */


// jQuery click event handler

$(document).ready(function () {
    // jQuery click event handler for the heart icon
    $(document).on('click', '#heart', function (event) {
        event.preventDefault(); // Prevent the default link behavior

        const postID = $(this).parent().attr('likeId'); // Get the post ID from the "likeId" attribute
        const likeCountElement = $(this).siblings('p').find('strong');
        // console.log("posts iddd",postID)
        // console.log("posts element",likeCountElement)

        // Use AJAX to send a POST request to the server for liking the post
        $.ajax({
            url: `/like/${postID}`, // Replace with the correct server route for liking a post
            method: 'POST',
            dataType: 'json',
            timeout: 5000, // Set a timeout of 5 seconds
            success: function (response) {
                console.log(response,"responseeee")
                // Update the like count on the page without reloading the whole page
                likeCountElement.text(response.likeCount);
            },
            error: function (error) {
                console.error(error);
                alert('Failed to like the post.');
            }
        });
    });
});




$(document).ready(function () {
    // Use the 'on' method to attach the event listener to dynamically added elements
    $(document).on('click', 'svg[saved]', function () {
        const svgElement = $(this);
        const postId = svgElement.attr('saved');
        const isSaved = svgElement.hasClass('bookmark-filled');

        console.log('Clicked SVG. postId:', postId, 'isSaved:', isSaved);

        // Send the AJAX request to save/unsave the post
        $.ajax({
            type: 'POST',
            url: `/save/${postId}`,
            dataType: 'json',
            success: function (data) {
                console.log('Response from the server:', data);

                // Check if the response contains the savedBy array
                if (data.hasOwnProperty('savedBy')) {
                    // Toggle the class based on the response from the server
                    if (data.savedBy.includes(postId)) {
                        // If the post was saved, add the CSS class for filled bookmark icon
                        svgElement.removeClass('bookmark-unfilled').addClass('bookmark-filled');
                    } else {
                        // If the post was not saved, add the CSS class for unfilled bookmark icon
                        svgElement.removeClass('bookmark-filled').addClass('bookmark-unfilled');
                    }
                } else {
                    console.log('Invalid server response:', data);
                }
            },
            error: function (error) {
                console.log('Failed to save/unsave post:', error);
            },
        });
    });
});

////////////////////////////*********************** END OF LIKE SECTION SCRIPT ******************////////////////////////////////// */















/////////////////************PROFILE SECTION SCRIPT ******************////////////////////////////////// */




document.addEventListener("DOMContentLoaded", function() {
    const profileSelect = document.querySelector(".profile-pic-select");
    const foruploadDiv = document.getElementById("forupload");
    const profilePhotoInput = document.getElementById("profilePhoto");
    const profilePhotoForm = document.getElementById("profilePhotoForm");
  
    let flag = 0; // Initialize the flag variable
  
    document.querySelector("#profilepic").addEventListener("click", function () {
      if (flag === 0) {
        profileSelect.style.display = 'initial';
        flag = 1;
      } else {
        profileSelect.style.display = 'none';
        flag = 0;
      }
    });
  
    foruploadDiv.addEventListener("click", function() {
      profilePhotoInput.click(); // Trigger the file input dialog
    });
  
    profilePhotoInput.addEventListener("change", function(event) {
      const selectedFile = event.target.files[0]; // Get the selected file
      const formData = new FormData();
      formData.append("profilePhoto", selectedFile); // Append the selected file to the FormData
    //   profilePhotoForm.submit();
      // Send the FormData via AJAX to the server
      uploadProfilePhoto(formData);
    });
  
    async function uploadProfilePhoto(formData) {
      try {
        const response = await fetch("/upload-profile-photo", {
          method: "POST",
          body: formData,
        });
  
        // Handle the response from the server as needed
        const data = await response.json();
        console.log(data); // Log or process the data
      } catch (error) {
        console.error("Error uploading profile photo:", error);
      }
    }
  });
  




/////////////////************END OF PROFILE SECTION SCRIPT ******************////////////////////////////////// */











/////////////////************CREATE POSTS SECTION SCRIPT ******************////////////////////////////////// */




document.querySelector("#slecet").addEventListener("click", function () {
    document.querySelector("#postfile").click();
})



document.querySelector("#postfile").addEventListener("change", function () {
    document.querySelector("#file-posts").submit();
    document.getElementById('createpost').style.display = 'none'
})





// Define a variable to keep track of the visibility state

document.addEventListener('click', function (event) {
    let flag = 0;
    const createPostDiv = document.querySelector('#createpost');

    // Check if the clicked element is inside the #createpost div or the #create button itself
    if (!createPostDiv.contains(event.target) && event.target.id !== 'create') {
        // Hide the #createpost div when clicking outside
        createPostDiv.style.display = 'none';
        flag = 0;
    }
});

document.getElementById('createicon').addEventListener('click', (event) => {
    event.stopPropagation();
    // Toggle the visibility of #createpost div when clicking the #create button
    if (flag === 0) {
        document.querySelector('#createpost').style.display = 'initial';
        flag = 1;
    } else {
        document.querySelector('#createpost').style.display = 'none';
        flag = 0;
    }
});




/////////////////************END OF CREATE POSTS SECTION SCRIPT ******************////////////////////////////////// */










/////////////////************LOGOUT BUTTON SCRIPT ******************////////////////////////////////// */




var logout = document.querySelector('#logout')
var iconlog = document.querySelector('.iconlog')


var flaglog = 0;
iconlog.addEventListener('click', () => {
    if (flaglog === 0) {
        gsap.to(logout, {
            height: '7%',
            duration: .5,
            ease: Expo.easeInOut
        })
        flaglog = 1
    }
    else {
        gsap.to(logout, {
            height: '0%',
            duration: .5,
            ease: Expo.easeInOut
        })
        flaglog = 0
    }
})


/////////////////************END OF lOGOUT BUTTON  SCRIPT ******************////////////////////////////////// */


const savedsection = document.getElementById('savesection')
const postsSection = document.getElementById('postssection')
const savedPostsSection = document.querySelector('.savedposts')
const postss = document.querySelector('.post')


savedsection.addEventListener('click', () => {

    gsap.to(savedPostsSection, {
        x: '-110%',
        duration: .8
    })

    gsap.to(postss, {
        x: '-100%',
        duration: .8
    })
})

postsSection.addEventListener('click', () => {

    gsap.to(savedPostsSection, {
        x: '100%',
        duration: .8
    })

    gsap.to(postss, {
        x: "initial",
        duration: .8
    })
})




///////////////////////////**********************////////////////////////////****************************//////////////////////////////
///////////////////////////**********************PROFILE FULL POST SCRIPT FUNCTIONSS****************************//////////////////////////////
///////////////////////////**********************////////////////////////////****************************//////////////////////////////

let profileUserID;
let rightFullTop = document.querySelector('.username-profile');




const captionNameDiv = document.querySelector('#caption-name');
loggedinUserId = captionNameDiv.getAttribute('loggedinUser');

document.addEventListener("DOMContentLoaded", function () {


    console.log('Logged-in User ID:', loggedinUserId);


    const fullprofilecontainer = document.querySelector('.full-profile-post');
    const fulprofilpostclose = document.querySelector('#profile-cross');
    const likeDivs = document.querySelectorAll('.like-div');


    document.addEventListener("click", (event) => {
        const fullprofile = event.target.closest('.like-div');
        if (fullprofile) {
            profileUserID = fullprofile.getAttribute('profilepostid');
            // window.location = `/userprofile/${userID}`;
            fetchFullPostData(profileUserID);
            console.log('profile full post User ID:', profileUserID);
            // alert("heyyy id");
        }
    });




    console.log('Number of .like-div elements:', likeDivs.length);

    likeDivs.forEach((e) => {
        e.addEventListener("click", () => {
            fullprofilecontainer.style.display = "flex";
        });
    });

    fulprofilpostclose.addEventListener("click", () => {
        console.log('Clicked close');
        fullprofilecontainer.style.display = "none";
    });

    console.log('Attaching event listeners to .like-div elements');


    function fetchFullPostData(profileUserID) {
        // Make an AJAX request to fetch full post data
        $.ajax({
            type: 'GET',
            url: `/posts/${profileUserID}/details`,
            dataType: 'json',
            success: function (response) {
                console.log('Full post details:', response);
                displayFullPost(response);
            },
            error: function (error) {
                console.error(error);
            }
        });
    }

    function displayFullPost(fullPostData) {
        const fullProfileContainer = document.querySelector('.full-profile-post');
        const leftFullImg = fullProfileContainer.querySelector('#left-full img');
        const usernameProfile = fullProfileContainer.querySelector('.username-profile h4');
        const profileImage = fullProfileContainer.querySelector('.commented-user-profile-p img');
        const commentsSection = fullProfileContainer.querySelector('.right-middle-profile');
        const Sectionnocomments = document.querySelector('.no-comments');
        const menuIcon = document.querySelector('#menu-icon');




        // Update the content of the elements with the full post data
        leftFullImg.src = fullPostData.media[0];
        usernameProfile.textContent = fullPostData.userid.username;
        profileImage.src = fullPostData.userid.profileimage;

        // Show the full-profile container
        fullProfileContainer.style.display = "flex";

        if (loggedinUserId === fullPostData.userid._id) {
            console.log('Displaying menu icon');
            menuIcon.style.display = 'initial';
        } else {
            console.log('Hiding menu icon');
            menuIcon.style.display = 'none';
        }


        // Display likes count and last liked by
        const likesCount = fullProfileContainer.querySelector('.full-likes-count ');
        const lastLikedBy = fullProfileContainer.querySelector('.last-liked-by');

        rightFullTop.setAttribute('data-userid', fullPostData.userid._id);


        likesCount.textContent = `${fullPostData.likes.length} likes`;

        if (fullPostData.likes.length > 0) {
            const lastLike = fullPostData.likes[fullPostData.likes.length - 1];
            lastLikedBy.textContent = `Last liked by ${lastLike.username}`;
        }
        // Display date posted
        console.log("  loggedinuser id who posts it  ", fullPostData.userid._id)
        const dateSpan = fullProfileContainer.querySelector('.bottom-botmprofile span');
        const postDate = new Date(fullPostData.createdAt);
        const currentDate = new Date();
        const timeDiff = currentDate - postDate;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            dateSpan.textContent = 'Today';
        } else if (daysDiff === 1) {
            dateSpan.textContent = 'Yesterday';
        } else {
            dateSpan.textContent = `${daysDiff} days ago`;
        }



        // Display comments
        commentsSection.innerHTML = ''; // Clear existing comments

        if (fullPostData.comments.length > 0) {

            fullPostData.comments.forEach((comment) => {
                const commentElement = document.createElement('div');
                commentElement.classList.add('commented-userp');
                commentElement.innerHTML = `
        <div class="commented-user-profile-p">
            <img src="../images/uploads/${comment.user.profileimage}" alt="User Profile">
        </div>
        <div class="commented-user-name-profile">
            <div class="timediv">
                <h3 id="commentedusersid" commentuserID ="${comment.user._id}">${comment.user.username}</h3>
                <h3>${comment.content}</h3>
            </div>
            <p>${comment.createdAt}</p>
        </div>
    `;
                commentsSection.appendChild(commentElement);
            });
            
        }
        else {
            commentsSection.innerHTML = '<div class="no-comments">No comments yet</div>';
        }

        // Clear the comment input field
        const commentInputf = fullProfileContainer.querySelector('.comment-input');
        commentInputf.value = '';



        // Comment functionality
        const commentForm = fullProfileContainer.querySelector('.comment-form');
        const commentInput = commentForm.querySelector('.comment-input');
        const commentButton = commentForm.querySelector('.comment-button');

        commentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const content = commentInput.value.trim();
            if (content !== '') {
                // Send AJAX request to add a new comment
                $.ajax({
                    type: 'POST',
                    url: `/comments/${profileUserID}`,
                    data: { content },
                    dataType: 'json',
                    success: function (response) {
                        console.log('Comment added:', response);
                        // Refresh the comments section
                        fetchFullPostData(profileUserID);
                    },
                    error: function (error) {
                        console.error(error);
                    }
                });
                commentInput.value = '';
            }
        });

        // Like functionality
        const likeButton = fullProfileContainer.querySelector('.like-button');
        let isLiking = false; // Flag to prevent multiple requests





        likeButton.addEventListener('click', async () => {
            if (isLiking) {
                return;
            }

            isLiking = true;

            try {
                const response = await $.ajax({
                    type: 'POST',
                    url: `/like/${profileUserID}`,
                    dataType: 'json',
                });

                console.log('Post liked:', response);
                likesCount.textContent = `${response.likeCount} likes`;
                // Handle last liked by, toggle styles, etc.
            } catch (error) {
                console.error(error);
            } finally {
                isLiking = false;
            }
        });

        // Save functionality
        const saveButton = fullProfileContainer.querySelector('.save-button');

        saveButton.addEventListener('click', () => {
            // Send AJAX request to save the post
            $.ajax({
                type: 'POST',
                url: `/save/${profileUserID}`,
                dataType: 'json',
                success: function (response) {
                    console.log('Post saved:', response);
                    // Update UI accordingly
                },
                error: function (error) {
                    console.error(error);
                }
            });
        });



    }


})

console.log("loggedinuser id checkc",loggedinUserId)

document.addEventListener("click", (event) => {
    const searchAndprofile = event.target.closest('.username-profile');
    if (searchAndprofile) {
        const userID = searchAndprofile.getAttribute('data-userid');
        window.location = `/userprofile/${userID}`;
        if (userID === loggedinUserId){
            window.location.href = `/profile`; // Redirect to the logged-in user's profile
        } else {
            window.location.href = `/userprofile/${userID}`;
        }
        // console.log('User ID:', userID);
        // alert("heyyy id");
    }
});


document.addEventListener("click", (event) => {
    const commentElement = event.target.closest('#commentedusersid');
    if (commentElement) {
        const userID = commentElement.getAttribute('commentuserID');
        window.location = `/userprofile/${userID}`;
        if (userID === loggedinUserId) {
            window.location.href = `/profile`; // Redirect to the logged-in user's profile
        } else {
            window.location.href = `/userprofile/${userID}`;
        }
        // console.log('User ID:', userID);
        // alert("heyyy id");
    }
});






///////////////////////////**********************////////////////////////////****************************//////////////////////////////
///////////////////////////**********************END OF PROFILE FULL POST SCRIPT FUNCTIONSS****************************//////////////////////////////
///////////////////////////**********************////////////////////////////****************************//////////////////////////////













///////////////////////////**********************////////////////////////////****************************//////////////////////////////
///////////////////////////**********************FOLLOWING FOLLOWERS SCRIPT ****************************//////////////////////////////
///////////////////////////**********************////////////////////////////****************************//////////////////////////////

const followersDiv = document.querySelector(".followerdiv .followdiv");
const followingDiv = document.querySelector(".followingdiv .followdiv");
const followersprofile = document.getElementById("followers");
const followingprofile = document.getElementById("following");
const followersdiv = document.querySelector(".followerdiv");
const followingdiv = document.querySelector(".followingdiv");
const followerusername = document.querySelector(".followerusername h4");
let followId
let useridfollow;

flag = 0;
followersprofile.addEventListener("click",()=>{
    if(flag === 0){
        followersdiv.style.display = "initial"
    loadFollowersAndFollowing();

        flag = 1
    }
    else{
        followersdiv.style.display = "none"
        flag = 0
    }

})

followingprofile.addEventListener("click",()=>{

    if(flag === 0){
        followingdiv.style.display = "initial"
loadFollowersAndFollowing();

        flag = 1
    }
    else{
        followingdiv.style.display = "none"
        flag = 0
    }

})


document.addEventListener("click", (event) => {
    if (!followersdiv.contains(event.target) && !followersprofile.contains(event.target)) {
      followersdiv.style.display = "none";
      flag = 0;
    }
  
    if (!followingdiv.contains(event.target) && !followingprofile.contains(event.target)) {
      followingdiv.style.display = "none";
      flag = 0;
    }
  });


  function loadFollowersAndFollowing() {
    fetch("/getFollowersAndFollowing", {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Clear the content of the followersDiv and followingDiv
        followersDiv.innerHTML = "";
        followingDiv.innerHTML = "";
  
        // Display followers
        if (data.followers.length === 0) {
          const noFollowersMessage = document.createElement("p");
          noFollowersMessage.textContent = "No followers yet.";
          followersDiv.appendChild(noFollowersMessage);
        } else {
          // Loop through the followers and populate the followersDiv
          data.followers.forEach((follower) => {
            const followerInfo = createFollowerInfoElement(follower);
            followersDiv.appendChild(followerInfo);
          });
        }
  
        // Display following
        if (data.following.length === 0) {
          const noFollowingMessage = document.createElement("p");
          noFollowingMessage.textContent = "Not following anyone yet.";
          followingDiv.appendChild(noFollowingMessage);
        } else {
          // Loop through the following and populate the followingDiv
          data.following.forEach((following) => {
            const followingInfo = createFollowerInfoElement(following);
            followingDiv.appendChild(followingInfo);
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  

function createFollowerInfoElement(user) {
  const followerInfoElement = document.createElement("div");
  followerInfoElement.classList.add("followerinfo");

  const followerImgElement = document.createElement("div");
  followerImgElement.classList.add("followerimg");
  const imgElement = document.createElement("img");
  imgElement.src = user.profileImage; // Update with actual property
  imgElement.alt = `${user.username}'s Profile Image`;
  followerImgElement.appendChild(imgElement);

  const followerUsernameElement = document.createElement("div");
  followerUsernameElement.classList.add("followerusername");
   const usernameElement = document.createElement("h4");
  usernameElement.setAttribute("followID", user._id);
  usernameElement.textContent = user.username;
  const nameElement = document.createElement("h5");
  nameElement.textContent = user.name;
  followerUsernameElement.appendChild(usernameElement);
  followerUsernameElement.appendChild(nameElement);

  followerInfoElement.appendChild(followerImgElement);
  followerInfoElement.appendChild(followerUsernameElement);
  usernameElement.addEventListener("click", (event) => {
     followId = event.target.getAttribute("followID"); // Retrieve the user's ID
    // console.log(followId, "follow IDDD");
    window.location = `/userprofile/${followId}`;
    if (followId === loggedinUserId) {
        window.location.href = `/profile`; // Redirect to the logged-in user's profile
    } else {
        window.location.href = `/userprofile/${followId}`;
    }
    // Now you can use the followId to perform actions related to that user
  });


  return followerInfoElement;
  
  
}





///////////////////////////**********************////////////////////////////****************************//////////////////////////////
///////////////////////////**********************END OF FOLLOWING FOLLOWERS SCRIPT****************************//////////////////////////////
///////////////////////////**********************////////////////////////////****************************//////////////////////////////
