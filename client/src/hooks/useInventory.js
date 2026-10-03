import { useCallback, useEffect, useState } from 'react';
import { fetchItemList } from '../api/itemCreatorApi.js';

/**
 * The saved-item list for the Inventory panel: the public catalog, plus the signed-in user's own.
 * @param {number | null} userId who's signed in; the list reloads when it changes
 * @returns {{ items: object[] | null, error: string | null, refresh: () => void }} items is null until loaded
 */
export function useInventory(userId = null) {
    const [state, setState] = useState({ items: null, error: null });
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        fetchItemList(controller.signal)
            .then((items) => setState({ items, error: null }))
            .catch((e) => {
                if (e.name !== 'AbortError') {
                    setState((previous) => ({ items: previous.items, error: e.message }));
                }
            });
        return () => controller.abort();
    }, [version, userId]);

    const refresh = useCallback(() => setVersion((v) => v + 1), []);
    return { ...state, refresh };
}
