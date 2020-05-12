const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");


const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};



app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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