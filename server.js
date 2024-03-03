let path = require('path');
let connect = require('connect');
let http = require('http');
let serveStatic = require('serve-static');
let pckg = require('./package.json');
let {WS_CORE_PATH} = require('./lib/constants');
let handlers = require('./lib/handlers');

const open = require('open');

const logger = console;

const randomPort = () => {
   return 40000 + Math.ceil(Math.random() * 10000);
};

const getServer = (port, app, message) => {
   return new Promise((resolve) => {
      const server = http.createServer(app);

      server.on('error', async () => {
         resolve(await getServer(randomPort(), app, message));
      });

      server.listen(port, () => {
         logger.log(message.replace('$port$', port));
         resolve([server, port]);
      });
   });
};

/**
 * Runs HTTP server which generates HTML page with testing
 *
 * @param {Number} port Server port
 * @param {Config} config Config
 * @param {String} [config.moduleType='esm'] Testing module type: 'esm' - ECMAScript Module, 'amd' - Asynchronous Module Definition
 * @param {String} [config.root=''] Path to the project root
 * @param {Array} [config.tests] Path to tests folder (relative to config.root)
 * @param {String} [config.initializer] Path to initialzation script that calls before testing start (for example, 'init.js')
 * @param {String} [config.coverageCommand] Command that runs coverage HTML report building (for example, 'node node_modules/saby-units/cover test-isolated')
 * @param {String} [config.coverageReport] Coverage HTML report target path (например, '/artifacts/coverage/lcov-report/index.html')
 */
exports.run = async (port, config) => {
   config = config || {};
   config.moduleType = config.moduleType || 'esm';
   config.root = config.root || '';
   config.ws = config.ws || WS_CORE_PATH;
   config.cdn = config.cdn || '/cdn';
   config.tests = config.tests || [];
   config.coverage = config.coverage || false;
   config.coverageCommand = config.coverageCommand || '';
   config.coverageReport = config.coverageReport || '';
   config.initializer = config.initializer || '';

   const mimeTypes = pckg.mimeTypes || {};
   const serverSignature = `"${pckg.description}" HTTP server v.${pckg.version} at port $port$ for "${path.resolve(config.root)}"`;

   const staticConfig = {
      setHeaders: function setHeaders(res, path) {
         let dotPos = path.lastIndexOf('.');
         if (dotPos > -1) {
            let ext = path.substr(dotPos + 1);
            if (ext in mimeTypes) {
               res.setHeader('Content-Type', mimeTypes[ext]);
            }
         }
      }
   };

   const app = connect()
      .use(serveStatic(__dirname, staticConfig))
      .use(handlers.staticFiles(config, staticConfig))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules'), staticConfig))
      .use('/cdn/jquery/3.3.1/', serveStatic(path.join(__dirname, '/cdn/JQuery/jquery/3.3.1/'), staticConfig))
      .use('/cdn/', serveStatic(path.join(process.cwd(), config.cdn), staticConfig))
      .use('/~setup.js', handlers.setup(config))
      .use('/~test-list.js', handlers.testListAmd(config))
      .use('/~test-list.json', handlers.testListJson(config))
      .use('/~coverage/', handlers.coverage(config));

   let [server, usePort] = await getServer(port || randomPort(), app, `Starting ${serverSignature}`);

   const shutDown = (code) => {
      if (server && code === 0) {
         logger.log(`Stopping ${serverSignature}`);
         server.close();
      }
      server = null;
   };

   process.on('exit', shutDown);

   process.on('SIGINT', () => {
      shutDown();
      process.kill(process.pid, 'SIGINT');
   });

   if (config.openPage) {
      open(`http://localhost:${usePort}`);
   }

   return {
      usePort,
      server
   };
};
