import { Button } from '@svar-ui/react-core';

/**
 * New/Save/Delete toolbar, item name, and size picker.
 *
 * status: { kind: 'ok' | 'error' | 'busy', text } shown under the toolbar, or null.
 * confirm: { message, actionLabel, onConfirm } asks before something that loses work, or null.
 * An inline question rather than window.confirm, so nothing blocks the page.
 */
export default function ItemHeader({ name, size, sizes, onNameChange, onSizeChange, toolbar, status, confirm, onCancelConfirm }) {
    const { onNew, onSave, onDelete, canDelete, saveHint, busy } = toolbar;

    return (
        <div className="item_name_field">
            <div className="toolBar">
                <Button type="primary" disabled={busy} title="Start a new, empty item" onClick={onNew}>[New]</Button>&nbsp;
                <Button type="primary" disabled={busy || saveHint !== null} title={saveHint ?? 'Save this item'} onClick={onSave}>[Save]</Button>&nbsp;
                <Button
                    type="primary"
                    disabled={busy || !canDelete}
                    title={canDelete ? 'Delete this item' : 'Only a saved item can be deleted'}
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
                status && (
                    <div className={`toolbar_message ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
                        {status.text}
                    </div>
                )
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
                                onChange={(e) => onNameChange(e.target.value)}
                            />
                        </td>
                        <td className="headerCellRight">
                            <select
                                className="item_SelectField"
                                aria-label="Item size"
                                value={size}
                                onChange={(e) => onSizeChange(e.target.value)}
                            >
                                <option value="">--Please choose an Item Size--</option>
                                {sizes.map((s) => (
                                    <option key={s.ItemSizeID} value={s.SizeName}>{s.SizeName}</option>
                                ))}
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
