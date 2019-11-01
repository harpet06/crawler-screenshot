const cheerio = require("cheerio");
const parse = require("url-parse");
const puppeteer = require("puppeteer");

let baseUrl = "http://kettlebell-coders-app.s3-website-eu-west-1.amazonaws.com";
const maxPagesToVisit = 8;

let pagesVisited = {};
let numPagesVisited = 0;
let pagesToVisit = [];
let url = new parse(baseUrl);
let browser;
let page;
baseUrl = `${url.protocol}//${url.hostname}`;

const crawl = async () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log("Reached max limit of number of pages to visit.");
    await browser.close();
    console.log(pagesVisited);
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
  numPagesVisited++;
  if (url) {
    const response = await page.goto(url);
    if (response.status() !== 200) {
      console.log("..do something extra");
      await takeScreenshot(url, response.status());
    }
    pagesVisited[url] = response.status();
    const body = await page.content();
    let $ = cheerio.load(body);
    collectInternalLinks($);
    crawl();
  } else {
    console.log("No Links Found OR found all links");
    console.log(pagesVisited);
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

const takeScreenshot = async (url, statusCode) => {
  let urlPath = parse(url);
  urlPath = urlPath.pathname;
  urlPath = urlPath.replace(/\\|\//g, "");

  await page.screenshot({
    path: `./images/page-${urlPath}-status-${statusCode}.png`,
    type: "png",
    fullPage: true
  });
};

(async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
  pagesToVisit.push(baseUrl);
  crawl();
})();
