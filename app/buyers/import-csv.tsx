// app/buyers/import-csv.tsx
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RowError = { row: number; message: string };

const REQUIRED_HEADERS = [
  "fullName",
  "email",
  "phone",
  "city",
  "propertyType",
  "bhk",
  "purpose",
  "budgetMin",
  "budgetMax",
  "timeline",
  "source",
  "notes",
  "tags",
  "status",
];

export default function ImportCsv() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [inserted, setInserted] = useState<number | null>(null);
  const [errors, setErrors] = useState<RowError[] | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInserted(null);
    setErrors(null);
    setClientError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    setInserted(null);
    setErrors(null);
    setClientError(null);

    if (!file) {
      setClientError("Please choose a CSV file.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setClientError("Only .csv files are allowed.");
      return;
    }

    // Robust read: snapshot + decode to text
    let text = "";
    try {
      const buf = await file.arrayBuffer();
      const cloned = new File([buf], file.name, {
        type: file.type || "text/csv",
      });
      text = await new Response(cloned).text();
    } catch {
      setClientError(
        "Could not read the file. Please re-select the CSV and try again.",
      );
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setClientError("CSV is empty.");
      return;
    }

    // Trim BOM, quotes, and whitespace from headers
    const header = lines[0].split(",").map((h) =>
      h
        .replace(/^\uFEFF/, "")
        .replace(/^"|"$/g, "")
        .trim(),
    );

    const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
    if (missing.length) {
      setClientError(`Missing headers: ${missing.join(", ")}`);
      return;
    }

    const dataRowCount = Math.max(0, lines.length - 1);
    if (dataRowCount > 200) {
      setClientError("Too many rows (max 200).");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setBusy(true);
    try {
      const res = await fetch("/api/buyers/import", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setClientError(json.error || "Import failed");
      } else {
        setInserted(json.inserted ?? 0);
        setErrors(Array.isArray(json.errors) ? json.errors : []);
        // Reset input and refresh list after success
        if (inputRef.current) inputRef.current.value = "";
        setFile(null);
        router.refresh();
      }
    } catch (err: any) {
      setClientError(err?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <form
        onSubmit={onImport}
        className="flex items-center gap-2"
        aria-describedby="import-error"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={onFileChange}
          aria-label="Choose CSV file"
        />
        <button type="submit" disabled={busy || !file} className="btn">
          {busy ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {clientError && (
        <p
          id="import-error"
          role="alert"
          aria-live="polite"
          className="text-red-600"
        >
          {clientError}
        </p>
      )}

      {inserted != null && (
        <p role="status" aria-live="polite" className="text-green-700">
          Inserted: {inserted}
        </p>
      )}

      {errors && errors.length > 0 && (
        <div className="mt-3">
          <p className="font-semibold">Row Errors</p>
          <table className="min-w-[480px] border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Row #</th>
                <th className="border px-2 py-1">Message</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr key={e.row}>
                  <td className="border px-2 py-1">{e.row}</td>
                  <td
                    className="border px-2 py-1"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {e.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
