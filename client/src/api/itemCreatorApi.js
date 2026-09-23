// Calls to the PHP API. URLs are relative so the app works from a subfolder of the site.

const BASE = 'itemcreator';

async function request(path, options = {}) {
    const response = await fetch(`${BASE}/${path}`, options);
    if (!response.ok) {
        // Error bodies are RFC 7807 problem JSON: { title, status, detail }.
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || problem?.title || `${response.status} ${response.statusText}`);
    }
    return response;
}

const getJson = (path, signal) => request(path, { signal }).then((response) => response.json());

/** All the reference data the item creator needs, loaded in parallel. */
export async function fetchLookups(signal) {
    const [sizes, attributes, scales, skills] = await Promise.all([
        getJson('getitemsizesds', signal),
        getJson('getitemattributesds', signal),
        getJson('getattributescaleds', signal),
        getJson('getskillsds', signal),
    ]);
    return { sizes, attributes, scales, skills };
}

/** Asks the API to render the item as CSV and saves it through the browser. */
export async function downloadItemCsv(apiItem) {
    const response = await request('exportitemtocvs/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiItem),
    });

    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `${apiItem.itemName || 'item'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
