/** A skill picker for each Modifier attribute, with its bonus. */
export default function ModifierList({ modifiers, selectedSkills, skills, onChange }) {
    if (modifiers.length === 0) {
        return null;
    }
    return (
        <table>
            <tbody>
                <tr>
                    <td className="panel_table_left">Modifiers:</td>
                    <td className="panel_table_right">&nbsp;</td>
                </tr>
                {modifiers.map((row) => (
                    <tr key={row.id}>
                        <td className="panel_table_left">
                            <select
                                aria-label="Modifier skill"
                                value={selectedSkills[row.id] ?? skills[0]?.skillName}
                                onChange={(e) => onChange(row.id, e.target.value)}
                            >
                                {skills.map((skill) => (
                                    <option key={skill.skillID} value={skill.skillName}>{skill.skillName}</option>
                                ))}
                            </select>
                        </td>
                        <td className="panel_table_right">+{row.Rank}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
