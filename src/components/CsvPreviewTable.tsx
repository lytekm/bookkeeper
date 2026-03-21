import styles from "../app/page.module.css";

type Props = {
  headers: string[];
  rows: string[][];
};

export const CsvPreviewTable = ({ headers, rows }: Props) => (
  <div className={styles.tableCard}>
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`row-${index}`}>
            {headers.map((header, cellIndex) => (
              <td key={`${header}-${cellIndex}`}>{row[cellIndex]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
