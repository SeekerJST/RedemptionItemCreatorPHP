import { Button } from '@svar-ui/react-core';

const READ_ONLY_HINT = 'Public items are read-only: copy it to make changes';

/**
 * New/Save/Copy/Delete toolbar, item name, category, and size picker.
 *
 * status: { kind: 'ok' | 'error' | 'busy', text } shown under the toolbar, or null.
 * confirm: { message, actionLabel, onConfirm } asks before something that loses work, or null.
 * An inline question rather than window.confirm, so nothing blocks the page.
 * readOnly: a public item; its fields are locked and only New and Copy are offered.
 * categories: existing categories, suggested in the Category field.
 */
export default function ItemHeader({
    name,
    category,
    size,
    sizes,
    categories,
    readOnly,
    onNameChange,
    onCategoryChange,
    onSizeChange,
    toolbar,
    status,
    confirm,
    onCancelConfirm,
}) {
    const { onNew, onSave, onCopy, onDelete, canCopy, canDelete, saveHint, busy } = toolbar;

    return (
        <div className="item_name_field">
            <div className="toolBar">
                <Button type="primary" disabled={busy} title="Start a new, empty item" onClick={onNew}>[New]</Button>&nbsp;
                <Button
                    type="primary"
                    disabled={busy || readOnly || saveHint !== null}
                    title={readOnly ? READ_ONLY_HINT : (saveHint ?? 'Save this item')}
                    onClick={onSave}
                >
                    [Save]
                </Button>&nbsp;
                <Button
                    type="primary"
                    disabled={busy || !canCopy}
                    title={canCopy ? 'Make an editable copy of this item' : 'Only a saved item can be copied'}
                    onClick={onCopy}
                >
                    [Copy]
                </Button>&nbsp;
                <Button
                    type="primary"
                    disabled={busy || readOnly || !canDelete}
                    title={readOnly ? READ_ONLY_HINT : (canDelete ? 'Delete this item' : 'Only a saved item can be deleted')}
                    onClick={onDelete}
                >
                    [Delete]
                </Button>
            </div>
            {confirm ? (
                <div className="toolbar_message confirm" role="alertdialog" aria-label={confirm.message}>
                    {confirm.message}&nbsp;
                    <Button type="danger" onClick={confirm.onConfirm}>[{confirm.actionLabel}]</Button>&nbsp;
                    <Button onClick={onCancelConfirm}>[Cancel]</Button>
                </div>
            ) : (
                <>
                    {status && (
                        <div className={`toolbar_message ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
                            {status.text}
                        </div>
                    )}
                    {readOnly && <div className="toolbar_message readonly">Public item: read-only. [Copy] it to make your own version.</div>}
                </>
            )}
            <table>
                <tbody>
                    <tr>
                        <td className="headerCellLeft">
                            <label htmlFor="item_name_fld">Name </label>
                            <input
                                type="text"
                                id="item_name_fld"
                                className="item_TextField"
                                value={name}
                                readOnly={readOnly}
                                onChange={(e) => onNameChange(e.target.value)}
                            />
                        </td>
                        <td className="headerCellRight">
                            <select
                                className="item_SelectField"
                                aria-label="Item size"
                                value={size}
                                disabled={readOnly}
                                onChange={(e) => onSizeChange(e.target.value)}
                            >
                                <option value="">--Please choose an Item Size--</option>
                                {sizes.map((s) => (
                                    <option key={s.ItemSizeID} value={s.SizeName}>{s.SizeName}</option>
                                ))}
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className="headerCellLeft" colSpan={2}>
                            <label htmlFor="item_category_fld">Category </label>
                            <input
                                type="text"
                                id="item_category_fld"
                                className="item_TextField"
                                list="item_category_options"
                                placeholder="e.g. Weapons: Firearms"
                                title='"Group: Subgroup" files the item under both in the Inventory; leave blank for Uncategorized.'
                                maxLength={100}
                                value={category}
                                readOnly={readOnly}
                                onChange={(e) => onCategoryChange(e.target.value)}
                            />
                            <datalist id="item_category_options">
                                {categories.map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
