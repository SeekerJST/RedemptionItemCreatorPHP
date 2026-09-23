/** Attributes grouped under their system, each with its rank; sub-rows are indented. */
export default function SystemBreakdown({ systems }) {
    if (systems.length === 0) {
        return null;
    }
    return (
        <table>
            <tbody>
                <tr>
                    <td colSpan={2}><hr /></td>
                </tr>
            </tbody>
            {systems.map((system) => (
                <tbody key={system.name}>
                    <tr>
                        <td className="panel_table_left_system">{system.name}</td>
                        <td className="panel_table_right">&nbsp;</td>
                    </tr>
                    {system.attributes.map((attribute) => (
                        <tr key={attribute.id}>
                            <td className="panel_table_left_system">
                                <span style={{ marginLeft: `${attribute.depth * 1.25}em` }}>
                                    {attribute.depth > 0 && '↳ '}{attribute.label}
                                </span>
                            </td>
                            <td className="panel_table_right">{attribute.rank}</td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={2}><hr /></td>
                    </tr>
                </tbody>
            ))}
        </table>
    );
}
