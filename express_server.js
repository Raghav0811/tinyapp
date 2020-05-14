const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser, addUser, addURL } = require('./helperfuncs');
const { urlDatabase, users } = require('./database/userDB.js');

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: 'session',
    keys: ['e1d50c4f-538a-4682-89f4-c002f10a59c8', '2d310699-67d3-4b26-a3a4-1dbf2b67be5c'],
  })
);

app.set("view engine", "ejs");

// ROUTES

// / => homepage
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// /URLS => list of all of the user's URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    let templateVars = {
      status: 401,
      message: 'You need to be logged in to perform that action',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  } else {
    const longURL = req.body.longURL;
    const userID = req.session.user_id;
    const shortURL = addURL(longURL, userID, urlDatabase);
    res.redirect(`/urls/${shortURL}`);
  }
});

// /URLS/NEW => page to create a shortURL
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

// /URLS/:SHORTURL => page of the specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    let templateVars = {
      status: 404,
      message: 'This TinyURL does not exist',
      user: users[req.session.user_id]
    }
    res.status(404);
    res.render("urls_error", templateVars);
  }
  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    urls: urlDatabase,
  };
  if (req.session.user_id === urlDatabase[templateVars.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    let templateVars = {
      status: 401,
      message: 'This TinyURL does not belong to you',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const newDate = new Date();
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    urlDatabase[shortURL].visitCount = 0;
    urlDatabase[shortURL].visitHistory = [];
    urlDatabase[shortURL].uVisitCount = 0;
    urlDatabase[shortURL].visitorIDList = [];
    urlDatabase[shortURL].dateCreation = newDate;
    res.redirect(`/urls/${shortURL}`);
  } else {
    let templateVars = {
      status: 401,
      message: 'You are not allowed to edit that TinyURL',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

// /URLS/:SHORTURL/DELETE
app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    let templateVars = {
      status: 401,
      message: 'Not allowed to delete TinyURL',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

// /U/:SHORTURL => access the actual link (longURL)
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const dateVisit = new Date();
  if (!urlDatabase[shortURL]) {
    let templateVars = {
      status: 404,
      message: 'TinyURL does not exist',
      user: users[req.session.user_id]
    }
    res.status(404);
    res.render("urls_error", templateVars);
  } else if (!req.session.user_id) { 
    req.session.user_id = generateRandomString();
    urlDatabase[shortURL].visitHistory.push([dateVisit,req.session.user_id]);
    urlDatabase[shortURL].visitCount++;
    urlDatabase[shortURL].visitorIDList.push(req.session.user_id);
    urlDatabase[shortURL].uVisitCount++;
  } else {
    const visitorId = urlDatabase[shortURL].visitorIDList;
    urlDatabase[shortURL].visitHistory.push([dateVisit,req.session.user_id]);
    urlDatabase[shortURL].visitCount++;
    if (!visitorId.includes(req.session.user_id)) {
      visitorId.push(req.session.user_id);
      urlDatabase[shortURL].uVisitCount++;
    }
  }
  if (longURL.startsWith("http://")) {
    res.redirect(longURL);
  } else {
    res.redirect(`http://${longURL}`);
  }
});

// /LOGIN
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    let templateVars = {
      status: 401,
      message: 'Email not found',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  } else if (!bcrypt.compareSync(password, user.password)) {
    let templateVars = {
      status: 401,
      message: 'Password incorrect',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  } else {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

// /LOGOUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// /REGISTER
app.get("/register", (req,res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    let templateVars = {
      status: 401,
      message: 'Email and/or password missing',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
    ('Email and/or password missing');
  } else if (getUserByEmail(email, users)) {
    let templateVars = {
      status: 409,
      message: 'This email has already been registered',
      user: users[req.session.user_id]
    }
    res.status(409);
    res.render("urls_error", templateVars);
  } else {
    const user_id = addUser(email, password, users);
    req.session.user_id = user_id;
    res.redirect("/urls");
  }
});

