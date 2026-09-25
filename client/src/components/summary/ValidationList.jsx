/**
 * Rule checks for the item: errors first, then warnings. The rows an issue is about are
 * highlighted in the grids. Nothing here blocks saving or exporting.
 */
export default function ValidationList({ issues }) {
    const errors = issues.filter((issue) => issue.severity === 'error');
    const warnings = issues.filter((issue) => issue.severity === 'warning');

    if (issues.length === 0) {
        return <p className="validation_ok">✓ No rule problems found.</p>;
    }

    return (
        <div className="validation_list" role="status" aria-live="polite">
            <div className="panel_table_left">
                Rule checks: {errors.length} {errors.length === 1 ? 'error' : 'errors'}, {warnings.length}{' '}
                {warnings.length === 1 ? 'warning' : 'warnings'}
            </div>
            <ul>
                {[...errors, ...warnings].map((issue, i) => (
                    <li key={i} className={`validation_${issue.severity}`}>
                        <span className="validation_badge">{issue.severity === 'error' ? 'Error' : 'Warning'}</span>
                        {issue.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}
