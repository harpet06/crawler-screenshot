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

  // new stuff
  let paused = false;
  let pausedRequests = [];
  let results = [];

  const nextRequest = () => {
    if (pausedRequests.length === 0) {
      paused = false;
    } else {
      pausedRequests.shift()();
    }
  };

  await page.setRequestInterception(true);
  page.on("request", request => {
    if (paused) {
      pausedRequests.push(() => request.continue());
    } else {
      paused = true;
      request.continue();
    }
  });

  page.on("requestfinished", async request => {
    const response = await request.response();
    const responseStatus = response.status();

    const information = {
      url: request.url(),
      responseStatus: responseStatus
    };

    results.push(information);
    nextRequest();
  });

  page.on("requestfailed", request => {
    //if it fails do I care..?
    nextRequest();
  });

  const response = await page.goto(pageLink, {
    waitUntil: ["load", "networkidle2"]
  });

  console.log(results);

  if (!config.pageHealth.acceptableStatusCodes.includes(response.status())) {
    healthy = false;
    await takeScreenshot(pageLink, response.status(), page);
  }
  const metrics = await page.metrics();
  if (metrics.TaskDuration > config.pageHealth.maxPageLoadTime) {
    healthy = false;
  }
  pageLoadTime = metrics.TaskDuration;
  //page.removeListener("request");
  return {
    statusCode: response.status(),
    pageLoadTime: pageLoadTime,
    healthy: healthy
  };
};

module.exports = { getHealth: getHealth };
