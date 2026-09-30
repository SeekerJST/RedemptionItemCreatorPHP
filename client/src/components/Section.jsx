import { Button } from '@svar-ui/react-core';

/**
 * A titled block in the item panel (Tags, Attributes, Limitations) with a [+] button.
 * `actions` adds more header buttons before the [+]. `addHint`, if set, disables [+] and says why.
 */
export default function Section({ title, ruleWidth, onAdd, addHint, actions, children }) {
    return (
        <div className="section">
            <div className="item_header">
                <div className="item_header_left">{title}</div>
                <div className="item_header_right">
                    {actions}
                    <Button type="primary" disabled={Boolean(addHint)} onClick={onAdd} title={addHint || `Add a row to ${title}`}>[+]</Button>
                </div>
                <hr style={{ width: ruleWidth, marginLeft: 0 }} />
            </div>
            <div className="item_section">{children}</div>
        </div>
    );
}
