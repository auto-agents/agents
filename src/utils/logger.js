import { promises as fs } from 'fs';
import { join } from 'path';
import {
    formatText,
    loadAgentTexts,
    loadCoreTexts,
    resolveLang
} from '../core/i18n.js';

class Logger {
    constructor(agentName, agentCategory = null) {
        this.agentName = agentName;
        this.agentCategory = agentCategory;
        this._lang = null;
        this._coreTexts = null;
        this._agentTexts = null;
        this._textsLoaded = null;
    }

    async _ensureTextsLoaded() {
        if (this._textsLoaded) {
            return this._textsLoaded;
        }

        this._textsLoaded = (async () => {
            this._lang = await resolveLang();
            this._coreTexts = await loadCoreTexts(this._lang);
            this._agentTexts = await loadAgentTexts(this.agentName, this._lang, this.agentCategory);
        })();

        return this._textsLoaded;
    }

    async _t(textKey, params = []) {
        await this._ensureTextsLoaded();

        const candidate = this._agentTexts?.[textKey] ?? this._coreTexts?.[textKey] ?? textKey;
        return formatText(candidate, params);
    }

    async log(level, textKey, params = [], runId = null) {
        const timestamp = new Date().toISOString();
        const message = await this._t(textKey, params);
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

        console.log(logEntry.trim());

        if (runId) {
            const logPath = join(process.cwd(), 'run', this.agentName, runId, 'run.log');
            try {
                await fs.appendFile(logPath, logEntry);
            } catch (error) {
                console.error(await this._t('Failed to write to log file: {0}', [error.message]));
            }
        }
    }

    async logInfo(textKey, params = [], runId = null) {
        await this.log('INFO', textKey, params, runId);
    }

    async logWarning(textKey, params = [], runId = null) {
        await this.log('WARNING', textKey, params, runId);
    }

    async logError(textKey, params = [], runId = null) {
        await this.log('ERROR', textKey, params, runId);
    }
}

export default Logger;
