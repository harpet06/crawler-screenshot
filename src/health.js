const parse = require('url-parse');
const fs = require('fs');
const config = require('../config/index');

const dir = config.pageHealth.imageDir;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const takeScreenshot = async (pageLink, statusCode, page) => {
  let urlPath = parse(pageLink);
  urlPath = urlPath.pathname;
  urlPath = urlPath.replace(/\\|\//g, '');

  if (!urlPath) {
    urlPath = 'home';
  }

  await page.screenshot({
    path: `./images/page-${urlPath}-status-${statusCode}.png`,
    type: 'png',
    fullPage: true,
  });
};

const getHealth = async (page, pageLink) => {
  let healthy = true;
  let networkRequests = [];

  page.on('response', (response) => {
    if (config.pageHealth.acceptableStatusCodes.includes(response.url())) {
      networkRequests.push({
        requestUrl: response.url(),
        responseStatus: response.status(),
      });
    }
  });

  const response = await page.goto(pageLink, {
    waitUntil: ['load'],
  });

  page.removeAllListeners('response');

  if (!config.pageHealth.acceptableStatusCodes.includes(response.status())) {
    healthy = false;
    await takeScreenshot(pageLink, response.status(), page);
  }
  let metrics = 0;
  metrics = await page.metrics();

  if (metrics.TaskDuration > config.pageHealth.maxPageLoadTime) {
    healthy = false;
  }

  const pageLoadTime = metrics.TaskDuration;

  if (networkRequests.length === 0) {
    networkRequests = 'All valid';
  }

  return {
    statusCode: response.status(),
    pageLoadTime,
    healthy,
    networkRequests,
  };
};

module.exports = { getHealth };
