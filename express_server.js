const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

// Listen to PORT on 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// ====================================================
// ==================== Databases =====================
// ====================================================

// Database for the creation of all URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Store our users
const users = { 
  "user1RandomID": {
    id: "user1RandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// ====================================================
// ================ Global functions ==================
// ====================================================

// Generate random characters for short URL
const generateRandomString = function() {
  let randomCharacters = '';
  let char = '0123456789abcdefghijklmnopqrstuvwxyz';
  
  for (let i = 0; i < 6; i++) {
    randomCharacters += char.charAt(Math.random() * char.length);
  }
  return randomCharacters;
};

// ====================================================
// ===================== Routing ======================
// ====================================================

// Landing on index page, prints "Hello"
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Convert to JSON string
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Landing on /hello page, prints "Hello World"
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Landing on /urls/new, displays template of urls_new.ejs
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

// Generate short URL based on generateRandomString() function, then redirect.
app.post("/urls", (req, res) => {
  // Log the POST request body to the console
  console.log(req.body);

  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  console.log("urlDatabase:", urlDatabase);

  // Redirects to /urls/:shortURL
  res.redirect(`/urls/${shortUrl}`);
});

// Landing on /urls
app.get("/urls", (req, res) => {
  
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

// Directs to page and displays a short URL link
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

// Directs to page of actual/long version of URL ex. www.google.com
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log("longURL:", longURL);
  res.redirect(longURL);
});

// Delete short URL from database
app.post('/urls/:id/delete', (req, res) => {
  const { id } = req.params;

  delete urlDatabase[id];

  res.redirect('/urls');
});

// Edit short URL from database or after the creation of a new short URL
app.post('/urls/:id', (req, res) => {
  const { id } = req.params;

  urlDatabase[id] = req.body.longURL;
  console.log("req.body: ", req.body)

  res.redirect('/urls');
});

// ===================== Register =====================

// Registration landing
app.get('/registration', function (req, res) {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_registration", templateVars);
});

// Add new user's email & password in database
app.post("/registration", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  console.log("User's email:", req.body.email);
  console.log("User's password:", req.body.password);

  if (email === "" || password === "") {
    res.status(403).end();
  } else {
    // Looking through each users
    for (const user in users) {

      // Check if current email is already taken
      if (email === users[user].email) {
        console.log("Email already taken");
        res.status(403).end();
      }
    }

    // Log new user
    console.log("Created new user!");

    // Generate unique user ID & add it to user database
    let newId = `user${generateRandomString()}RandomID`;
    const newUser = { id: newId, email, password };
    users[newId] = newUser;

    // Generate cookie
    res.cookie('user_id', newId);

    // Redirect
    res.redirect('/urls');
  }

  // Log user database
  console.log("User database:", users);
});

// ===================== Login =====================

// Login landing
app.get('/login', function (req, res) {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});


// Login existing user with email & password
app.post("/login", (req, res) => {
  // Log the POST request body to the console
  let email = req.body.email;
  let password = req.body.password;
  console.log("User's email:", req.body.email);
  console.log("User's password:", req.body.password);

  // If email and password inputs are left blank
  if (email === "" || password === "") {
    // Assign to error page
    res.status(403).end();
  }

  let currentUser;
  for (const key in users) {
    // If email already exists
    if (email === users[key].email) {
      currentUser = users[key];
      // If password already exists
      if (password === currentUser.password) {
        // Generate cookie
        res.cookie('user_id', currentUser.id);
        // Redirect to main page
        res.redirect('/urls');
      } else {
        console.log("Email and password not in system, must register!");
        // Assign to error page
        res.status(403).end();
      }
    }
  }
  console.log('Wrong email or password! Must submit the right information or register!');
  // Assign to error page
  res.status(403).end();
});

// Logout route
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});