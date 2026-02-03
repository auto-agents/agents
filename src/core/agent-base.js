import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    AGENT_STATES,
    AGENT_COMMANDS,
    FILE_NAMES,
    RUN_PROPERTIES
} from './agent-consts.js';
import Logger from '../utils/logger.js';

class AgentBase {
    constructor(agentName, agentCategory) {
        this.agentName = agentName;
        this.agentCategory = agentCategory;
        this.state = AGENT_STATES.IDLE;
        this.currentRunId = null;
        this.runStartTime = null;
        this.runEndTime = null;
        this.process = null;

        this.logger = new Logger(agentName, agentCategory);

        // Setup IPC communication
        process.on('message', this.handleMessage.bind(this));

        // Handle graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    async _t(textKey, params = []) {
        return await this.logger._t(textKey, params);
    }

    /**
     * Handle IPC messages from parent process
     */
    async handleMessage(message) {
        try {
            const { command, runConfig } = message;

            switch (command) {
                case AGENT_COMMANDS.START:
                    await this.start(runConfig);
                    break;
                case AGENT_COMMANDS.STOP:
                    await this.stop();
                    break;
                case AGENT_COMMANDS.PAUSE:
                    await this.pause();
                    break;
                case AGENT_COMMANDS.RESUME:
                    await this.resume();
                    break;
                case AGENT_COMMANDS.EXIT:
                    await this.exit();
                    break;
                default:
                    await this.logger.logWarning('Unknown command: {0}', [command]);
            }
        } catch (error) {
            await this.logger.logError('Error handling message: {0}', [error.message]);
            this.state = AGENT_STATES.ERROR;
        }
    }

    /**
     * Start the agent with run configuration
     */
    async start(runConfig) {
        if (this.state !== AGENT_STATES.IDLE && this.state !== AGENT_STATES.STOPPED) {
            throw new Error(await this._t('Cannot start agent in state: {0}', [this.state]));
        }

        try {
            this.currentRunId = uuidv4();
            this.runStartTime = new Date().toISOString();
            this.state = AGENT_STATES.RUNNING;

            // Create run directory structure
            await this.createRunDirectory();

            // Save run configuration
            await this.saveRunConfig(runConfig);

            // Log start
            await this.logger.logInfo('Agent started with run ID: {0}', [this.currentRunId], this.currentRunId);

            // Update state
            await this.updateState();

            // Call the run method (blocking)
            await this.run(runConfig);

            // Mark as completed successfully
            this.runEndTime = new Date().toISOString();
            this.state = AGENT_STATES.STOPPED;

            // Log completion
            await this.logger.logInfo('Agent completed successfully', [], this.currentRunId);

            // Update final state
            await this.updateState();
            await this.savePerformanceMeasures();

            // Send response to parent
            this.sendResponse();

        } catch (error) {
            this.runEndTime = new Date().toISOString();
            this.state = AGENT_STATES.ERROR;

            await this.logger.logError('Agent failed: {0}', [error.message], this.currentRunId);
            await this.updateState();
            await this.savePerformanceMeasures();

            // Send error response to parent
            this.sendResponse(error.message);
        }
    }

    /**
     * Stop the agent
     */
    async stop() {
        if (this.state === AGENT_STATES.IDLE || this.state === AGENT_STATES.STOPPED) {
            return;
        }

        this.state = AGENT_STATES.STOPPING;
        await this.logger.logInfo('Agent stopping...', [], this.currentRunId);
        await this.updateState();

        // Override this method in subclasses for cleanup
        await this.onStop();

        this.runEndTime = new Date().toISOString();
        this.state = AGENT_STATES.STOPPED;

        await this.logger.logInfo('Agent stopped', [], this.currentRunId);
        await this.updateState();
        await this.savePerformanceMeasures();

        this.sendResponse();
    }

    /**
     * Pause the agent
     */
    async pause() {
        if (this.state !== AGENT_STATES.RUNNING) {
            throw new Error(await this._t('Cannot pause agent in state: {0}', [this.state]));
        }

        this.state = AGENT_STATES.PAUSED;
        await this.logger.logInfo('Agent paused', [], this.currentRunId);
        await this.updateState();

        // Override this method in subclasses
        await this.onPause();

        this.sendResponse();
    }

    /**
     * Resume the agent
     */
    async resume() {
        if (this.state !== AGENT_STATES.PAUSED) {
            throw new Error(await this._t('Cannot resume agent in state: {0}', [this.state]));
        }

        this.state = AGENT_STATES.RUNNING;
        await this.logger.logInfo('Agent resumed', [], this.currentRunId);
        await this.updateState();

        // Override this method in subclasses
        await this.onResume();

        this.sendResponse();
    }

    /**
     * Exit the agent process
     */
    async exit() {
        await this.logger.logInfo('Agent exiting...', [], this.currentRunId);
        await this.stop();
        process.exit(0);
    }

    /**
     * Create run directory structure
     */
    async createRunDirectory() {
        const runDir = this.getRunDirectory();
        await fs.mkdir(runDir, { recursive: true });
    }

    /**
     * Get run directory path
     */
    getRunDirectory() {
        return join(process.cwd(), 'run', this.agentName, this.currentRunId);
    }

    /**
     * Save run configuration
     */
    async saveRunConfig(runConfig) {
        const configPath = join(this.getRunDirectory(), FILE_NAMES.CONFIG);
        await fs.writeFile(configPath, JSON.stringify(runConfig, null, 2));
    }

    /**
     * Update agent state file
     */
    async updateState() {
        const stateData = {
            state: this.state,
            runId: this.currentRunId,
            startTime: this.runStartTime,
            endTime: this.runEndTime,
            error: this.state === AGENT_STATES.ERROR ? await this._t('Agent encountered an error') : null
        };

        const statePath = join(this.getRunDirectory(), FILE_NAMES.STATE);
        await fs.writeFile(statePath, JSON.stringify(stateData, null, 2));
    }

    /**
     * Save performance measures
     */
    async savePerformanceMeasures() {
        if (!this.runStartTime || !this.runEndTime) {
            return;
        }

        const startTime = new Date(this.runStartTime);
        const endTime = new Date(this.runEndTime);
        const duration = endTime - startTime;

        const performanceData = {
            startTime: this.runStartTime,
            endTime: this.runEndTime,
            duration: `${duration}ms`,
            state: this.state
        };

        const performancePath = join(this.getRunDirectory(), FILE_NAMES.PERFORMANCE_MEASURES);
        await fs.writeFile(performancePath, JSON.stringify(performanceData, null, 2));
    }

    /**
     * Send response to parent process
     */
    sendResponse(errorMessage = null) {
        const response = {
            state: this.state,
            runProperties: {
                [RUN_PROPERTIES.START_TIME]: this.runStartTime,
                [RUN_PROPERTIES.END_TIME]: this.runEndTime,
                [RUN_PROPERTIES.DURATION]: this.runStartTime && this.runEndTime ?
                    `${new Date(this.runEndTime) - new Date(this.runStartTime)}ms` : null,
                [RUN_PROPERTIES.STATE]: this.state,
                [RUN_PROPERTIES.ERROR]: errorMessage
            }
        };

        if (process.send) {
            process.send(response);
        }
    }

    /**
     * Abstract method to be implemented by subclasses
     */
    async run(runConfig) {
        throw new Error(await this._t('run method must be implemented by subclass'));
    }

    /**
     * Optional lifecycle methods to be overridden by subclasses
     */
    async onStop() {
        // Override in subclass if needed
    }

    async onPause() {
        // Override in subclass if needed
    }

    async onResume() {
        // Override in subclass if needed
    }
}

export default AgentBase;
