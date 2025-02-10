// Building the API structure 
const express = require('express'); // fundamental framework for building web applications and APIs in Node.js: It provides tools for handling requests, defining routes (URLs), and much more.
const app = express();
// Handling cross-origin requests
const cors = require('cors'); // helps control which websites (origins) are allowed to make requests to the backend API 
// Working with the database
const mongoose = require('mongoose'); 
const database=require('./models/Db'); // imports the connect function which was exported in Db.js
const User = require('./models/User'); // imports the UserModel which was exported from User.js
const Post = require('./models/Post'); 
// Password security
const bcrypt = require('bcryptjs'); // library for password hashing: securely hash passwords before storing them in the database
// User authentication
const jwt = require('jsonwebtoken'); // authentication and authorization: standard way to securely transmit information between parties as a JSON object
const cookieParser = require('cookie-parser'); // Cookies are small pieces of data that websites can store in a user's web browser: to store JWTs for user authentication
// const secret = 'Secret-Service'; // Define your secret key here
// File uploads
const multer = require('multer'); // handling file uploads (middleware): uploads a cover image for a blog post
const uploadMiddleware = multer({ dest: 'uploads/' }); // Creates a multer middleware instance: tells multer to store uploaded files in the uploads folder
const fs = require('fs'); // File System: working with the file system

// Middleware Setup
app.use(cors({credentials:true, origin:'http://localhost:3000'})); // allows requests only from origin; allows sending cookies, authentication tokens, or sessions across origins
app.use(express.json()); // automatically converts that JSON data into a JavaScript object that you can easily access in your route handlers (using req.body)
app.use(cookieParser()); // parses cookies attached to incoming requests and makes them easily accessible in your route handlers (using req.cookies)
app.use('/uploads', express.static(__dirname + '/uploads')); // access image.jpg in 'uploads' folder using URL like http://localhost:4000/uploads/image.jpg
database.connect(); // calls the connect() function imported from ./models/Db.js

// API Endpoints: specific URL that allows a client to access the functionality and data of an API
// req: Request headers, parameters, body, and other information sent by the client
// res: Response headers, data, and other information sent by the server (HTTP status code)
// await: keyword in JavaScript is used inside an 'async' function to pause the execution of the function until a Promise is resolved
// Mongoose models provide methods like create(), find(), findById(), update(), delete() to interact with the database collection for that model ('users' in this case).  User.create() is used to insert a new document into the 'users' collection.

app.post('/register', async (req, res) => { // async keyword: operations that might take some time to complete (like database queries) (does not disrupt main thread)
  const {username, password} = req.body;
  try {
    const salt = bcrypt.genSaltSync(10); // string of random data that is added to a password before it is hashed
    const userDoc = await User.create({ // await pauses the execution of the async function until the User.create() operation is complete
      username,
      password: bcrypt.hashSync(password, salt), // hash the password.
    });
    res.json(userDoc); // If user registration is successful, send back the information about the newly created user as a JSON response to the frontend (widely used data format for transferring data between a server and a web application (performance is high and efficient))
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req, res) => {
  const {username, password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password); // verifies if the provided password matches the hashed password stored in the database
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => { // generate a JWT that contains the username and user ID
      if (err) throw err;
      res.cookie('token', token).json({ // Store this JWT in a cookie named 'token' in the user's browser
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

// Getting the profile information of the currently logged-in use
app.get('/profile', (req, res) => {
  const {token} = req.cookies; // retrieves the token cookie from the request
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok'); // removes the authentication token from the browser
});

// Create new Blog Post
app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  // renaming the uploaded file
  const {originalname, path} = req.file;
  const parts = originalname.split('.'); // org name
  const ext = parts[parts.length - 1]; // its extension
  const newPath = path + '.' + ext; // appends both
  fs.renameSync(path, newPath); // important because multer might store files with no extension initially

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => { // *Author Authentication: only logged-in users can create posts
    if (err) throw err;
    const {title, summary, content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:newPath, // uploaded cover image
      author:info.id // unique id 
    });
    res.json(postDoc); // Sends back the newly created postDoc in a JSON response
  });

});

// Update an existing blog post (POST => creates new) (PUT => updates/replaces existing)
app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {id, title, summary, content} = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json('you are not the author');
    }
    await postDoc.update({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
  });

});

// retrieves a list of the 20 newest blog posts from the database, efficiently including only the usernames of the authors
app.get('/post', async (req, res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1}) // newest posts first
      .limit(20) // only fetch the first 20 newest posts
  );
});

// retrieve a single blog post by its ID
app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})

app.listen(4000);
