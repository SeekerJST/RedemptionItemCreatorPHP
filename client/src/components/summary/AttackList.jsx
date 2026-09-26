/**
 * Each attack as it plays at the table: multiplier, implementation, mounts, feed, extras,
 * and what its implementation adds for free. Renders nothing if the item has no attacks.
 */
export default function AttackList({ attacks }) {
    if (attacks.length === 0) {
        return null;
    }
    return (
        <div className="attack_list">
            <div className="panel_table_left_system">Attacks</div>
            {attacks.map((attack) => (
                <table key={attack.id} className="attack_entry">
                    <tbody>
                        <tr>
                            <td className="panel_table_left">
                                <b>{attack.name}</b> ({attack.scale})
                            </td>
                            <td className="panel_table_right" title="Weapon Multiplier">
                                <b>{attack.multiplier}x</b>
                            </td>
                        </tr>
                        {attack.implementation && (
                            <tr>
                                <td className="panel_table_left">Implementation:</td>
                                <td className="panel_table_right">{attack.implementation}</td>
                            </tr>
                        )}
                        {attack.mounts > 1 && (
                            <tr>
                                <td className="panel_table_left">Mounts:</td>
                                <td className="panel_table_right" title="1 + extra turrets: each lets another gunner fire it">
                                    {attack.mounts}
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td className="panel_table_left">Feed:</td>
                            <td className="panel_table_right">{attack.feed}</td>
                        </tr>
                        {attack.extras.length > 0 && (
                            <tr>
                                <td className="panel_table_left">Extras:</td>
                                <td className="panel_table_right">{attack.extras.join(', ')}</td>
                            </tr>
                        )}
                        {attack.free.length > 0 && (
                            <tr>
                                <td className="panel_table_left">Free:</td>
                                <td className="panel_table_right">{attack.free.join(', ')}</td>
                            </tr>
                        )}
                        <tr>
                            <td className="panel_table_left">Build Points:</td>
                            <td className="panel_table_right">{attack.buildPoints}</td>
                        </tr>
                    </tbody>
                </table>
            ))}
        </div>
    );
}
