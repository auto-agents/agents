# agent model

## definitions

The term agent is derived from the Latin agere (to do): an agreement to act on one's behalf. Such "action on behalf of" implies the authority to decide which, if any, action is appropriate. Some agents are colloquially known as bots, from robot. They may be embodied, as when execution is paired with a robot body, or as software such as a chatbot executing on a computer, such as a mobile device, e.g. Siri. Software agents may be autonomous or work together with other agents or people. Software agents interacting with people (e.g. chatbots, human-robot interaction environments) may possess human-like qualities such as natural language understanding and speech, personality or embody humanoid form (see Asimo).

*from https://en.wikipedia.org/wiki/Software_agent*

In system administration, orchestration is the automated configuration, coordination, deployment, development, and management of computer systems and software. In the context of cloud computing, the main difference between workflow automation and orchestration is that workflows are processed and completed as processes within a single domain for automation purposes, whereas orchestration includes a workflow and provides a directed action towards larger goals and objectives.

*from https://en.wikipedia.org/wiki/Orchestration_(computing)*

## agent specification

An agent specification is a description of an agent's behavior, including its goals, actions, and environment. It is used to define the agent's capabilities and limitations, and to guide its behavior in a specific context.

A software agent is a computer program that can perform tasks autonomously or with human guidance. It can be designed to perform a specific task or a set of tasks, and can be used to automate repetitive or time-consuming tasks. Software agents can be used to perform a wide range of tasks, including data analysis, web scraping, and machine learning.

### formalization

A software agent always has these characteristics:

- **input** : has no input or consumes any json file
- **output** : has no output or produces one or several files
- **configuration** : has no configuration or consumes any json configuration file
- **behavior** : the agent behavior is defined by software implementation. The implementation is defined by a method called "run". any agent inherits from a base agent class that implements and/or defines the standardized agent interface. An agent can be defined by a class that extends the base agent class. Any agent must be able to respond to these signals:
    - **start** : begins activity
    - **stop** : stops activity
    - **pause** : pauses activity
    - **resume** : resumes activity
- **log** : any agent activity and/or activity change is logged. each activity step is logged with a timestamp, a message, and a level (info, warning, error).
- **performance measures** : Each agent run exection time is logged in a performance measures file.
- **running state** : indicates the agent current state. can be :
    - "idle" : the agent is not running
    - "running" : the agent is running
    - "paused" : the agent is paused
    - "stopping" : the agent is stopping
    - "stopped" : the agent is stopped
    - "error" : the agent has an error
- **process** : always runs in its own process. Each agent run is associated to an id unique for the agent. a folder is created for each run, that contains the agent run logs, configuration, input, output, and any other relevant files. This folder name is the agent run id. The agent run id is a uuid.

### design

The whole solution use `nodejs` as runtime environment.

The base class agent is defined by the class `AgentBase`. It implements the standardized agent interface. Any agent must inherit from this class. This class is defined in the file `src/core/agent-base.js`

Each specific agent is defined by a class that extends the base agent class. Any agent must inherit from this class. Each of these classes have their own folder, organized like this:
- agent implementation folder: src/agents/[agent name]
- agent configuration file: src/agents/[agent name]/config.json
- agent run folder: src/agents/[agent name]/run/[run id]
- agent run log file: src/agents/[agent name]/run/[run id]/run.log
- agent run preformance measures file: src/agents/[agent name]/run/[run id]/performance-measures.json
- agent run backup input file: src/agents/[agent name]/run/[run id]/input.json
- agent run output files: src/agents/[agent name]/run/[run id]/output.json
- agent run state is stored in a json file: src/agents/[agent name]/run/[run id]/state.json

The method `run` is the main method of the agent. It is internally called by the method `start` when the agent is started. It must not be called directly by the user. The method is blocking until the execution fails or ends.

The method `start` receive a json object (the run configuration) that has the following structure:

```json
/* run configuration */
{
    "input": [ /* an array of input files : "filePath1", "filePath2", ..., "filePathN" */ ],
    "config": {
        // any json that provides some parameters to the agent. this configuration will eventually overload the default agent configuration 
    }
}
```

The agent must react to the following signals:
- **start** : begins activity
- **stop** : stops activity
- **pause** : pauses activity
- **resume** : resumes activity

The call from signals returns a json object indicating the state of the agent, and the current run properties. Run properties is a json object having this structure:

```json
{
    "StartTime": String /* start time of the current run */,
    "EndTime": String /* end time of the current run if effectively terminated */,
    "Duration": String /* duration of the run if effectively terminated */,
    "State": String /* state of the current run */,
    "Error": String /* error message if the run failed */
}
```

The agent process receive commands from the parent process through an IPC channel, within the `Message event`. The agent Node.js process is spawned with an IPC channel (see the NodeJS Child Process and Cluster documentation), the 'message' event is emitted whenever a message sent by a parent process using childprocess.send() is received by the child process. The structure of a message is this JSON:

 ```json
 {
    "command": "start" | "stop" | "pause" | "resume" | "exit",
    "runConfig": {
        /* the run configuration of the agent */
    }
 }
 ```

any keyword must be defined by a const in the file `src/core/agent-consts.js`