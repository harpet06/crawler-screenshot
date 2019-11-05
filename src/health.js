const config = require("../config/index");
const parse = require("url-parse");
const fs = require("fs");

const dir = config.pageHealth.imageDir;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

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
  let healthy = true;
  let pageLoadTime;
  const response = await page.goto(pageLink, {
    waitUntil: ["load", "networkidle2"]
  });
  if (!config.pageHealth.acceptableStatusCodes.includes(response.status())) {
    healthy = false;
    await takeScreenshot(pageLink, response.status(), page);
  }
  const metrics = await page.metrics();
  if(metrics.TaskDuration > config.pageHealth.maxPageLoadTime) {
    healthy = false; 
  }
  pageLoadTime = metrics.TaskDuration;
  return { statusCode: response.status(), pageLoadTime: pageLoadTime, healthy: healthy };
};

module.exports = { getHealth: getHealth };
