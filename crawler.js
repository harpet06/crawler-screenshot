const cheerio = require('cheerio');
const parse = require('url-parse');
const puppeteer = require('puppeteer');

let baseUrl = 'http://kettlebell-coders-app.s3-website-eu-west-1.amazonaws.com';
const maxPagesToVisit = 8;

const pagesVisited = {};
let numPagesVisited = 0;
const pagesToVisit = [];
const url = parse(baseUrl);
let browser;
let page;
baseUrl = `${url.protocol}//${url.hostname}`;

const takeScreenshot = async (pageLink, statusCode) => {
  let urlPath = parse(pageLink);
  urlPath = urlPath.pathname;
  urlPath = urlPath.replace(/\\|\//g, '');

  await page.screenshot({
    path: `./images/page-${urlPath}-status-${statusCode}.png`,
    type: 'png',
    fullPage: true,
  });
};


const collectInternalLinks = ($) => {
  const relativeLinks = $("a[href^='/']");
  console.log(`Found ${relativeLinks.length} relative links on page`);

  relativeLinks.each(function () {
    pagesToVisit.push(baseUrl + $(this).attr('href'));
  });
};

const visitPage = async (pageLink) => {
  numPagesVisited += 1;
  if (pageLink) {
    const response = await page.goto(pageLink);
    if (response.status() !== 200) {
      console.log('..do something extra');
      await takeScreenshot(pageLink, response.status());
    }
    pagesVisited[pageLink] = response.status();
    const body = await page.content();
    const $ = cheerio.load(body);
    collectInternalLinks($);
    crawl();
  } else {
    console.log('No Links Found OR found all links');
    console.log(pagesVisited);
    await browser.close();
  }
};


const crawl = async () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log('Reached max limit of number of pages to visit.');
    await browser.close();
    console.log(pagesVisited);
    return;
  }
  const nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    crawl();
  } else {
    visitPage(nextPage, crawl);
  }
};


(async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
  pagesToVisit.push(baseUrl);
  crawl();
})();
