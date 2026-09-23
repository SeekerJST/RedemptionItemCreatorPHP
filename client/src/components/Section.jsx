import { Button } from '@svar-ui/react-core';

/** A titled block in the item panel (Tags, Attributes, Limitations) with a [+] button. */
export default function Section({ title, ruleWidth, onAdd, children }) {
    return (
        <div className="section">
            <div className="item_header">
                <div className="item_header_left">{title}</div>
                <div className="item_header_right">
                    <Button type="primary" onClick={onAdd} title={`Add a row to ${title}`}>[+]</Button>
                </div>
                <hr style={{ width: ruleWidth, marginLeft: 0 }} />
            </div>
            <div className="item_section">{children}</div>
        </div>
    );
}
