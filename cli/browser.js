#!/usr/bin/env node
const util = require('../lib/util');
const server = require('../server');
const app = require('../lib/browser');
const config = util.getConfig();

let report = '';
if (process.argv.indexOf('--report') > -1) {
   report = process.env['test_report'] || config.report;
}

let coverageReport = '';
if (process.argv.indexOf('--coverage') > -1) {
   coverageReport = config.jsonCoverageReport;
}

let provider;
if (process.argv.indexOf('--selenium') > -1) {
   provider = 'selenium';
}

let head;
if (process.argv.indexOf('--head') > -1) {
   head = true;
}

function buildUrl(parts) {
   return parts.scheme + '://' + parts.host + ':' + parts.port + '/' + parts.path + '?' + parts.query;
}

server.run(process.env['test_server_port'] || config.url.port, {
   moduleType: config.moduleType,
   root: config.root,
   dependencies: config.dependencies,
   tests: config.tests,
   initializer: config.initializer,
   coverage: config.coverage,
   coverageCommand: config.coverageCommand,
   coverageReport: config.htmlCoverageReport,
   ignoreLeaks: config.ignoreLeaks
}).then((configServer) => {
   app.run({
      url: buildUrl({
         scheme: process.env['test_url_scheme'] || config.url.scheme,
         host: provider === 'selenium' ? (process.env['test_url_host'] || config.url.host) : config.url.host,
         port: configServer.usePort,
         path: process.env['test_url_path'] || config.url.path,
         query: process.env['test_url_query'] || config.url.query
      }),
      reportFile: report,
      coverageReportFile: coverageReport,
      provider,
      head,
      server: configServer.server
   });
});
