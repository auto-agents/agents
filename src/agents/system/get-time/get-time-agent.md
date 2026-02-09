# get-time agent

## specification

implements an agent named `get-time` in folder `/src/agents/system/get-time/get-time.js`. this agent has not input file, it output the current time in the format `YYYY-MM-DD HH:mm:ss`. it as a configuration parameter `interval` that defines the interval in seconds between each output. the default interval value is 5 seconds. it as a configuration parameter `timezone` that defines the timezone of the output. the default timezone value is 'UTC'. It as a configuration parameter `outputFile` that defines the file where the output is written. the default output file is `output.txt`. 

## iterations : fixes & improvements 

do not use individual class attributes to store config in the agent `test-agent.js`, kept a single config object

change the ouput file of GetTimeAgent to `output.json` using the const from `agent-consts.js` and produces a JSON file accordingly

remove properties agent and `runId` from the output

use path consts in test-agent

## test

implements the file `src/agents/system/get-time/test-agent.js` according to the specification defined in `doc/agent-model.md` that run the agent `get-time`
