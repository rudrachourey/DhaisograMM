const io = require('socket.io')();
const socketapi = {
    io: io
};


const users = {};

// Run when client connectsw
io.on('connection', (socket) => {
    console.log('A User Connected')
    
  
  
  
       /////////////////PRIVATE CHAT //////////////////////
 socket.on('register', function (user) {

  users[user._id] = socket.id;
  console.log(user)
   console.log(`User ${user.username} connected with socket ID ${socket.id}`);

   console.log(users[user._id],user._id, 'ccccccccccccc')
   console.log('user register')
 });

// Maintain a dictionary of users that a particular user is currently chatting with


  // Handle incoming messages
 socket.on("pmessage", (data) => {
   const { user, to, message } = data;
   console.log(data)
   console.log( to,users[to],"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
   const recipientSocketId = users[to];

   // Join the new private room

console.log(`${user.username} joined private chat with ${to}`);

   console.log(recipientSocketId,'send private message too')
   // Send the message to the recipient
   io.to(recipientSocketId).emit("pmessage", ({id:user._id,text: message,time:' 47:345'}));
 });

 
 socket.on("sex", (data) => {
  // const { user, to, message } = data;
  console.log(data)
 })

 } );


 module.exports = socketapi;