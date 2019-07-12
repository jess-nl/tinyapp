const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;

const bcrypt = require('bcrypt');

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

// Initial Tiny URLs database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

// Initial users database
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

// Generate random characters for Tiny URLs & unique user IDs
const generateRandomString = function() {
  let randomCharacters = '';
  let char = '0123456789abcdefghijklmnopqrstuvwxyz';
  
  for (let i = 0; i < 6; i++) {
    randomCharacters += char.charAt(Math.random() * char.length);
  }
  return randomCharacters;
};

// Returns URLs where the userID of urlDatabase() is equal to the id of the currently logged in user of users(), passed into templateVars
const urlsForUser = function(id) {
  let userAthenticate = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userAthenticate[key] = urlDatabase[key];
    }
  }
  return userAthenticate;
}

// ====================================================
// ====================== JSON ========================
// ====================================================

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ====================================================
// ============== Registration route ==================
// ====================================================

// Registration landing
app.get('/registration', function (req, res) {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_registration", templateVars);
});

// Add new user's email & password in database
app.post("/registration", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    res.status(403).end();
  } else {
    // Looking through each user
    for (const user in users) {

      // Check if email entry is already taken
      if (email === users[user].email) {
        console.log("Email already taken");
        res.status(403).end();
      }
    }

    // Log new user
    console.log("Created new user!");

    // Generate unique user ID & add it to user database
    let newId = `user${generateRandomString()}RandomID`;
    const newUser = { id: newId, email, hashedPassword };
    users[newId] = newUser;

    // Generate cookie
    res.cookie('user_id', newId);

    // Redirect
    res.redirect('/urls');
  }

  // Log user database
  console.log("User database:", users);
});

// ====================================================
// =================== Login route ====================
// ====================================================

// Login landing
app.get('/login', function (req, res) {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]], urls: urlsForUser(req.cookies["user_id"]) };
  res.render("urls_login", templateVars);
});

// Login existing user with email & password
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

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
      // if (password === currentUser.password) {
      if (bcrypt.compareSync(currentUser.password, hashedPassword)) {
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
  // Assign to error page
  res.status(403).end();
});

// Logout route
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// ====================================================
// ============ Tiny URL main page route ==============
// ====================================================

// Landing on main page
app.get("/urls", (req, res) => {

  let templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

// ====================================================
// ============ Tiny URL (create) route ===============
// ====================================================

// Landing on page to create Tiny URL. Only accessible when logged in.
app.get("/urls/new", (req, res) => {
  if (req.cookies['user_id']) {
    let templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// Generate Tiny URLs and list them on main page
app.post("/urls", (req, res) => {
  // Log URL database
  console.log("urlDatabase:", urlDatabase);

  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = {};
  urlDatabase[shortUrl].longURL = req.body.longURL;
  urlDatabase[shortUrl].userID = req.cookies["user_id"];

  res.redirect(`/urls/${shortUrl}`);
});

// ====================================================
// ====== Tiny URL's ID route (once created) ==========
// ====================================================

// Displays Tiny URL if it's associated to current logged in user (can update it too).
app.get("/urls/:shortURL", (req, res) => {

  if (urlDatabase[req.params.shortURL].userID !== req.cookies["user_id"]) {
    res.redirect('/login');
  }

  let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]], urls : urlDatabase};
  res.render("urls_show", templateVars);
});

// ====================================================
// ===== Tiny URL (directs to requested URL page) =====
// ====================================================

// Directs to requested URL page of long version of URL (ex. www.google.com)
app.get("/u/:shortURL", (req, res) => {
  const {longURL} = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// ====================================================
// ============== Tiny URL (edit) route ===============
// ====================================================

// Edit Tiny URL from database or after the creation of a new Tiny URL
app.post('/urls/:id', (req, res) => {
  const { id } = req.params;

  if (!req.cookies['user_id']) {
    res.redirect('/login');
  }

  urlDatabase[id] = {longURL: req.body.longURL, userID: req.cookies['user_id']};

  res.redirect('/urls');
});

// ====================================================
// ============= Tiny URL (delete) route ==============
// ====================================================

// Delete Tiny URL
app.post('/urls/:id/delete', (req, res) => {
  const { id } = req.params;
  delete urlDatabase[id];

  res.redirect('/urls');
});