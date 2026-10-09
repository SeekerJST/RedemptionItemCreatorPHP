// Where a rule comes from. The core book's rules are always on; a supplement's attributes and
// implementations (marked `source` in the rules) are optional content the user switches on.

export const SOURCES = {
    decisiveAction: { name: 'Decisive Action', description: 'Gear, attributes and implementations from the Decisive Action supplement' },
};

/** The catalog's book names (item.Source / catalog.json `source`) -> the keys above. */
export const SOURCE_KEYS_BY_NAME = { 'Decisive Action': 'decisiveAction' };

/** True if something from `source` is available with these optional sources switched on. */
export function sourceEnabled(source, enabled) {
    return !source || !(source in SOURCES) || Boolean(enabled?.[source]);
}

/** The optional source a catalog item belongs to, from its book name; null for core content. */
export const itemSourceKey = (sourceName) => SOURCE_KEYS_BY_NAME[sourceName] ?? null;
