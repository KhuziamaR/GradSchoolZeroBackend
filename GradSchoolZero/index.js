const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const classes = [
  {
    name: "Theoretical Computer Science",
    id: "29jjd2120",
    professorID: "291839",
  },
  {
    name: "Paradigms",
    id: "29jjd2asda",
    professorID: "92310",
  },
];

const professors = [
  {
    name: "Douglas Troeger",
    professorID: "92310",
  },
  {
    name: "Steph Lucci",
    professorID: "291839",
  },
];

const users = {
  student: [
    {
      username: "John",
      password: "123456",
    },
    {
      username: "Khuziama",
      password: "123456",
    },
    {
      username: "Timmy",
      password: "123456",
    },
    {
      username: "Uzma",
      password: "123456",
    },
  ],
  professor: [
    {
      username: "troeger",
      password: "123456",
    },
    {
      username: "lucci",
      password: "123456",
    },
    {
      username: "admin",
      password: "123456",
    },
  ],
  admin: [
    {
      username: "admin",
      password: "123456",
    },
  ],
};

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
});
