const express = require("express");
const app = express();

app.use((req, res) => {
  console.log("Someone sent a request");
  res.send("HELLO WE GOT UR REQUEST");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
