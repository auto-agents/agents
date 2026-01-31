# Prompts

## base implementation

```
implements src/core/agent-base.js
```

## updates

any keyword must be defined by a const in the file `src/core/agent-consts.js`

add use of log levels consts

change agent run folder from `src/agents/[agent name]/run/[run id]` to `run/[agent name]/[run id]`

add agent documentation file `src/agents/[agent name]/usage.md`

update agent `get-time` and its `usage.md`, considering the new behavior: a configuration `interval` of value 0 means that the agent will run only once.

## test: the get-time agent

implements an agent named `get-time` in folder `/src/agents/get-time/get-time.js`. this agent has not input file, it output the current time in the format `YYYY-MM-DD HH:mm:ss`. it as a configuration parameter `interval` that defines the interval in seconds between each output. the default interval value is 5 seconds. it as a configuration parameter `timezone` that defines the timezone of the output. the default timezone value is 'UTC'. It as a configuration parameter `outputFile` that defines the file where the output is written. the default output file is `output.txt`. 

do not use individual class attributes to store config in the agent `test-agent.js`, kept a single config object

implements the file `node src/agents/get-time/test-agent.js` according to the specification defined in `doc/agent-model.md` that run the agent `get-time`
