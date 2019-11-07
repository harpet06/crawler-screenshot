const parse = require("url-parse");
const fs = require("fs");
const config = require("../config/index");

const dir = config.pageHealth.imageDir;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const { acceptableStatusCodes, maxPageLoadTime } = config.pageHealth;

const takeScreenshot = async (pageLink, statusCode, page) => {
  let urlPath = parse(pageLink);
  urlPath = urlPath.pathname;
  urlPath = urlPath.replace(/\\|\//g, "");

  if (!urlPath) {
    urlPath = "home";
  }

  await page.screenshot({
    path: `./images/page-${urlPath}-status-${statusCode}.png`,
    type: "png",
    fullPage: true
  });
};

const getHealth = async (page, pageLink) => {
  let networkRequests = [];

  page.on("response", response => {
    if (!acceptableStatusCodes.includes(response.status())) {
      networkRequests.push({
        requestUrl: response.url(),
        responseStatus: response.status()
      });
    }
  });

  let previousPageUrl;

  if (page.url() === "about:blank") {
    previousPageUrl = false;
  } else {
    previousPageUrl = page.url();
  }

  const response = await page.goto(pageLink, {
    waitUntil: ["load"]
  });

  let pageStatus = response.status();
  if (!pageStatus) {
    pageStatus = 0;
  }

  page.removeAllListeners("response");

  if (!config.pageHealth.acceptableStatusCodes.includes(pageStatus)) {
    await takeScreenshot(pageLink, pageStatus, page);
  }
  let metrics = 0;
  metrics = await page.metrics();

  const pageLoadTime = metrics.TaskDuration;

  return {
    statusCode: pageStatus,
    pageLoadTime,
    networkRequests,
    previousPageUrl
  };
};

const isHealthy = (statusCode, pageLoadTime, networkRequests) => {
  let healthy = true;
  let unhealthyReason = "";

  if (!acceptableStatusCodes.includes(statusCode)) {
    healthy = false;
    unhealthyReason = unhealthyReason = "page status code";
  }

  if (pageLoadTime > maxPageLoadTime) {
    healthy = false;
    unhealthyReason = unhealthyReason.concat(" page load time.");
  }

  if (
    !Object.values(networkRequests).includes(acceptableStatusCodes) &&
    networkRequests.length > 0
  ) {
    healthy = false;
    unhealthyReason = unhealthyReason.concat(" network requests.");
  }

  return { healthy, unhealthyReason };
};

module.exports = { getHealth, isHealthy };
