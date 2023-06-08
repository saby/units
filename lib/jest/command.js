const fs = require('fs-extra');
const path = require('path');
const pathTo = require('../util').pathTo;
const { isAllowedToUse } = require('./options');

const JEST_PATH = path.join(pathTo('jest'), 'bin', 'jest');

function wrapStringValue(value) {
   if (/[\t\n\r\s]+/.test(value)) {
      return `"${value}"`;
   }

   return value;
}

function getUnitsConfigPath(args) {
   for (let index = 0; index < args.length; ++index) {
      const [name, value] = args[index].split('=', 2);

      if (name === '--unitsConfigPath') {
         return value;
      }
   }

   throw new Error('Ожидалась обязательна опция --unitsConfigPath для запуска unit-тестов');
}

function parseArguments(args) {
   const unitsConfigPath = getUnitsConfigPath(args);
   const unitsConfig = fs.readJsonSync(unitsConfigPath, { encoding: 'utf-8' });

   const result = {
      args: [
         `--config=${unitsConfig.jest.configPath}`
      ],
      jestPath: JEST_PATH,
      parameters: {
         configPath: unitsConfig.jest.configPath,
         root: unitsConfig.jest.root
      }
   };

   for (let name in unitsConfig.jest.options) {
      const value = unitsConfig.jest.options[name];
      if (name === 'grep') {
         name = 'testNamePattern';
      }
      if (!isAllowedToUse(name)) {
         continue;
      }
      result.args.push(createCommandLineOption(name, value));
   }

   result.args.push(
      '--forceExit',
      '--logHeapUsage'
   );

   return result;
}

function createCommandLineOption(name, value) {
   const cliName = name.length === 1 ? `-${name}` : `--${name}`;
   if (value === true) {
      return cliName;
   }

   return `${cliName}=${wrapStringValue(value)}`;
}

module.exports = {
   parseArguments
};
