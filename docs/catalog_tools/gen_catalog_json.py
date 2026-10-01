"""Writes db/seed/catalog.json: every costed catalog item as the app's item JSON.

    py gen_catalog_json.py [output path]

Each item has the shape the API takes (itemName, itemSize, category, description, attributeList,
tagList, limitList, modifierList, taskList), except that attribute rows name their attribute
(`attribute`, the `attribute` table's AttributeName) instead of its database ID; the importer
(db/seed/import_catalog.php) looks the IDs up. Extra fields for checking and reference:

    catalogRows   the catalog's rows as printed: [label, detail, BP]
    catalogRow    on each attribute/tag/limit row: the index of the catalog row it came from
    catalogBP     the catalog's total; catalogCR its formula CR; printedCR/printedCC the book's
    notes         anything the export couldn't carry over exactly

client/src/domain/catalog.test.js costs every item with the app's rules and compares.
"""
import json
import os
import sys

from costs import cr_of
import items

DESC = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'descriptions.json'), encoding='utf-8'))

# Sub-rows each attribute takes, as in client/src/domain/rules (`children`).
ATTACK_CHILDREN = {'Attack Multiplier', 'Far Ranged', 'Counter', 'Bleed', 'Resource', 'Modifier'}
CHILDREN = {
    'Attack': ATTACK_CHILDREN | {'Area'},
    'Attack (Melee)': ATTACK_CHILDREN,
    'Armor Rating': {'Regeneration', 'Shrouded Hull', 'Counter'},
    'Body': {'Regeneration'},
    'Force Field': {'Regeneration'},
    'Drive': {'Maneuver', 'Resource'},
    'Power Supply': {'Resource'},
    'Launchers': {'Resource'},
    'Communication (Ansible)': {'Resource'},
    'Manufacture': {'Resource'},
    'Computer': {'Task'},
}

# The System column for top-level rows (sub-rows follow their parent).
SYSTEMS = {
    'Attack': 'Weapons', 'Attack (Melee)': 'Weapons', 'Anti-Missile': 'Weapons', 'Launchers': 'Weapons',
    'Area': 'Weapons', 'Bleed': 'Weapons', 'Counter': 'Effects',
    'Armor Rating': 'Structure', 'Body': 'Structure', 'Force Field': 'Structure', 'Regeneration': 'Structure',
    'Power Supply': 'Power', 'Resource': 'Supplies',
    'Drive': 'Propulsion', 'Maneuver': 'Propulsion',
    'Communication (Radio)': 'Communications', 'Communication (Laser Link)': 'Communications',
    'Communication (Ansible)': 'Communications', 'Communication (Hypercomms)': 'Communications',
    'Computer': 'Electronics', 'Task': 'Electronics', 'Neural Interface': 'Electronics', 'Link': 'Electronics',
    'Life Support': 'Support', 'Cargo': 'Support', 'Hangar': 'Support', 'Manufacture': 'Support',
    'Gravity Control': 'Support', 'Modifier': 'Modifiers',
}


def attack_system(label):
    """'Attack (heavy plasma cannon)' -> 'Heavy plasma cannon'; a plain 'Attack' -> 'Weapons'."""
    if not label or '(' not in label:
        return 'Weapons'
    inner = label[label.index('(') + 1:label.rindex(')')].strip()
    return inner[:1].upper() + inner[1:]


def export(it):
    out = {
        'itemName': it['name'], 'itemSize': it['size'].upper(), 'category': it['cat'],
        'description': DESC.get(it['name'], ''), 'page': it['page'],
        'printedCR': it['cr'], 'printedCC': it['cc'], 'extra': it['extra'],
        'catalogBP': sum(bp for _, _, bp in it['rows']), 'catalogCR': None,
        'catalogRows': [list(row) for row in it['rows']],
        'attributeList': [], 'tagList': [], 'limitList': [], 'modifierList': [], 'taskList': [], 'notes': [],
    }
    out['catalogCR'] = cr_of(it['size'], out['catalogBP'])
    attrs = out['attributeList']
    parent = None  # the last top-level attribute row: where a sub-row can go

    def add(spec, index, parent_row):
        row = {
            'id': len(attrs) + 1, 'parentId': parent_row['id'] if parent_row else None,
            'AttributeSystem': None, 'attribute': spec['attr'],
            'Scale': str(spec['grade']) if spec['grade'] else '1', 'Rank': spec['rank'],
            'Implementation': spec['impl'], 'catalogRow': index,
        }
        if parent_row is None:
            row['AttributeSystem'] = attack_system(spec.get('label')) if spec['attr'].startswith('Attack') else SYSTEMS.get(spec['attr'], 'Other')
        attrs.append(row)
        if spec['attr'] == 'Modifier':
            out['modifierList'].append({'modifierID': f"Modifier_{row['id']}", 'modifierName': spec['skill']})
        if spec['attr'] == 'Task':
            out['taskList'].append({'taskID': f"Task_{row['id']}", 'taskName': spec['task']})
        for child in spec['children']:
            add(child, index, row)
        return row

    for index, row in enumerate(it['rows']):
        spec = row.spec
        if spec is None:
            out['notes'].append(f"Row {index} ({row[0]}: {row[1]}) has no spec.")
            continue
        if 'skip' in spec:
            if row[2] != 0:
                out['notes'].append(f"Row {index} ({row[0]}) skipped ({spec['skip']}) but costs {row[2]} BP.")
            continue
        if 'tag' in spec:
            out['tagList'].append({'id': len(out['tagList']) + 1, 'TagDesc': spec['tag'], 'TagRank': str(spec['rank']),
                                   'TagFree': spec['free'], 'catalogRow': index})
            continue
        if 'limit' in spec:
            out['limitList'].append({'id': len(out['limitList']) + 1, 'LimitDesc': spec['limit'],
                                     'LimitScale': str(spec['grade']), 'catalogRow': index})
            continue
        group = spec['group'] if 'group' in spec else [spec]
        for one in group:
            if one['attr'] == 'Maneuver':
                # Maneuver is bought at the largest Drive's grade (spec §5.11), so it goes under the
                # Drive of its own grade, or the highest-grade one; not just the Drive above it.
                drives = [a for a in attrs if a['attribute'] == 'Drive' and a['parentId'] is None]
                if drives:
                    same = [d for d in drives if int(d['Scale']) == one['grade']]
                    add(one, index, same[0] if same else max(drives, key=lambda d: int(d['Scale'])))
                    continue
            nests = one['sub'] and parent is not None and one['attr'] in CHILDREN.get(parent['attribute'], set())
            added = add(one, index, parent if nests else None)
            if not nests:
                parent = added
    return out


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, '..', '..', 'db', 'seed', 'catalog.json')
    exported = [export(it) for it in items.I if it['compute']]
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump({'source': 'docs/equipment_catalog.md (generated by docs/catalog_tools/gen_catalog_json.py)',
                   'items': exported}, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    notes = sum(len(e['notes']) for e in exported)
    print(f"{len(exported)} items, {sum(len(e['attributeList']) for e in exported)} attribute rows, {notes} notes -> {os.path.normpath(path)}")
    for e in exported:
        for n in e['notes']:
            print(f"  {e['itemName']}: {n}")


if __name__ == '__main__':
    main()
