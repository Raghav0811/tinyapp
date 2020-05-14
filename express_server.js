const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require ('bcrypt');
const { urlDatabase, users } = require('./database/userDB.js');




const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};

const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
};


app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("urls", (req, res) => {
  console.log(req.body);
  res.send("OK");
  res.redirect(`/urls/${shortURL}`);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL)
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});




// /u/:shortURL -- access the actual link (longURL)
app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  res.redirect(longURL);
});


app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    let templateVars = {
      status: 401,
      message: 'You are not allowed to delete that TinyURL',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user :users[req.session.user_id]
  };
  if (templateVars.user) {
    res.redirect ('/urls');
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
    res.cookie('userEmail', email);
    res.redirect("/urls");
  }
});

//REGISTER

app.get("/register", (req, res) => {
  let userId = req.session.user_id;
  if(userId){
    res.redirect('/urls');
  } else {
    res.render("register");
  }
});


 app.post("/register", (req, res) => {
   const { email, password } = req.body;
   if (!email || !password) {
    let templateVars = {
      status: 401,
      message: 'Your Email and/or password is incorrect.',
      user: users[req.session.user_id]
    }
    res.status(401);
    res.render("urls_error", templateVars);
    ('Email and/or password missing');
  } else if (getUserByEmail(email, users)) {
    let templateVars = {
      status: 409,
      message: 'An account with this password already exists ',
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