const cheerio = require("cheerio");
const parse = require("url-parse");
const puppeteer = require("puppeteer");
const shuffle = require("shuffle-array");
const config = require("./config/index");
const health = require("./src/health");
const reportGen = require("./src/report");

let { baseUrl, maxPagesToVisit, stickToBaseUrl, randomCrawl } = config;

let pagesVisited = [];
let numPagesVisited = 0;
let pagesToVisit = [];
let url = parse(baseUrl);
let report = [];
let realPageLoadTimeCalculator = 0;
let browser;
let page;

if (url.pathname === "") {
  baseUrl = `${url.protocol}//${url.hostname}`;
} else {
  baseUrl = `${url.href}`;
}

const getLinks = $ => {
  const relativeLinks = $("a[href^='/']");

  const absoluteLinks = $(`a[href^='${baseUrl}']`);

  absoluteLinks.each(function() {
    if (stickToBaseUrl === "true") {
      if (
        $(this)
          .attr("href")
          .includes(baseUrl)
      ) {
        pagesToVisit.push($(this).attr("href"));
      }
    } else {
      pagesToVisit.push($(this).attr("href"));
    }
  });

  relativeLinks.each(function() {
    if (stickToBaseUrl === "true") {
      if (
        $(this)
          .attr("href")
          .includes(url.pathname)
      ) {
        baseUrl = `${url.protocol}//${url.hostname}`;
        pagesToVisit.push(baseUrl + $(this).attr("href"));
      }
    } else {
      baseUrl = `${url.protocol}//${url.hostname}`;
      pagesToVisit.push(baseUrl + $(this).attr("href"));
    }
  });
};

const visitPage = async pageLink => {
  numPagesVisited += 1;

  console.log(`Crawling page ${numPagesVisited} of ${maxPagesToVisit}`);

  if (pageLink) {
    const response = await health.getHealth(page, pageLink);

    let {
      networkRequests,
      statusCode,
      pageLoadTime,
      previousPageUrl
    } = response;

    let pageDetail;
    if (report.length === 0) {
      const { healthy, unhealthyReason } = health.isHealthy(
        statusCode,
        pageLoadTime,
        networkRequests
      );

      pageDetail = {
        currentUrl: pageLink,
        clickedFrom: previousPageUrl,
        statusCode: statusCode,
        loadTime: pageLoadTime,
        networkRequests,
        pageHealthy: healthy,
        unhealthyReason: unhealthyReason
      };
    } else {
      // this code block exists due to https://github.com/GoogleChrome/puppeteer/issues/2513
      const lastResult = report[report.length - 1];
      realPageLoadTimeCalculator =
        realPageLoadTimeCalculator + lastResult.loadTime;

      let realPageLoadTime = pageLoadTime - realPageLoadTimeCalculator;

      const { healthy, unhealthyReason } = health.isHealthy(
        statusCode,
        realPageLoadTime,
        networkRequests
      );
      pageDetail = {
        currentUrl: pageLink,
        clickedFrom: previousPageUrl,
        statusCode: statusCode,
        loadTime: realPageLoadTime,
        networkRequests,
        pageHealthy: healthy,
        unhealthyReason: unhealthyReason
      };
    }

    report.push(pageDetail);

    pagesVisited.push(pageLink);

    const body = await page.content();
    const $ = cheerio.load(body);
    getLinks($);
    return crawl();
  } else {
    console.log("No Links Found OR found all links");
    await browser.close();
    return reportGen.generateReport(report);
  }
};

const crawl = async () => {
  if (numPagesVisited >= maxPagesToVisit) {
    console.log("Reached max limit of number of pages to visit.");
    await browser.close();
    const reportCreated = reportGen.generateReport(report);
    console.log(reportCreated);
    return reportCreated;
  }

  if (randomCrawl === "true") {
    pagesToVisit = shuffle(pagesToVisit);
  }

  const nextPage = pagesToVisit.pop();
  if (pagesVisited.includes(nextPage)) {
    return crawl();
  } else {
    return visitPage(nextPage);
  }
};

const resetSetup = () => {
  numPagesVisited = 0;
  pagesToVisit = [];
  pagesVisited = [];
  report = [];
  realPageLoadTimeCalculator = 0;
};

const runCrawl = async (
  crawlUrl,
  crawlMaxPagesToVisit,
  crawlRandomCrawl,
  crawlStickToBaseUrl
) => {
  baseUrl = crawlUrl;
  maxPagesToVisit = crawlMaxPagesToVisit;
  randomCrawl = crawlRandomCrawl;
  stickToBaseUrl = crawlStickToBaseUrl;
  url = parse(baseUrl);

  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true,
    dumpio: false
  });
  page = await browser.newPage();
  pagesToVisit.push(baseUrl);
  let reportPath = await crawl();
  resetSetup();
  return reportPath;
};

module.exports = { runCrawl };
