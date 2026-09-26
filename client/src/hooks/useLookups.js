import { useEffect, useState } from 'react';
import { fetchLookups } from '../api/itemCreatorApi.js';

/**
 * Loads the reference tables once.
 * @returns {{ lookups: object | null, error: string | null }} lookups is null until loaded
 */
export function useLookups() {
    const [state, setState] = useState({ lookups: null, error: null });

    useEffect(() => {
        const controller = new AbortController();
        fetchLookups(controller.signal)
            .then((lookups) => setState({ lookups, error: null }))
            .catch((e) => {
                if (e.name !== 'AbortError') {
                    setState({ lookups: null, error: e.message });
                }
            });
        return () => controller.abort();
    }, []);

    return state;
}
