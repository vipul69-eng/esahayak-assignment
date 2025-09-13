// app/buyers/import-csv.tsx
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { humanizeErrorMessage } from "@/lib/errors";

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
  const [showErrorsSheet, setShowErrorsSheet] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInserted(null);
    setErrors(null);
    setClientError(null);
    setShowErrorsSheet(false);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    setInserted(null);
    setErrors(null);
    setClientError(null);
    setShowErrorsSheet(false);

    const showErr = (msg: string) => {
      setClientError(msg);
      toast.error(msg);
    };

    if (!file) {
      showErr("Please choose a CSV file.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showErr("Only .csv files are allowed.");
      return;
    }

    let text = "";
    try {
      const buf = await file.arrayBuffer();
      const cloned = new File([buf], file.name, {
        type: file.type || "text/csv",
      });
      text = await new Response(cloned).text();
    } catch {
      showErr(
        "Could not read the file. Please re-select the CSV and try again.",
      );
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      showErr("CSV is empty.");
      return;
    }

    const header = lines[0].split(",").map((h) =>
      h
        .replace(/^\uFEFF/, "")
        .replace(/^"|"$/g, "")
        .trim(),
    );
    const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
    if (missing.length) {
      showErr(`Missing headers: ${missing.join(", ")}`);
      return;
    }

    const dataRowCount = Math.max(0, lines.length - 1);
    if (dataRowCount > 200) {
      showErr("Too many rows (max 200).");
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
        showErr(json.error || "Import failed");
      } else {
        setInserted(json.inserted ?? 0);
        const errs: RowError[] = Array.isArray(json.errors) ? json.errors : [];
        setErrors(errs);
        if (inputRef.current) inputRef.current.value = "";
        setFile(null);

        toast.success(`Inserted: ${json.inserted ?? 0}`);
        if (errs.length) {
          toast("Some rows had errors", {
            description: `${errs.length} error(s) reported`,
          });
          setShowErrorsSheet(true); // auto open the sheet if there are errors
        }

        router.refresh();
      }
    } catch (err) {
      showErr((err as Error)?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const errorCount = errors?.length ?? 0;

  return (
    <div className="w-full max-w-3xl">
      <form
        onSubmit={onImport}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
        aria-describedby="import-error"
      >
        {/* Styled file picker (keeps native input for a11y) */}
        <label className="inline-flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={onFileChange}
            aria-label="Choose CSV file"
            className="hidden"
          />
          <span className="text-sm">
            {file ? file.name : "Choose CSV file"}
          </span>
        </label>

        <Button type="submit" disabled={busy || !file}>
          {busy ? "Importing..." : "Import CSV"}
        </Button>

        {/* Trigger to open errors sheet when there are errors */}
        {errorCount > 0 && (
          <Sheet open={showErrorsSheet} onOpenChange={setShowErrorsSheet}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="ml-0 sm:ml-2"
                aria-label="Show import errors"
              >
                View Errors ({errorCount})
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[520px]">
              <SheetHeader>
                <SheetTitle>Import Errors</SheetTitle>
                <SheetDescription>
                  {errorCount} row{errorCount === 1 ? "" : "s"} failed
                  validation. Review the messages below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 h-[70vh] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Row #</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors?.map((e) => (
                      <TableRow key={e.row}>
                        <TableCell className="font-medium">{e.row}</TableCell>
                        <TableCell className="whitespace-pre-wrap">
                          {humanizeErrorMessage(e.message)
                            .replace("[", "")
                            .replace("]", "")
                            .replace('"', "")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <SheetFooter className="mt-4">
                <SheetClose asChild>
                  <Button type="button">Close</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </form>

      {/* Optional inline error (client-side) */}
      {clientError && (
        <p id="import-error" className="mt-2 text-sm text-red-600">
          {clientError}
        </p>
      )}
    </div>
  );
}
