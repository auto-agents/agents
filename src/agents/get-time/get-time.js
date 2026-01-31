import AgentBase from '../../core/agent-base.js';
import { promises as fs } from 'fs';
import { join } from 'path';

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

            this.log('info', `Starting time output agent with interval: ${this.config.interval}s, timezone: ${this.config.timezone}, output file: ${this.config.outputFile}`);

            // Start the time output loop
            await this.startTimeOutput();

        } catch (error) {
            this.log('error', `Failed to run get-time agent: ${error.message}`);
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

            this.log('info', `Configuration loaded: interval=${this.config.interval}s, timezone=${this.config.timezone}, outputFile=${this.config.outputFile}`);

        } catch (error) {
            this.log('warning', `Failed to load configuration, using defaults: ${error.message}`);
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
                        this.log('error', `Error outputting time: ${error.message}`);
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

            // Write to output file in run directory
            const outputPath = join(this.getRunDirectory(), this.config.outputFile);
            await fs.writeFile(outputPath, output);

            this.log('info', `Time output written: ${formattedTime}`);

        } catch (error) {
            this.log('error', `Failed to output time: ${error.message}`);
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
            this.log('error', `Error formatting time: ${error.message}`);
            // Fallback to basic formatting
            return date.toISOString().replace('T', ' ').substring(0, 19);
        }
    }

    /**
     * Handle pause - stop interval but keep state
     */
    async onPause() {
        this.isPaused = true;
        this.log('info', 'Agent paused - time output stopped');
    }

    /**
     * Handle resume - restart interval
     */
    async onResume() {
        this.isPaused = false;
        this.log('info', 'Agent resumed - time output restarted');
    }

    /**
     * Handle stop - cleanup interval
     */
    async onStop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.log('info', 'Agent stopped - interval cleared');
    }
}

export default GetTimeAgent;
