/** A name field for each Task attribute, with its rank. */
export default function TaskList({ tasks, names, readOnly = false, onChange }) {
    if (tasks.length === 0) {
        return null;
    }
    return (
        <table>
            <tbody>
                <tr>
                    <td className="panel_table_left">Tasks:</td>
                    <td className="panel_table_right">&nbsp;</td>
                </tr>
                {tasks.map((row) => (
                    <tr key={row.id}>
                        <td className="panel_table_left">
                            <input
                                type="text"
                                aria-label="Task name"
                                readOnly={readOnly}
                                value={names[row.id] ?? ''}
                                onChange={(e) => onChange(row.id, e.target.value)}
                            />
                        </td>
                        <td className="panel_table_right">{row.Rank}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
