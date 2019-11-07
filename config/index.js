const config = {
  baseUrl: "",
  maxPagesToVisit: 2,
  randomCrawl: true,
  stickToBaseUrl: false, // foo.com/bar will only crawl foot.com/bar/baz
  pageHealth: {
    maxPageLoadTime: 1.0,
    acceptableStatusCodes: [200, 301, 304, 204],
    imageDir: "./images"
  }
};


process.env.BASEURL = process.env.BASEURL || config.baseUrl;
process.env.MAXPAGESTOVISIT =
  process.env.MAXPAGESTOVISIT || config.maxPagesToVisit;
process.env.RANDOMCRAWL = process.env.RANDOMCRAWL || config.randomCrawl;
process.env.STICKTOBASEURL =
  process.env.STICKTOBASEURL || config.stickToBaseUrl;

config.baseUrl = process.env.BASEURL;
config.maxPagesToVisit = process.env.MAXPAGESTOVISIT;
config.randomCrawl = process.env.RANDOMCRAWL;
config.stickToBaseUrl = process.env.STICKTOBASEURL;

module.exports = config;
