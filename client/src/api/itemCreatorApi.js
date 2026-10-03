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
    const [sizes, attributes, skills] = await Promise.all([
        getJson('getitemsizesds', signal),
        getJson('getitemattributesds', signal),
        getJson('getskillsds', signal),
    ]);
    return { sizes, attributes, skills };
}

const sendJson = (path, method, body) =>
    request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Summaries of the saved items: [{ itemID, itemName, itemSize, CostRating }], by name. */
export const fetchItemList = (signal) => getJson('getallitems', signal);

/** One saved item, in the shape toApiItem produces. */
export const fetchItem = (itemId) => getJson(`getitem/${encodeURIComponent(itemId)}`);

/** Creates the item (no itemID yet) or replaces the saved one. Resolves to the saved item, with its itemID. */
export async function saveItem(apiItem) {
    const response = apiItem.itemID
        ? await sendJson(`updateitem/${encodeURIComponent(apiItem.itemID)}`, 'PUT', apiItem)
        : await sendJson('createitem', 'POST', apiItem);
    return response.json();
}

export const deleteItem = (itemId) => request(`deleteitem/${encodeURIComponent(itemId)}`, { method: 'DELETE' });

/** Hands a file to the browser to save, under `fileName`. */
export function saveFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** Asks the API to render a stat block (domain/statBlock.js) as a PDF and saves it through the browser. */
export async function downloadItemPdf(statBlock, fileName) {
    const response = await request('exportitemtopdf/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statBlock),
    });
    saveFile(await response.blob(), fileName);
}

/** Asks the API to render the item as CSV and saves it through the browser. */
export async function downloadItemCsv(apiItem, fileName) {
    const response = await request('exportitemtocvs/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiItem),
    });
    saveFile(await response.blob(), fileName);
}
