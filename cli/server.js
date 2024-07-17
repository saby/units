#!/usr/bin/env node
const util = require('../lib/util');
const app = require('../server');
const config = util.getConfig();

if (process.argv.indexOf('--coverage') > -1) {
   config.coverage = true;
}

if (process.argv.indexOf('--openPage') !== -1) {
   config.openPage = true;
}

app.run(process.env['test_server_port'] || config.url.port, {
   moduleType: config.moduleType,
   root: config.root,
   dependencies: config.dependencies,
   tests: config.tests,
   initializer: config.initializer,
   coverage: config.coverage,
   coverageCommand: config.coverageCommand,
   coverageReport: config.htmlCoverageReport,
   ignoreLeaks: config.ignoreLeaks,
   openPage: config.openPage
});
