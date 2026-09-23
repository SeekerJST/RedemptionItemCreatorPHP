/** Power slots used / provided at each scale. Renders nothing if no attribute involves power. */
export default function PowerSlotList({ powerSlots }) {
    if (powerSlots.length === 0) {
        return null;
    }
    return (
        <table>
            <tbody>
                <tr>
                    <td className="panel_table_left">Power Slots:</td>
                    <td className="panel_table_right">&nbsp;</td>
                </tr>
                {powerSlots.map(({ scaleId, scaleName, used, total }) => (
                    <tr key={scaleId}>
                        <td className="panel_table_left">{scaleName}:</td>
                        <td className="panel_table_right">{used}/{total}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
