const cheerio = require("cheerio");
const parse = require("url-parse");
const puppeteer = require("puppeteer");
const shuffle = require("shuffle-array");
const config = require("./config/index");
const health = require("./src/health");

let baseUrl = config.baseUrl;
const maxPagesToVisit = config.maxPagesToVisit;

const pagesVisited = [];
let numPagesVisited = 0;
let pagesToVisit = [];
const url = parse(baseUrl);
let browser;
let page;

if (url.pathname === "") {
  baseUrl = `${url.protocol}//${url.hostname}`;
} else {
  baseUrl = `${url.href}`;
}

const getLinks = $ => {
  const relativeLinks = $("a[href^='/']");

  console.log(`Found ${relativeLinks.length} relative links`);

  const absoluteLinks = $(`a[href^='${baseUrl}']`);
  console.log(`${absoluteLinks.length} is this long`);

  absoluteLinks.each(function() {
    pagesToVisit.push($(this).attr("href"));
  });

  relativeLinks.each(function() {
    baseUrl = `${url.protocol}//${url.hostname}`;
    pagesToVisit.push(baseUrl + $(this).attr("href"));
  });
};

const visitPage = async pageLink => {
  numPagesVisited += 1;

  if (pageLink) {
    const response = await health.getHealth(page, pageLink);

    pageDetail = {
      url: pageLink,
      statusCode: response.statusCode,
      loadTime: response.pageLoadTime,
      healthy: response.healthy
    };
    pagesVisited.push(pageDetail);
    const body = await page.content();
    const $ = cheerio.load(body);
    getLinks($);
    crawl();
  } else {
    console.log("No Links Found OR found all links");
    console.log(pagesVisited);
    await browser.close();
  }
};

const crawl = async () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log("Reached max limit of number of pages to visit.");
    await browser.close();
    console.log(pagesVisited);
    return;
  }

  if (config.randomCrawl) {
    pagesToVisit = shuffle(pagesToVisit);
  }

  const nextPage = pagesToVisit.pop();

  if (nextPage in pagesVisited) {
    // this seems inefficient..
    crawl();
  } else {
    visitPage(nextPage);
  }
};

(async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
  pagesToVisit.push(baseUrl);
  crawl();
})();
