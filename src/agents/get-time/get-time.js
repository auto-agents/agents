import AgentBase from '../../core/agent-base.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { LOG_LEVELS } from '../../core/agent-consts.js';

class GetTimeAgent extends AgentBase {
    constructor() {
        super('get-time');
        this.interval = null;
        this.isPaused = false;
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
            // Load configuration
            await this.loadConfiguration(runConfig);

            await this.log(
                LOG_LEVELS.INFO,
                'Starting time output agent with interval: {0}s, timezone: {1}, output file: {2}',
                this.config.interval,
                this.config.timezone,
                this.config.outputFile
            );

            // Start the time output loop
            await this.startTimeOutput();

        } catch (error) {
            await this.log(LOG_LEVELS.ERROR, 'Failed to run get-time agent: {0}', error.message);
            throw error;
        }
    }

    /**
     * Load configuration from run config and default config
     */
    async loadConfiguration(runConfig) {
        try {
            // Load default config
            const defaultConfigPath = join(process.cwd(), 'src', 'agents', 'get-time', 'config.json');
            const defaultConfigContent = await fs.readFile(defaultConfigPath, 'utf8');
            const defaultConfig = JSON.parse(defaultConfigContent);

            // Merge with run config
            this.config = { ...defaultConfig, ...runConfig.config };

            await this.log(
                LOG_LEVELS.INFO,
                'Configuration loaded: interval={0}s, timezone={1}, outputFile={2}',
                this.config.interval,
                this.config.timezone,
                this.config.outputFile
            );

        } catch (error) {
            await this.log(LOG_LEVELS.WARNING, 'Failed to load configuration, using defaults: {0}', error.message);
            // Use defaults if config file doesn't exist
            if (runConfig.config) {
                this.config = { ...this.config, ...runConfig.config };
            }
        }
    }

    /**
     * Start the time output loop
     */
    async startTimeOutput() {
        if (this.config.interval === 0) {
            // Run only once
            await this.log(LOG_LEVELS.INFO, 'Running agent once (interval = 0)');
            await this.outputCurrentTime();
            await this.log(LOG_LEVELS.INFO, 'Single run completed');
            return;
        }

        return new Promise((resolve, reject) => {
            this.interval = setInterval(async () => {
                if (this.state === 'stopping') {
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
                        await this.log(LOG_LEVELS.ERROR, 'Error outputting time: {0}', error.message);
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
            const outputDir = join(this.getRunDirectory(), 'output');
            await fs.mkdir(outputDir, { recursive: true });

            // Write to output file in output directory
            const outputPath = join(outputDir, this.config.outputFile);
            await fs.writeFile(outputPath, output, 'utf8');

            await this.log(LOG_LEVELS.INFO, 'Time output written: {0}', formattedTime);

        } catch (error) {
            await this.log(LOG_LEVELS.ERROR, 'Failed to output time: {0}', error.message);
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
            this.log(LOG_LEVELS.ERROR, 'Error formatting time: {0}', error.message);
            // Fallback to basic formatting
            return date.toISOString().replace('T', ' ').substring(0, 19);
        }
    }

    /**
     * Handle pause - stop interval but keep state
     */
    async onPause() {
        this.isPaused = true;
        await this.log(LOG_LEVELS.INFO, 'Agent paused - time output stopped');
    }

    /**
     * Handle resume - restart interval
     */
    async onResume() {
        this.isPaused = false;
        await this.log(LOG_LEVELS.INFO, 'Agent resumed - time output restarted');
    }

    /**
     * Handle stop - cleanup interval
     */
    async onStop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        await this.log(LOG_LEVELS.INFO, 'Agent stopped - interval cleared');
    }
}

export default GetTimeAgent;

// Instantiate the agent when this file is run directly
const agent = new GetTimeAgent();
