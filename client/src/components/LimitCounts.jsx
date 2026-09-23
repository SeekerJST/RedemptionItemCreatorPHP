import { Fragment } from 'react';

/** "Minor: 1 / 3   Moderate: 0 / 2   Major: 0 / 1", in red when over the cap. */
export default function LimitCounts({ counts }) {
    return (
        <table>
            <tbody>
                <tr>
                    {counts.map(({ scaleName, count, cap }) => (
                        <Fragment key={scaleName}>
                            <td className="limitation_table">{scaleName}: </td>
                            <td className="limitation_table" style={{ color: count > cap ? 'darkred' : 'antiquewhite' }}>
                                {count} / {cap}
                            </td>
                        </Fragment>
                    ))}
                </tr>
            </tbody>
        </table>
    );
}
