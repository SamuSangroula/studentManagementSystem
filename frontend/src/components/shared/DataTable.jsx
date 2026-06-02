export default function DataTable({ title, columns, rows, loading }) {
  return (
    <section className="content-panel">
      {title ? <h3>{title}</h3> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>Loading...</td>
              </tr>
            ) : rows.length ? (
              rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>No data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
