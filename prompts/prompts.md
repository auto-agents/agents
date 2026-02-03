# Prompts

## base implementation

```
implements src/core/agent-base.js
```

*👉 by default using model **SWE-1.5***

## iterations / updates

any keyword must be defined by a const in the file `src/core/agent-consts.js`

add use of log levels consts

change agent run folder from `src/agents/[agent name]/run/[run id]` to `run/[agent name]/[run id]`

add agent documentation file `src/agents/[agent name]/usage.md`

update agent `get-time` and its `usage.md`, considering the new behavior: a configuration `interval` of value 0 means that the agent will run only once.

### internationalization

Any log text or error message produced by an agent must be translatable. To do that, the texts of an agent must be located in the file: `src/agents/[agent name]/resources/text-[langage code (2 letters)].json`. Texts of the `agent-base.js` are also translatable and are stored in `src/core/resources/text-[langage code (2 letters)].json`. Instead of using hard coded strings, the agent classes (both base and derived classes) must get strings from the `text-[langage code (2 letters)].json` file. The right translations resource file must be selected within the environment variable AGENT_LANG if defined or fallback to a new setting in core/globals.json (default lang value is: `en`). The structure of these files is a json object with keys as the english text and values as the translated text. the values of the translated texts will have subsituables parameters if needed. for example: "Processing file {0}..." where {0} will be replaced by the file name.

*👉 the internationlization task has needed using model **GPT-2.5 low reasoning***

The texts translations and methods for logging translated texts must be located outside the agent-base.js,  in a reusable component located in file utils/logger.js

### refactoring folders: group agents by category

Agents must be grouped by categories. In order to do that, you have to move any agents tp the new folders:
- agent documentation: file src/agents/[agent category name]/[agent name]/usage.md
- agent implementation folder: src/agents/[agent category name]/[agent name]
- agent configuration file: src/agents/[agent category name]/[agent name]/config.json

The agent `get-time` belongs to the category `system`. Then update the agent `get-time` and its `usage.md` accordingly to the new folder structure. Then update the specification file `doc/agent-model.md` accordingly to the new folder structure.

## test: the get-time agent

implements an agent named `get-time` in folder `/src/agents/system/get-time/get-time.js`. this agent has not input file, it output the current time in the format `YYYY-MM-DD HH:mm:ss`. it as a configuration parameter `interval` that defines the interval in seconds between each output. the default interval value is 5 seconds. it as a configuration parameter `timezone` that defines the timezone of the output. the default timezone value is 'UTC'. It as a configuration parameter `outputFile` that defines the file where the output is written. the default output file is `output.txt`. 

do not use individual class attributes to store config in the agent `test-agent.js`, kept a single config object

implements the file `node src/agents/system/get-time/test-agent.js` according to the specification defined in `doc/agent-model.md` that run the agent `get-time`
