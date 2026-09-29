/**
 * Each Modifier attribute with its bonus: a skill picker for a Minor (one-skill) Modifier,
 * a free-text field for a Moderate or Major (multi-skill) one.
 */
export default function ModifierList({ modifiers, skills, onChange }) {
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
                            {row.freeText ? (
                                <input
                                    type="text"
                                    aria-label="Modifier skills"
                                    placeholder={row.grade === 2 ? 'Two skills, e.g. Melee, Heavy Weapons' : 'Skills or a class, e.g. Weapons'}
                                    title="Separate skill names with commas."
                                    maxLength={100}
                                    value={row.skill}
                                    onChange={(e) => onChange(row.id, e.target.value)}
                                />
                            ) : (
                                <select
                                    aria-label="Modifier skill"
                                    value={row.skill}
                                    onChange={(e) => onChange(row.id, e.target.value)}
                                >
                                    {skills.map((skill) => (
                                        <option key={skill.skillID} value={skill.skillName}>{skill.skillName}</option>
                                    ))}
                                </select>
                            )}
                        </td>
                        <td className="panel_table_right">+{row.Rank}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
