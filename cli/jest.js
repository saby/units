#!/usr/bin/env node

/**
 * This wrapper runs Jest in valid environment.
 */
const path = require('path');
const fs = require('fs-extra');
const { fork } = require('child_process');
const { parseArguments } = require('../lib/jest/command');
const runStatics = require('../lib/jest/statics');

const logger = console;
const inputArguments = process.argv.slice(2);
const jestArguments = parseArguments(inputArguments);

function updateConfig(args, browserCfg) {
   const cfg = fs.readJsonSync(args.parameters.configPath, { encoding: 'utf-8' });

   if (browserCfg) {
      if (cfg.hasOwnProperty('testEnvironmentOptions')) {
         cfg.testEnvironmentOptions.url = `http://localhost:${browserCfg.port}`;
         cfg.testEnvironmentOptions.referrer = `http://localhost:${browserCfg.port}`;
      } else if (cfg.hasOwnProperty('projects')) {
         cfg.projects.forEach(project => {
            project.testEnvironmentOptions.url = `http://localhost:${browserCfg.port}`;
            project.testEnvironmentOptions.referrer = `http://localhost:${browserCfg.port}`;
         });
      }
   }

   fs.writeJsonSync(args.parameters.configPath, cfg, { encoding: 'utf-8' });
}

// Необходимо раздать статику для окружения JSDOM
// FIXME: https://online.sbis.ru/opendoc.html?guid=f98baad1-eee6-41ca-b6d4-0ed8e9b05ef9
const promise = runStatics(jestArguments.parameters.root);

promise.then((result) => {
   logger.log(`[jest] Fork: ${process.execPath} ${jestArguments.jestPath} ${jestArguments.args.join(' ')}`);

   updateConfig(jestArguments, result);

   const jestProcess = fork(
      jestArguments.jestPath,
      jestArguments.args,
      {
         execArgv: [
            // FIXME: Limit memory usage because jest community (and we) faced with problem on node v16
            //  https://github.com/facebook/jest/issues/11956
            '--optimize-for-size',
            '--max-old-space-size=8192',
            '--expose-gc'
         ],
         stdio: 'inherit'
      }
   );

   let status = {};

   jestProcess.on('message', (testStatus) => {
      status = {...status, ...testStatus};
   });

   jestProcess.on('exit', (code) => {
      fs.outputFileSync(
         path.join(path.dirname(jestArguments.parameters.configPath), 'result', 'idStatus.json'),
         JSON.stringify(status, null, 3)
      );
      process.exit(code);
   });

   process.on('SIGINT', () => {
      jestProcess.kill('SIGKILL');
   });

   process.on('SIGTERM', () => {
      jestProcess.kill('SIGKILL');
   });
}).catch((error) => {
   logger.error(`[jest] Error: ${error}`);
});
