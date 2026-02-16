import "./VisitTable.css";

export interface Props {
  vt: number[][];
}

export function VisitTable({ vt }: Props) {
  return (
    <div className="visit-table">
      <table>
        <caption>Visit Table</caption>
        <thead>
          <tr>
            <td></td>
            {vt.map((_, idx) => (
              <td key={idx}>
                <b>x{idx}</b>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {vt.map((row, ri) => (
            <tr key={ri}>
              <td>
                <b>x{ri}</b>
              </td>
              {row.map((level, ci) => (
                <td key={ci}>{ci === ri ? "-" : level}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
