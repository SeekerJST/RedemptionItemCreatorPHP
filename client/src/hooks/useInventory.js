import { useCallback, useEffect, useState } from 'react';
import { fetchItemList } from '../api/itemCreatorApi.js';

/**
 * The saved-item list for the Inventory panel.
 * @returns {{ items: object[] | null, error: string | null, refresh: () => void }} items is null until loaded
 */
export function useInventory() {
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
    }, [version]);

    const refresh = useCallback(() => setVersion((v) => v + 1), []);
    return { ...state, refresh };
}
