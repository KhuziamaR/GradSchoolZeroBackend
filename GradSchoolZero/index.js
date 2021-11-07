const express = require("express");
const app = express();

// app.use((req, res) => {
//   console.log("Someone sent a request");
//   res.send("HELLO WE GOT UR REQUEST");
// });

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
  users[req.params.type].map((user) => {
    if (
      user.username == req.params.username &&
      user.password == req.params.password
    ) {
      res.status(200).send({
        auth: true,
      });
    }
  });
  res.status(200).send({
    auth: false,
  });
});

app.get("/", (req, res) => {
  res.send(
    "SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type"
  );
});
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
