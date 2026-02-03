import { fork } from 'child_process';
import { join } from 'path';
import { AGENT_COMMANDS, ERROR_MESSAGES } from '../../../core/agent-consts.js';

class TestAgent {
    constructor() {
        this.agentProcess = null;
        this.agentName = 'get-time';
        this.agentCategory = 'system';

        // Validate required properties
        if (!this.agentName) {
            throw new Error(ERROR_MESSAGES.AGENT_NAME_REQUIRED);
        }
        if (!this.agentCategory) {
            throw new Error(ERROR_MESSAGES.AGENT_CATEGORY_REQUIRED);
        }

        this.config = {
            interval: 5,
            timezone: 'UTC',
            outputFile: 'output.txt'
        };
    }

    /**
     * Run the agent according to the specification
     */
    async run() {
        try {
            console.log('Starting test agent...');

            // Spawn the agent process with IPC channel
            const agentPath = join(process.cwd(), 'src', 'agents', this.agentCategory, this.agentName, 'get-time.js');
            this.agentProcess = fork(agentPath, [], {
                stdio: 'inherit',
                ipc: true
            });

            // Prepare run configuration
            const runConfig = {
                input: [], // No input files as specified
                config: this.config
            };

            // Listen for messages from the agent
            this.agentProcess.on('message', (response) => {
                console.log('Agent response:', JSON.stringify(response, null, 2));

                if (response.state === 'stopped' || response.state === 'error') {
                    console.log('Agent finished. Run properties:', response.runProperties);
                    process.exit(0);
                }
            });

            // Handle agent process errors
            this.agentProcess.on('error', (error) => {
                console.error('Agent process error:', error);
                process.exit(1);
            });

            // Handle agent process exit
            this.agentProcess.on('exit', (code, signal) => {
                console.log(`Agent process exited with code ${code}, signal ${signal}`);
                process.exit(code || 0);
            });

            // Send start command to the agent
            console.log('Sending start command to agent...');
            this.agentProcess.send({
                command: AGENT_COMMANDS.START,
                runConfig: runConfig
            });

            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('Received SIGINT, stopping agent...');
                if (this.agentProcess && !this.agentProcess.killed) {
                    this.agentProcess.send({ command: AGENT_COMMANDS.STOP });
                }
            });

            process.on('SIGTERM', () => {
                console.log('Received SIGTERM, stopping agent...');
                if (this.agentProcess && !this.agentProcess.killed) {
                    this.agentProcess.send({ command: AGENT_COMMANDS.STOP });
                }
            });

            // Keep the test running for a limited time
            console.log('Test agent is running. Will stop after 15 seconds...');

            // Auto-stop after 15 seconds for testing
            setTimeout(() => {
                console.log('Test timeout reached, stopping agent...');
                if (this.agentProcess && !this.agentProcess.killed) {
                    this.agentProcess.send({ command: AGENT_COMMANDS.STOP });
                }
            }, 15000);

        } catch (error) {
            console.error('Failed to run test agent:', error);
            process.exit(1);
        }
    }

    /**
     * Send commands to the agent
     */
    sendCommand(command, additionalData = {}) {
        if (this.agentProcess && !this.agentProcess.killed) {
            this.agentProcess.send({ command, ...additionalData });
        } else {
            console.error('Agent process is not running');
        }
    }

    /**
     * Pause the agent
     */
    pause() {
        console.log('Pausing agent...');
        this.sendCommand(AGENT_COMMANDS.PAUSE);
    }

    /**
     * Resume the agent
     */
    resume() {
        console.log('Resuming agent...');
        this.sendCommand(AGENT_COMMANDS.RESUME);
    }

    /**
     * Stop the agent
     */
    stop() {
        console.log('Stopping agent...');
        this.sendCommand(AGENT_COMMANDS.STOP);
    }
}

// Create and run the test agent
const testAgent = new TestAgent();
testAgent.run().catch(error => {
    console.error('Test agent failed:', error);
    process.exit(1);
});
