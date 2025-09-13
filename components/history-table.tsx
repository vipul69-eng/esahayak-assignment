// app/buyers/[id]/history-table.tsx
export type HistoryRow = {
  field: string;
  from: string;
  to: string;
  changedAt: Date;
  user: string;
};

export default function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  if (!rows.length) return <p>No changes recorded.</p>;
  return (
    <table className="w-full border mt-2">
      <thead>
        <tr>
          <th className="text-left px-2 py-1">Field</th>
          <th className="text-left px-2 py-1">Old → New</th>
          <th className="text-left px-2 py-1">Timestamp</th>
          <th className="text-left px-2 py-1">User</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="px-2 py-1">{r.field}</td>
            <td className="px-2 py-1">
              {r.from || "—"} → {r.to || "—"}
            </td>
            <td className="px-2 py-1">
              {new Date(r.changedAt).toLocaleString()}
            </td>
            <td className="px-2 py-1">{r.user}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
