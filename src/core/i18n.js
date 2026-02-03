import { promises as fs } from 'fs';
import { join } from 'path';

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
        cachedGlobals = await readJson(join(process.cwd(), 'src', 'core', 'globals.json'));
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
    return loadTextMap(join(process.cwd(), 'src', 'core', 'resources', `text-${lang}.json`));
}

export async function loadAgentTexts(agentName, lang, agentCategory = null) {
    const agentPath = agentCategory
        ? join(process.cwd(), 'src', 'agents', agentCategory, agentName, 'resources', `text-${lang}.json`)
        : join(process.cwd(), 'src', 'agents', agentName, 'resources', `text-${lang}.json`);
    return loadTextMap(agentPath);
}
