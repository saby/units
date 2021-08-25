#!/usr/bin/env node

/**
 * This wrapper runs Jest in valid environment.
 */

const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const { parseArguments } = require('../lib/jest/command');
const runStatics = require('../lib/jest/statics');

const logger = console;
const inputArguments = process.argv.slice(2);
const jestArguments = parseArguments(inputArguments, process.env);

let promise = Promise.resolve();

if (jestArguments.parameters.isBrowser) {
   // Необходимо раздать статику
   promise = runStatics(jestArguments.parameters.root);
}

function updateConfig(args, data) {
   if (!data) {
      return;
   }

   const cfg = fs.readJsonSync(args.parameters.configPath, { encoding: 'utf-8' });

   cfg.testEnvironmentOptions.url = `http://localhost:${data.port}`;
   cfg.testEnvironmentOptions.referrer = `http://localhost:${data.port}`;

   fs.writeJsonSync(args.parameters.configPath, cfg, { encoding: 'utf-8' });
}

promise.then((result) => {
   logger.log(`[jest] Running: ${jestArguments.args.join(' ')}`);

   updateConfig(jestArguments, result);

   const jestProcess = spawn(
       process.execPath,
       jestArguments.args,
       jestArguments.options
   );

   jestProcess.on('exit', (code) => {
      process.exit(code);
   });

   // Terminate children
   process.on('SIGINT', () => {
      jestProcess.kill('SIGINT');
      jestProcess.kill('SIGTERM');
      process.kill(process.pid, 'SIGINT');
   });
}).catch((error) => {
   logger.error(`[jest] Error: ${error}`);
});
