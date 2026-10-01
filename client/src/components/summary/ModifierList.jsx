import { OTHER_SKILL, SPECIALTY_SKILLS } from '../../domain/summary.js';

/** How the skills table's SkillType groups the Minor picker (migration 006). */
const SKILL_GROUPS = [
    { type: 'Skill', label: 'Skills' },
    { type: 'Ability', label: 'Abilities' },
];

/** The saved text for a Minor Modifier: "Engineering (Starship)", "Firearms", or the Other text. */
const minorText = (choice, detail) => {
    if (choice === OTHER_SKILL) return detail;
    return detail.trim() ? `${choice} (${detail.trim()})` : choice;
};

/**
 * Each Modifier attribute with its bonus. A Minor Modifier (one target) picks a Skill or Ability,
 * or Other… for anything else; Engineering, Science, and Profession take a specialty, and any
 * listed skill can carry a note ("first response only"). A Moderate or Major one (several skills)
 * is a free-text field.
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
                                <MinorPicker row={row} skills={skills} readOnly={readOnly} onChange={(text) => onChange(row.id, text)} />
                            )}
                        </td>
                        <td className="panel_table_right">+{row.Rank}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function MinorPicker({ row, skills, readOnly, onChange }) {
    const isOther = row.choice === OTHER_SKILL;
    const needsSpecialty = SPECIALTY_SKILLS.includes(row.choice);
    const showDetail = isOther || needsSpecialty || row.detail !== '';
    let placeholder = 'Note';
    if (isOther) placeholder = 'What it modifies';
    else if (needsSpecialty) placeholder = 'Specialty, e.g. Weapons';
    return (
        <>
            <select
                aria-label="Modifier skill"
                disabled={readOnly}
                value={row.choice}
                // A new choice starts without a detail; Other starts empty, ready to type.
                onChange={(e) => onChange(e.target.value === OTHER_SKILL ? '' : e.target.value)}
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
                <option value={OTHER_SKILL}>Other…</option>
            </select>
            {showDetail && (
                <input
                    type="text"
                    aria-label={isOther ? 'Modifier target' : needsSpecialty ? 'Specialty' : 'Modifier note'}
                    placeholder={placeholder}
                    maxLength={80}
                    readOnly={readOnly}
                    value={row.detail}
                    onChange={(e) => onChange(minorText(row.choice, e.target.value))}
                />
            )}
        </>
    );
}
