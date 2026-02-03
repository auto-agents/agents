// Agent states
export const AGENT_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPING: 'stopping',
    STOPPED: 'stopped',
    ERROR: 'error'
};

// IPC commands
export const AGENT_COMMANDS = {
    START: 'start',
    STOP: 'stop',
    PAUSE: 'pause',
    RESUME: 'resume',
    EXIT: 'exit'
};

// Log levels
export const LOG_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};

// File names
export const FILE_NAMES = {
    CONFIG: 'config.json',
    RUN_LOG: 'run.log',
    PERFORMANCE_MEASURES: 'performance-measures.json',
    INPUT: 'input.json',
    OUTPUT: 'output.json',
    STATE: 'state.json'
};

// Directory structure
export const DIR_STRUCTURE = {
    SRC: 'src',
    AGENTS: 'agents',
    CORE: 'core',
    RUN: 'run',
    OUTPUT: 'output',
    RESOURCES: 'resources'
};

// Run properties structure
export const RUN_PROPERTIES = {
    START_TIME: 'StartTime',
    END_TIME: 'EndTime',
    DURATION: 'Duration',
    STATE: 'State',
    ERROR: 'Error'
};

// Run configuration structure
export const RUN_CONFIG = {
    INPUT: 'input',
    CONFIG: 'config'
};
