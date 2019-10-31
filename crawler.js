const cheerio = require("cheerio");
const URL = require("url-parse");
const puppeteer = require("puppeteer");

let baseUrl = "https://jestjs.io/docs/en/getting-started";
const maxPagesToVisit = 15;

let pagesVisited = {};
let numPagesVisited = 0;
let pagesToVisit = [];
let url = new URL(baseUrl);
let browser;
let page;
baseUrl = `${url.protocol}//${url.hostname}`;


const crawl = async () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log("Reached max limit of number of pages to visit.");
    await browser.close();
    return;
  }
  let nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    crawl();
  } else {
    visitPage(nextPage, crawl);
  }
};

const visitPage = async url => {
  pagesVisited[url] = true;
  numPagesVisited++;

  if (url) {
    const response = await page.goto(url);
    console.log(
      `Visiting Page: ${url}, page has a status code of ${response.status()}`
    );
    const body = await page.content();
    let $ = cheerio.load(body);
    collectInternalLinks($);
    crawl();
  } else {
    console.log("No Links Found");
    await browser.close();
  }
};

const collectInternalLinks = $ => {
  let relativeLinks = $("a[href^='/']");
  console.log("Found " + relativeLinks.length + " relative links on page");

  relativeLinks.each(function() {
    pagesToVisit.push(baseUrl + $(this).attr("href"));
  });
};

(async () => {
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    slowMo: 250,
    ignoreHTTPSErrors: true,
    headless: false
  });
  page = await browser.newPage();
  pagesToVisit.push(baseUrl);
  crawl();
})();
