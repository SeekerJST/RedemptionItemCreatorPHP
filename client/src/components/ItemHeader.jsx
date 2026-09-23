import { Button } from '@svar-ui/react-core';

/** Save/Delete toolbar, item name, and size picker. */
export default function ItemHeader({ name, size, sizes, onNameChange, onSizeChange }) {
    return (
        <div className="item_name_field">
            <div className="toolBar">
                {/* Saving and deleting through the API isn't wired up yet. */}
                <Button type="primary" disabled title="Coming soon">[Save]</Button>&nbsp;
                <Button type="primary" disabled title="Coming soon">[Delete]</Button>
            </div>
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
