# Prompts

## base implementation

```
implements src/core/agent-base.js
```

*👉 by default using model **SWE-1.5***

## iterations : fixes & improvements 

any keyword must be defined by a const in the file `src/core/agent-consts.js`

add use of log levels consts

change agent run folder from `src/agents/[agent name]/run/[run id]` to `run/[agent name]/[run id]`

add agent documentation file `src/agents/[agent name]/usage.md`

update agent `get-time` and its `usage.md`, considering the new behavior: a configuration `interval` of value 0 means that the agent will run only once.

### add internationalization

Any log text or error message produced by an agent must be translatable. To do that, the texts of an agent must be located in the file: `src/agents/[agent name]/resources/text-[langage code (2 letters)].json`. Texts of the `agent-base.js` are also translatable and are stored in `src/core/resources/text-[langage code (2 letters)].json`. Instead of using hard coded strings, the agent classes (both base and derived classes) must get strings from the `text-[langage code (2 letters)].json` file. The right translations resource file must be selected within the environment variable AGENT_LANG if defined or fallback to a new setting in core/globals.json (default lang value is: `en`). The structure of these files is a json object with keys as the english text and values as the translated text. the values of the translated texts will have subsituables parameters if needed. for example: "Processing file {0}..." where {0} will be replaced by the file name.

*👉 the internationalization task has needed using model **GPT-2.5 low reasoning***

The texts translations and methods for logging translated texts must be located outside the `agent-base.js`,  in a reusable component located in file `utils/logger.js`

### refactoring folders: group agents by category

Agents must be grouped by categories. In order to do that, you have to move any agents tp the new folders:
- agent documentation: file `src/agents/[agent category name]/[agent name]/usage.md`
- agent implementation folder: `src/agents/[agent category name]/[agent name]`
- agent configuration file: `src/agents/[agent category name]/[agent name]/config.json`

The agent `get-time` belongs to the category `system`. Then update the agent `get-time` and its `usage.md` accordingly to the new folder structure. Then update the specification file `doc/agent-model.md` accordingly to the new folder structure.

add the parameter agentCategory to the AgentBase base class and to TestAgent and to GetTime agent

### improve agent implementation

add usage of consts `FILE_NAMES` defined in file `agent-consts.js`, in the agent class `GetTimeAgent`

add missing consts for paths in `agent-consts.js` `DIR_STRUCTURE`. add usage of these new consts in classes `AgentBase` and `GetTimeAgent`

generalize method `loadConfiguration` into `AgentBase` class. it must be called in the start method. keep logging in the agent subclass

generalize method `onConfigurationError` in `AgentBase` class

`agentCategory` property is mandatory, it can't be null or undefined. fix the code accordingly

`agentName` property is mandatory, it can't be null or undefined. fix the code accordingly

add in logs the name of the class which is logging

add usage of consts `LOG_LEVELS` in logger

some texts are not internationalized. fix that

*👉 the internationalization task has needed using model **GPT-2.5 low reasoning***

add consts for constructors errors messages in files test-agent, i18n, logger
