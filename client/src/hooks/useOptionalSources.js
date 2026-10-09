import { useCallback, useState } from 'react';
import { SOURCES } from '../domain/rules/sources.js';

const STORAGE_KEY = 'ssgs.optionalSources';

/** The saved choice, or everything off. Storage can be missing or blocked (a private window). */
function load() {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
        return Object.fromEntries(Object.keys(SOURCES).map((key) => [key, saved?.[key] === true]));
    } catch {
        return Object.fromEntries(Object.keys(SOURCES).map((key) => [key, false]));
    }
}

/**
 * Which optional sources (supplements, rules/sources.js) are switched on: { decisiveAction: bool }.
 * They start off, since they're possibilities rather than core; the choice is remembered in this
 * browser.
 * @returns {{ sources: Record<string, boolean>, setSource: (key: string, on: boolean) => void }}
 */
export function useOptionalSources() {
    const [sources, setSources] = useState(load);
    const setSource = useCallback((key, on) => {
        setSources((current) => {
            const next = { ...current, [key]: on };
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // not remembered; the switch still works for this visit
            }
            return next;
        });
    }, []);
    return { sources, setSource };
}
