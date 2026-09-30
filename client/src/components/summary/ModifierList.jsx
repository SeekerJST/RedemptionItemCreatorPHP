/** How the skills table's SkillType groups the Minor picker (migration 006). */
const SKILL_GROUPS = [
    { type: 'Skill', label: 'Skills' },
    { type: 'Ability', label: 'Abilities' },
];

/**
 * Each Modifier attribute with its bonus: a picker for a Minor Modifier (one Skill or Ability),
 * a free-text field for a Moderate or Major (multi-skill) one.
 */
export default function ModifierList({ modifiers, skills, readOnly = false, onChange }) {
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
                                    readOnly={readOnly}
                                    value={row.skill}
                                    onChange={(e) => onChange(row.id, e.target.value)}
                                />
                            ) : (
                                <select
                                    aria-label="Modifier skill"
                                    disabled={readOnly}
                                    value={row.skill}
                                    onChange={(e) => onChange(row.id, e.target.value)}
                                >
                                    {SKILL_GROUPS.map(({ type, label }) => (
                                        <optgroup key={type} label={label}>
                                            {skills
                                                .filter((skill) => (skill.SkillType ?? 'Skill') === type)
                                                .map((skill) => (
                                                    <option key={skill.skillID} value={skill.skillName}>{skill.skillName}</option>
                                                ))}
                                        </optgroup>
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
