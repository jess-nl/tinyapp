const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const { getUserByEmail } = require('./helper');
const PORT = 8080;
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express());
app.use(cookieSession({
  name: 'session',
  keys: ['PeterPiperPickedAPeckOfPickledPeppers', 'WeAllKnowTwoCuteRatsAreBetterThanOne']
}));

// Listen to PORT on 8080
app.listen(PORT, () => {
});

// ====================================================
// ==================== Databases =====================
// ====================================================

// Initial Tiny URLs database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

// Initial users' passwords in hash form
const passwordForUser1 = bcrypt.hashSync('purple-monkey-dinosaur', saltRounds);
const passwordForUser2 = bcrypt.hashSync('dishwasher-funk', saltRounds);

// Initial users database
const users = {
  "user1RandomID": {
    id: "user1RandomID",
    email: "user@example.com",
    password: passwordForUser1
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: passwordForUser2
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

// Returns URLs to its associated user. This is passed into templateVars.
const urlsForUser = function(id) {
  let userAuthenticate = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userAuthenticate[key] = urlDatabase[key];
    }
  }
  return userAuthenticate;
};

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
app.get('/register', function(req, res) {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  res.render("urls_registration", templateVars);
});

// Add new user's email & password in database & generate new cookie.
// If blank or already existing email/password, redirect.
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let currentUser = getUserByEmail(email, users);

  if (!req.session.user_id) {
    if (email === "" || password === "") {
      res.redirect('/404');
    } else if (currentUser) {
      res.redirect('/404');
    } else {
      // Generate unique user ID & add it to user database
      let newId = `user${generateRandomString()}RandomID`;
      const newUser = { id: newId, email, password: hashedPassword };
      users[newId] = newUser;

      req.session.user_id = newId;
      res.redirect('/urls');
    }
  } else {
    res.redirect('/404');
  }
});

// ====================================================
// =================== Login route ====================
// ====================================================

// Login landing
app.get('/login', function(req, res) {

  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id], urls: urlsForUser(req.session.user_id) };

  res.render("urls_login", templateVars);
});

// Login existing user with email & password
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // If email & password already exists, generate cookie. Otherwise assign error page
  let currentUser = getUserByEmail(email, users);

  if (!req.session.user_id) {
    if (!(email === "") || !(password === "")) {
      if (currentUser) {
        if (bcrypt.compareSync(password, currentUser.password)) {
          req.session.user_id = currentUser.id;
          res.redirect('/urls');
        } else {
          res.redirect('/404');
        }
      } else {
        res.redirect('/404');
      }
    } else {
      res.redirect('/404');
    }
  } else {
    res.redirect('/404');
  }
});

// ====================================================
// =================== Logout route ===================
// ====================================================

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// ====================================================
// ============ Tiny URL main page route ==============
// ====================================================

// Landing on main page
app.get("/urls", (req, res) => {

  let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id]};
  if (req.session.user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

// ====================================================
// ============ Tiny URL route (create) ===============
// ====================================================

// Landing on page to create Tiny URL. Only accessible when logged in.
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };

  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// Generate Tiny URLs and list them on main page
app.post("/urls", (req, res) => {
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = {};
  urlDatabase[shortUrl].longURL = req.body.longURL;
  urlDatabase[shortUrl].userID = req.session.user_id;

  res.redirect(`/urls/${shortUrl}`);
});

// ====================================================
// ====== Tiny URL's ID route (once created) ==========
// ====================================================

// Displays Tiny URL if it's associated to current logged in user (can update it too).
app.get("/urls/:shortURL", (req, res) => {

  if (urlDatabase[req.params.shortURL]) {
    let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id], urls : urlDatabase};
    if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
      res.redirect('/login');
    } else {
      res.render("urls_show", templateVars);
    }
  } else {
    res.redirect('/404');
  }
});

// ====================================================
// ===== Tiny URL (directs to requested URL page) =====
// ====================================================

// Directs to requested URL page of long version of URL (ex. www.google.com)
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const {longURL} = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  } else {
    res.redirect('/404');
  }
});

// ====================================================
// ============== Tiny URL route (edit) ===============
// ====================================================

// Edit Tiny URL from database or after the creation of a new Tiny URL
app.post('/urls/:id', (req, res) => {
  const { id } = req.params;
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.session.user_id};

  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// ====================================================
// ============= Tiny URL route (delete) ==============
// ====================================================

// Delete Tiny URL
app.post('/urls/:id/delete', (req, res) => {
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect('/urls');
});

// ====================================================
// ================= 404 error page ===================
// ====================================================

// 404 error page landing
app.get('/404', function(req, res) {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  res.render("urls_404", templateVars);
});