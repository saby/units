const path = require('path');
const pathTo = require('../util').pathTo;
const { isAllowedToUse } = require('./options');

// TODO: сделать передачу параметров через конфигурационный файл
//  https://online.sbis.ru/opendoc.html?guid=c5863837-76b4-409d-af5d-4f24aaee3d66

const JEST_PATH = path.join(pathTo('jest'), 'bin', 'jest');
const JEST_JUNIT_PATH = pathTo('jest-junit');

const JEST_RUNTIME_FILE_NAME = 'runtime.js';

const EMPTY_STRING = '';

function getModuleLoaderPath(root) {
   return path.join(root, JEST_RUNTIME_FILE_NAME);
}

function cleanString(str) {
   return str.replace(/^["']/gi, EMPTY_STRING).replace(/['"]$/gi, EMPTY_STRING);
}

function parseArguments(args, defaultEnv) {
   const result = {
      args: [
         JEST_PATH,
         `--moduleLoader=${getModuleLoaderPath(__dirname)}`
      ],
      options: {
         stdio: 'inherit',
         env: {
            ...defaultEnv
         }
      },
      parameters: {
         isBrowser: false
      }
   }
   for (let index = 0; index < args.length; ++index) {
      const argv = args[index];
      let [name, value] = argv.split('=', 2);
      if (!name) {
         continue;
      }
      if (name.startsWith('--ENV_VAR-')) {
         const envVar = name.replace('--ENV_VAR-', '');
         result.options.env[envVar] = cleanString(value);
         continue;
      }
      if (name === '--config') {
         result.parameters.configPath = value;
      }
      if (name === '--root') {
         result.parameters.root = value;
         continue;
      }
      if (name === '--grep') {
         name = '--testNamePattern';
      }
      if (!isAllowedToUse(name)) {
         continue;
      }
      if (name === '--env' && value === 'jsdom') {
         result.parameters.isBrowser = true;
      }
      result.args.push(argv);
   }
   if (result.options.env.hasOwnProperty('JEST_JUNIT_OUTPUT_FILE')) {
      result.args.push(`--reporters=default`);
      result.args.push(`--reporters=${JEST_JUNIT_PATH}`);
      result.args.push(`--testResultsProcessor=${JEST_JUNIT_PATH}`);
   }
   return result;
}

module.exports = {
   parseArguments
};
