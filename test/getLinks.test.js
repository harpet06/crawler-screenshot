const crawler = require("../crawler");
const cheerio = require('cheerio');

let baseUrl = "http://test.com";
let relativeLinks = "[a href=/foo]";
let absoluteLinks = "[a href=]"
let pagesToVisit = [];
const $ = cheerio.load(relativeLinks)

test("gets the relative links", $ => {
  crawler.getLinks($);

  console.log(pagesToVisit);
  expect(pagesToVisit).toContain("/foo");
});
