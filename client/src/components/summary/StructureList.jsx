export default function StructureList({ body, armor, forceField }) {
    return (
        <table>
            <tbody>
                <tr>
                    <td className="panel_table_left">Structure:</td>
                    <td className="panel_table_right">&nbsp;</td>
                </tr>
                <tr>
                    <td className="panel_table_left">Body:</td>
                    <td className="panel_table_right">{body}</td>
                </tr>
                <tr>
                    <td className="panel_table_left">Armor{armor.type && ` (${armor.type})`}:</td>
                    <td className="panel_table_right">{armor.rank}</td>
                </tr>
                <tr>
                    <td className="panel_table_left">Force Fields:</td>
                    <td className="panel_table_right">{forceField}</td>
                </tr>
            </tbody>
        </table>
    );
}
