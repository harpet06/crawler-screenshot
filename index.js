const express = require("express");
const crawl = require("./crawler");
const app = express();
const port = 3000;
const fs = require("fs");
var path = require("path");

app.get("/", (req, res) => res.send("Hello World!"));

app.post(
  "/crawl/:url/:maxPagesToVisit/:randomCrawl/:stickToBaseUrl",
  async (req, res) => {
    let url = req.params.url;
    let maxPagesToVisit = req.params.maxPagesToVisit;
    let randomCrawl = req.params.randomCrawl;
    let stickToBaseUrl = req.params.stickToBaseUrl;

    let generateResult = await crawl.runCrawl(
      url,
      maxPagesToVisit,
      randomCrawl,
      stickToBaseUrl
    );
    let cleanPath = generateResult.slice(2);

    try {
      if (fs.existsSync(path.join(__dirname + cleanPath))) {
        const reportResultRaw = fs.readFileSync(
          path.join(__dirname + cleanPath),
          { encoding: "UTF-8" }
        );

        res.send(JSON.parse(reportResultRaw));
      }
    } catch (err) {
      console.error(err);
    }
  }
);

app.listen(port, () => console.log(`Ready to crawl on port: ${port}`));
