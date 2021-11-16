require("dotenv").config();
const express = require("express");
const app = express();
const {DatabaseClient} = require("./Database.js")

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/classes", (req, res) => {
  res.status(200).send(classes);
});

app.get("/professors", (req, res) => {
  res.status(200).send(professors);
});

app.get("/signin/:username/:password/:type", (req, res) => {
  const { username } = req.params;
  const { password } = req.params;
  const { type } = req.params;

  const user = users[type].find(
    (user) => user.username == username && user.password == password
  );

  if (user) {
    res.status(200).send({
      auth: true,
    });
  } else {
    res.status(200).send({
      auth: false,
    });
  }
});

app.post("/signup", (req, res) => {
  const { username } = req.query;
  const { password } = req.query;
  const { type } = req.query;

  const user = users[type].find((user) => user.username == username);

  if (user) {
    console.log("ERROR USER EXISTS");
    res.status(200).send({
      msg: "Error! User Already Exists",
      auth: false,
    });
  } else {
    users[type].push({
      username: username,
      password: password,
    });
    console.log("CREATED USER WITH ", req.query);
    res.status(200).send({
      msg: "User Created Successfully",
      auth: true,
    });
  }
});

app.get("/", (req, res) => {
  res.send(
    "SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type"
  );
});
app.listen(3000, () => {
  console.log("Listening on port 3000");
  const cli = new DatabaseClient();
  cli.connect()
});
