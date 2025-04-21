class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    console.log('\nTest Summary:');
    console.log('Total Tests:', results.numTotalTests);
    console.log('Passed Tests:', results.numPassedTests);
    console.log('Failed Tests:', results.numFailedTests);
    console.log('Total Time:', results.startTime - results.endTime, 'ms\n');

    if (results.numFailedTests > 0) {
      console.log('Failed Tests:');
      results.testResults.forEach(testFile => {
        testFile.testResults.forEach(test => {
          if (test.status === 'failed') {
            console.log('\nTest:', test.title);
            console.log('Error:', test.failureMessages.join('\n'));
          }
        });
      });
    }
  }
}

module.exports = CustomReporter;
