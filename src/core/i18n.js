import { promises as fs } from 'fs';
import { join } from 'path';
import { DIR_STRUCTURE, ERROR_MESSAGES } from './agent-consts.js';

let cachedGlobals = null;
let cachedLang = null;

async function readJson(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
}

export async function getDefaultLang() {
    if (cachedGlobals) {
        return cachedGlobals.lang;
    }

    try {
        cachedGlobals = await readJson(join(process.cwd(), DIR_STRUCTURE.SRC, DIR_STRUCTURE.CORE, 'globals.json'));
        if (!cachedGlobals || typeof cachedGlobals.lang !== 'string') {
            cachedGlobals = { lang: 'en' };
        }
    } catch {
        cachedGlobals = { lang: 'en' };
    }

    return cachedGlobals.lang;
}

export async function resolveLang() {
    if (cachedLang) {
        return cachedLang;
    }

    cachedLang = process.env.AGENT_LANG || await getDefaultLang();
    return cachedLang;
}

export function formatText(text, params) {
    if (!params || params.length === 0) {
        return text;
    }

    let result = text;
    for (let i = 0; i < params.length; i += 1) {
        result = result.replaceAll(`{${i}}`, String(params[i]));
    }
    return result;
}

export async function loadTextMap(filePath) {
    try {
        const map = await readJson(filePath);
        if (!map || typeof map !== 'object') {
            return {};
        }
        return map;
    } catch {
        return {};
    }
}

export async function loadCoreTexts(lang) {
    return loadTextMap(join(process.cwd(), DIR_STRUCTURE.SRC, DIR_STRUCTURE.CORE, DIR_STRUCTURE.RESOURCES, `text-${lang}.json`));
}

export async function loadAgentTexts(agentName, lang, agentCategory) {
    if (!agentName) {
        throw new Error(ERROR_MESSAGES.AGENT_NAME_REQUIRED);
    }
    if (!agentCategory) {
        throw new Error(ERROR_MESSAGES.AGENT_CATEGORY_REQUIRED);
    }

    const agentPath = join(process.cwd(), DIR_STRUCTURE.SRC, DIR_STRUCTURE.AGENTS, agentCategory, agentName, DIR_STRUCTURE.RESOURCES, `text-${lang}.json`);
    return loadTextMap(agentPath);
}
