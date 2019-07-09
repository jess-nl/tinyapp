const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// Listen to PORT on 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Database for the creation of all URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Generate random characters for short URL
function generateRandomString() {
  let randomCharacters = '';
  let char = '0123456789abcdefghijklmnopqrstuvwxyz';
  
  for (let i = 0; i < 6; i++) {
    randomCharacters += char.charAt(Math.random() * char.length);
  }
  return randomCharacters;
}

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
  res.render("urls_new");
});

// Generate short URL based on the function generateRandomString(), then redirect.
app.post("/urls", (req, res) => {
  // Log the POST request body to the console
  console.log(req.body);
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  console.log("urlDatabase:", urlDatabase);

  // Redirects to /urls/:shortURL
  res.redirect(`/urls/${shortUrl}`);
});

// Landing on /urls, displays list of all short URLS. Uses the urls_index.ejs template
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Directs to page and displays a short URL link
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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