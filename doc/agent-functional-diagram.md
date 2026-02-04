# Agent Functional Diagram

## Overview

This document describes the functional architecture and control flow between the `AgentBase` class, the `GetTimeAgent` derived class, and the `test-agent.js` controller using Mermaid diagrams.

## Class Hierarchy

```mermaid
classDiagram
    class AgentBase {
        <<abstract>>
        +agentName: string
        +agentCategory: string
        +state: AGENT_STATES
        +currentRunId: string
        +runStartTime: string
        +runEndTime: string
        +config: object
        +logger: Logger
        +interval: NodeJS.Timeout
        
        +start(runConfig)
        +stop()
        +pause()
        +resume()
        +exit()
        +loadConfiguration(runConfig)
        +handleMessage(message)
        +sendResponse()
        +createRunDirectory()
        +getRunDirectory()
        +saveRunConfig(runConfig)
        +updateState()
        +savePerformanceMeasures()
        
        +run(runConfig)*
        +onStop()
        +onPause()
        +onResume()
        +onConfigurationLoaded()
        +onConfigurationError(error)
    }
    
    class GetTimeAgent {
        +interval: NodeJS.Timeout
        +isPaused: boolean
        
        +run(runConfig)
        +startTimeOutput()
        +outputCurrentTime()
        +formatTime(date)
        +onStop()
        +onPause()
        +onResume()
        +onConfigurationLoaded()
    }
    
    class TestAgent {
        +agentProcess: ChildProcess
        +agentName: string
        +agentCategory: string
        +config: object
        
        +run()
        +sendCommand(command)
        +pause()
        +resume()
        +stop()
    }
    
    AgentBase <|-- GetTimeAgent
    TestAgent ..> GetTimeAgent : controls via IPC
```

## Control Flow Diagram

```mermaid
sequenceDiagram
    participant TA as test-agent.js
    participant GA as GetTimeAgent
    participant AB as AgentBase
    
    Note over TA,GA: Initialization
    TA->>GA: fork() process
    GA->>AB: super('get-time', 'system')
    AB->>AB: setup IPC handlers
    
    Note over TA,GA: Start Agent
    TA->>GA: {command: START, runConfig}
    GA->>AB: handleMessage()
    AB->>AB: start(runConfig)
    AB->>AB: createRunDirectory()
    AB->>AB: loadConfiguration()
    AB->>GA: onConfigurationLoaded()
    AB->>AB: saveRunConfig()
    AB->>AB: updateState()
    AB->>GA: run(runConfig)
    
    Note over GA: Time Output Loop
    GA->>GA: startTimeOutput()
    loop Every interval seconds
        GA->>GA: outputCurrentTime()
        GA->>GA: formatTime()
        GA->>GA: create JSON object
        GA->>GA: writeFile(output.json)
    end
    
    Note over TA,GA: Control Commands
    TA->>GA: {command: PAUSE}
    GA->>AB: handleMessage()
    AB->>GA: pause()
    GA->>GA: onPause()
    
    TA->>GA: {command: RESUME}
    GA->>AB: handleMessage()
    AB->>GA: resume()
    GA->>GA: onResume()
    
    TA->>GA: {command: STOP}
    GA->>AB: handleMessage()
    AB->>GA: stop()
    GA->>GA: onStop()
    AB->>AB: savePerformanceMeasures()
    AB->>TA: sendResponse()
```

## State Management Diagram

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> RUNNING: start()
    RUNNING --> PAUSED: pause()
    PAUSED --> RUNNING: resume()
    RUNNING --> STOPPING: stop()
    PAUSED --> STOPPING: stop()
    STOPPING --> STOPPED: cleanup
    RUNNING --> ERROR: exception
    STOPPED --> [*]
    ERROR --> [*]
    
    note right of RUNNING
        Time output loop
        setInterval() every N seconds
    end note
    
    note right of PAUSED
        Interval cleared
        State preserved
    end note
```

## File System Structure

```mermaid
graph TD
    A[run/] --> B[get-time/]
    B --> C[uuid-run-id/]
    C --> D[config.json]
    C --> E[state.json]
    C --> F[performance-measures.json]
    C --> G[output/]
    G --> H[output.json]
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#000
    style B fill:#e1f5fe,stroke:#333,stroke-width:2px,color:#000
    style C fill:#f3e5f5,stroke:#333,stroke-width:2px,color:#000
    style D fill:#fff3e0,stroke:#333,stroke-width:2px,color:#000
    style E fill:#fff3e0,stroke:#333,stroke-width:2px,color:#000
    style F fill:#fff3e0,stroke:#333,stroke-width:2px,color:#000
    style G fill:#e8f5e8,stroke:#333,stroke-width:2px,color:#000
    style H fill:#e8f5e8,stroke:#333,stroke-width:2px,color:#000
```

## IPC Communication Flow

```mermaid
graph LR
    subgraph "test-agent.js"
        TA1[Send Command]
        TA2[Receive Response]
    end
    
    subgraph "IPC Channel"
        IPC[IPC Messages]
    end
    
    subgraph "GetTimeAgent"
        GA1[handleMessage]
        GA2[sendResponse]
    end
    
    TA1 --> IPC
    IPC --> GA1
    GA2 --> IPC
    IPC --> TA2
    
    style IPC fill:#ffeb3b,stroke:#333,stroke-width:2px,color:#000
```

## Configuration Loading Process

```mermaid
flowchart TD
    A[AgentBase.start] --> B[loadConfiguration]
    B --> C[Read config.json]
    C --> D{File exists?}
    D -->|Yes| E[Parse default config]
    D -->|No| F[Use fallback config]
    E --> G[Merge with runConfig]
    F --> G
    G --> H[onConfigurationLoaded]
    H --> I[Custom logging]
    I --> J[Configuration ready]
    
    style C fill:#e3f2fd,stroke:#333,stroke-width:2px,color:#000
    style E fill:#e8f5e8,stroke:#333,stroke-width:2px,color:#000
    style F fill:#fff3e0,stroke:#333,stroke-width:2px,color:#000
    style H fill:#f3e5f5,stroke:#333,stroke-width:2px,color:#000
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Exception in GetTimeAgent] --> B[Catch in AgentBase.start]
    B --> C[state = ERROR]
    C --> D[logError]
    D --> E[updateState]
    E --> F[savePerformanceMeasures]
    F --> G[sendResponse with error]
    G --> H[test-agent.js receives error]
    H --> I[Process exit with error code]
    
    style A fill:#ffebee,stroke:#333,stroke-width:2px,color:#000
    style C fill:#ffebee,stroke:#333,stroke-width:2px,color:#000
    style I fill:#ffebee,stroke:#333,stroke-width:2px,color:#000
```

## Component Interaction Overview

```mermaid
graph TB
    subgraph "Controller Layer"
        TA[test-agent.js]
    end
    
    subgraph "Agent Process"
        subgraph "Base Framework"
            AB[AgentBase]
            L[Logger]
        end
        
        subgraph "Specific Implementation"
            GTA[GetTimeAgent]
        end
    end
    
    subgraph "File System"
        FS[run/get-time/uuid/]
        OUT[output.json]
        STATE[state.json]
        PERF[performance-measures.json]
    end
    
    TA -->|IPC Commands| AB
    AB -->|Inheritance| GTA
    AB -->|Logging| L
    GTA -->|File Operations| FS
    FS --> OUT
    FS --> STATE
    FS --> PERF
    
    style TA fill:#e1f5fe,stroke:#333,stroke-width:2px,color:#000
    style AB fill:#f3e5f5,stroke:#333,stroke-width:2px,color:#000
    style GTA fill:#e8f5e8,stroke:#333,stroke-width:2px,color:#000
    style L fill:#fff3e0,stroke:#333,stroke-width:2px,color:#000
    style FS fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#000
```

## Key Features Summary

### AgentBase Capabilities:
- **Process Management**: IPC communication, graceful shutdown
- **Configuration Management**: Default config loading, run config merging
- **State Management**: Persistent state tracking, performance metrics
- **Logging**: Structured logging with internationalization support
- **Error Handling**: Comprehensive error handling and recovery

### GetTimeAgent Specifics:
- **Time Formatting**: Timezone-aware time formatting (HH:mm:ss)
- **JSON Output**: Structured output with timestamp and timezone
- **Interval Control**: Configurable intervals, single-run mode (interval=0)
- **Pause/Resume**: Maintains state during pause/resume cycles

### test-agent.js Controller:
- **Process Spawning**: Creates isolated agent process
- **Command Sending**: Sends IPC commands to control agent
- **Response Handling**: Processes agent responses and state changes
- **Timeout Management**: Automatic agent termination for testing

This architecture provides a robust, extensible framework for agent development with clear separation of concerns between the base framework, specific agent implementations, and test controllers.
