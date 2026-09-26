/**
 * Power Slots per grade: used / available. Load a grade can't cover itself but spare
 * higher-grade slots do is shown as "from higher"; load nothing covers is shown in red.
 * Renders nothing if no attribute involves power.
 */
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
                {powerSlots.map(({ grade, gradeName, used, available, borrowed, short }) => (
                    <tr key={grade} className={short > 0 ? 'power_short' : undefined}>
                        <td className="panel_table_left">{gradeName}:</td>
                        <td className="panel_table_right" title={`${used} used of ${available} ${gradeName} slots`}>
                            {used}/{available}
                            {borrowed > 0 && <span className="power_note"> ({borrowed} from higher)</span>}
                            {short > 0 && <span className="power_note"> ({short} short)</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
