const express = require("express");
const crawl = require("./crawler");
const app = express();
const port = 3000;
const fs = require("fs");
var path = require("path");

app.get("/", (req, res) => res.send("Hello World!"));

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

app.post("/crawl2", async (req, res) => {
  const generateResult = await crawl.runCrawl();
  const cleanPath = generateResult.slice(2);

  try {
    if (fs.existsSync(path.join(__dirname + cleanPath))) {
      const reportResultRaw = fs.readFileSync(
        path.join(__dirname + cleanPath),
        { encoding: "UTF-8" }
      );
      // const reportResult = JSON.parse(reportResultRaw);
      res.send(JSON.parse(reportResultRaw));
    }
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}`));
