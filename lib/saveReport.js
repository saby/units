/**
 * Intercepts reports content from stdout and writes it to the specified file
 */
const Report = require('./unit').Report;
const logger = console;

function saveReport(fileName) {
   var report = new Report(fileName);
   fileName = report.getFilename();

   //Remove old report
   report.clear();

   logger.log(`Writing report file '${fileName}'`);

   //Intercept stdout by dirty hack
   let writeOriginal = process.stdout.write,
      output = [];

   process.stdout.write = chunk => {
      let str = '' + chunk;
      if (str && str[0] !== '<') {
         str = '<!--' + str + '-->';
      }
      output.push(str);
   };

   process.on('exit', () => {
      process.stdout.write = writeOriginal;

      if (output[output.length - 1] !== '</testsuite>\n') {
         output.push('</testsuite>\n');
      }

      report.save(output.join(''));
   });
}

module.exports = saveReport;
