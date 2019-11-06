const cheerio = require('cheerio');
const parse = require('url-parse');
const puppeteer = require('puppeteer');
const shuffle = require('shuffle-array');
const config = require('./config/index');
const health = require('./src/health');

let { baseUrl } = config;
const { maxPagesToVisit } = config;

const pagesVisited = [];
let numPagesVisited = 0;
let pagesToVisit = [];
const url = parse(baseUrl);
const report = [];
let browser;
let page;

if (url.pathname === '') {
  baseUrl = `${url.protocol}//${url.hostname}`;
} else {
  baseUrl = `${url.href}`;
}

const getLinks = ($) => {
  const relativeLinks = $("a[href^='/']");

  const absoluteLinks = $(`a[href^='${baseUrl}']`);

  absoluteLinks.each(function () {
    if (config.stickToBaseUrl) {
      if (
        $(this)
          .attr('href')
          .includes(baseUrl)
      ) {
        pagesToVisit.push($(this).attr('href'));
      }
    } else {
      pagesToVisit.push($(this).attr('href'));
    }
  });

  relativeLinks.each(function () {
    if (config.stickToBaseUrl) {
      if (
        $(this)
          .attr('href')
          .includes(baseUrl)
      ) {
        baseUrl = `${url.protocol}//${url.hostname}`;
        pagesToVisit.push(baseUrl + $(this).attr('href'));
      }
    } else {
      baseUrl = `${url.protocol}//${url.hostname}`;
      pagesToVisit.push(baseUrl + $(this).attr('href'));
    }
  });

  console.log(`Found ${pagesToVisit.length} links `);
};

const visitPage = async (pageLink) => {
  numPagesVisited += 1;

  if (pageLink) {
    const response = await health.getHealth(page, pageLink);

    const { networkRequests } = response;
    // this shouldn't happen here..

    let pageDetail;
    if (report.length === 0) {
      pageDetail = {
        url: pageLink,
        statusCode: response.statusCode,
        loadTime: response.pageLoadTime,
        healthy: response.healthy,
        networkRequests,
      };
    } else {
      // this code block exists due to https://github.com/GoogleChrome/puppeteer/issues/2513
      const lastResult = report[report.length - 1];
      pageDetail = {
        url: pageLink,
        statusCode: response.statusCode,
        loadTime: response.pageLoadTime - lastResult.loadTime,
        healthy: response.healthy,
        networkRequests,
      };
    }

    report.push(pageDetail);

    pagesVisited.push(pageLink);
    
    const body = await page.content();
    const $ = cheerio.load(body);
    getLinks($);
    crawl();
  } else {
    console.log('No Links Found OR found all links');
    console.log(report);
    await browser.close();
  }
};

const crawl = async () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log('Reached max limit of number of pages to visit.');
    await browser.close();
    console.log(report);
    return;
  }

  if (config.randomCrawl) {
    pagesToVisit = shuffle(pagesToVisit);
  }

  const nextPage = pagesToVisit.pop();

  if (pagesVisited.includes(nextPage)) {
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
