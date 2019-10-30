const request = require("request");
const cheerio = require("cheerio");
const URL = require("url-parse");

let baseUrl = "https://www.bbc.co.uk";
const maxPagesToVisit = 3;

let pagesVisited = {};
let numPagesVisited = 0;
let pagesToVisit = [];
let url = new URL(baseUrl);
baseUrl = url.protocol + "//" + url.hostname;

const crawl = () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
};

const visitPage = (url, callback) => {
  pagesVisited[url] = true;
  numPagesVisited++;

  if (url) {
    request(url, function(error, response, body) {
      console.log(
        `Visiting Page: ${url}, page has a status code of ${response.statusCode}`
      );
      if (response.statusCode !== 200) {
        callback();
        return;
      }

      var $ = cheerio.load(body);

      collectInternalLinks($);
      callback();
    });
  } else {
    console.log("No Links Found");
  }
};

const collectInternalLinks = $ => {
  var relativeLinks = $("a[href^='/']");
  console.log("Found " + relativeLinks.length + " relative links on page");

  relativeLinks.each(function() {
    pagesToVisit.push(baseUrl + $(this).attr("href"));
  });
};

pagesToVisit.push(baseUrl);
crawl();
