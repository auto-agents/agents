import AgentBase from '../../../core/agent-base.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FILE_NAMES, AGENT_STATES, DIR_STRUCTURE } from '../../../core/agent-consts.js';

class GetTimeAgent extends AgentBase {
    constructor() {
        super('get-time', 'system');
        this.interval = null;
        this.isPaused = false;
        // Set default config - will be merged with loaded config
        this.config = {
            interval: 5,
            timezone: 'UTC',
            outputFile: 'output.txt'
        };
    }

    /**
     * Main agent run method
     */
    async run(runConfig) {
        try {
            await this.logger.logInfo(
                'Starting time output agent with interval: {0}s, timezone: {1}, output file: {2}',
                [this.config.interval, this.config.timezone, this.config.outputFile],
                this.currentRunId
            );

            // Start the time output loop
            await this.startTimeOutput();

        } catch (error) {
            await this.logger.logError('Failed to run get-time agent: {0}', [error.message], this.currentRunId);
            throw error;
        }
    }

    /**
     * Called after configuration is successfully loaded
     * Add custom logging for configuration loading
     */
    async onConfigurationLoaded() {
        await this.logger.logInfo(
            'Configuration loaded: interval={0}s, timezone={1}, outputFile={2}',
            [this.config.interval, this.config.timezone, this.config.outputFile],
            this.currentRunId
        );
    }

    /**
     * Start the time output loop
     */
    async startTimeOutput() {
        if (this.config.interval === 0) {
            // Run only once
            await this.logger.logInfo('Running agent once (interval = 0)', [], this.currentRunId);
            await this.outputCurrentTime();
            await this.logger.logInfo('Single run completed', [], this.currentRunId);
            return;
        }

        return new Promise((resolve, reject) => {
            this.interval = setInterval(async () => {
                if (this.state === AGENT_STATES.STOPPING) {
                    if (this.interval) {
                        clearInterval(this.interval);
                        this.interval = null;
                    }
                    resolve();
                    return;
                }

                if (!this.isPaused) {
                    try {
                        await this.outputCurrentTime();
                    } catch (error) {
                        await this.logger.logError('Error outputting time: {0}', [error.message], this.currentRunId);
                        reject(error);
                        return;
                    }
                }
            }, this.config.interval * 1000);

            // Output first time immediately
            this.outputCurrentTime().catch(reject);
        });
    }

    /**
     * Output current time to file
     */
    async outputCurrentTime() {
        try {
            const now = new Date();

            // Format time according to timezone
            const formattedTime = this.formatTime(now);

            // Create output string
            const output = `${formattedTime}\n`;

            // Create output directory if it doesn't exist
            const outputDir = join(this.getRunDirectory(), DIR_STRUCTURE.OUTPUT);
            await fs.mkdir(outputDir, { recursive: true });

            // Write to output file in output directory
            const outputPath = join(outputDir, this.config.outputFile);
            await fs.writeFile(outputPath, output, 'utf8');

            await this.logger.logInfo('Time output written: {0}', [formattedTime], this.currentRunId);

        } catch (error) {
            await this.logger.logError('Failed to output time: {0}', [error.message], this.currentRunId);
            throw error;
        }
    }

    /**
     * Format time according to timezone and format
     */
    formatTime(date) {
        try {
            // Simple timezone handling for common timezones
            let adjustedDate = new Date(date);

            if (this.config.timezone !== 'UTC') {
                // Handle basic timezone offsets
                const timezoneOffsets = {
                    'UTC': 0,
                    'EST': -5,
                    'EDT': -4,
                    'CST': -6,
                    'CDT': -5,
                    'MST': -7,
                    'MDT': -6,
                    'PST': -8,
                    'PDT': -7
                };

                const offset = timezoneOffsets[this.config.timezone] || 0;
                adjustedDate = new Date(date.getTime() + (offset * 60 * 60 * 1000));
            }

            // Format as YYYY-MM-DD HH:mm:ss
            const year = adjustedDate.getFullYear();
            const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const hours = String(adjustedDate.getHours()).padStart(2, '0');
            const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
            const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        } catch (error) {
            console.error('Error formatting time:', error.message);
            // Fallback to basic formatting
            return date.toISOString().replace('T', ' ').substring(0, 19);
        }
    }

    /**
     * Handle pause - stop interval but keep state
     */
    async onPause() {
        this.isPaused = true;
        await this.logger.logInfo('Agent paused - time output stopped', [], this.currentRunId);
    }

    /**
     * Handle resume - restart interval
     */
    async onResume() {
        this.isPaused = false;
        await this.logger.logInfo('Agent resumed - time output restarted', [], this.currentRunId);
    }

    /**
     * Handle stop - cleanup interval
     */
    async onStop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        await this.logger.logInfo('Agent stopped - interval cleared', [], this.currentRunId);
    }
}

export default GetTimeAgent;

// Instantiate the agent when this file is run directly
const agent = new GetTimeAgent();
