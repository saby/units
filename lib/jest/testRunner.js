const circusRunner = require('jest-circus/runner');

module.exports = async function(
   globalConfig,
   config,
   environment,
   runtime,
   testPath,
   sendMessageToJest
) {
   const status = {
      done: 0,
      fail: 0,
      skip: 0
   };

   environment.handleTestEvent = async(event, state) => {
      if (event.name === 'test_done') {
         ++status.done;
      }

      if (event.name === 'test_fn_failure') {
         ++status.fail;
      }

      if (event.name === 'test_skip') {
         ++status.skip;
      }

      if (event.name === 'run_finish') {
         if (!environment.global.testID) {
            return;
         }

         const result = {};

         if (status.fail) {
            result[environment.global.testID] = 'fail';
         } else if (status.skip) {
            result[environment.global.testID] = 'skip';
         } else {
            result[environment.global.testID] = 'success';
         }

         state.parentProcess.send(result);
      }
   };

   return circusRunner(
      globalConfig,
      config,
      environment,
      runtime,
      testPath,
      sendMessageToJest
   );
}
