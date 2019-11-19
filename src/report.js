const config = require("../config/index");
const fs = require("fs");
const uuidv4 = require("uuid/v4");


const { reportDir } = config;

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir);
}

const generateReport = reportData => {
  let fileName = uuidv4();
  console.log(reportData)
  fs.writeFileSync(
    `./${reportDir}/report-${fileName}.JSON`,
    JSON.stringify(reportData),
    err => {
      if (err) throw err;
    }
  );

  const reportName = `/${reportDir}/report-${fileName}.JSON`
  return reportName;
};

module.exports = { generateReport };
