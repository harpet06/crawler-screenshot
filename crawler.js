const cheerio = require("cheerio");
const parse = require("url-parse");
const puppeteer = require("puppeteer");
const shuffle = require("shuffle-array");

let baseUrl = "";
const maxPagesToVisit = 5;

const pagesVisited = {};
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

const takeScreenshot = async (pageLink, statusCode) => {
  let urlPath = parse(pageLink);
  urlPath = urlPath.pathname;
  urlPath = urlPath.replace(/\\|\//g, "");

  await page.screenshot({
    path: `./images/page-${urlPath}-status-${statusCode}.png`,
    type: "png",
    fullPage: true
  });
};

const getLinks = $ => {
  const relativeLinks = $("a[href^='/']");
  console.log(
    `Found ${relativeLinks.length} relative links and ${absoluteLinks.length} absolute links`
  );

  const absoluteLinks = $(`a[href^='${baseUrl}']`);

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
    const response = await page.goto(pageLink);
    if (response.status() !== 200) {
      console.log("..do something extra");
      await takeScreenshot(pageLink, response.status());
    }
    pagesVisited[pageLink] = response.status();
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

  pagesToVisit = shuffle(pagesToVisit);
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
