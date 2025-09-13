/* eslint-disable @typescript-eslint/no-explicit-any */
type FieldError = { field?: string; path?: string; message?: string } | string;

function tryParseJSON<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function flattenObject(
  obj: Record<string, any>,
  parent = "",
): Array<{ path: string; value: any }> {
  const out: Array<{ path: string; value: any }> = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = parent ? `${parent}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenObject(v, path));
    } else {
      out.push({ path, value: v });
    }
  }
  return out;
}

export function humanizeErrorMessage(raw: string): string {
  // 1) Try structured JSON first
  const parsed = tryParseJSON<any>(raw);
  if (parsed) {
    // Array of {field,message} or strings
    if (Array.isArray(parsed)) {
      const parts = parsed
        .map((it: FieldError) => {
          if (typeof it === "string") return it;
          const key = it.field || it.path || "";
          if (key && it.message) return `${key}: ${it.message}`;
          if (it.message) return it.message;
          return key || "";
        })
        .filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
    // Object with errors array
    if (parsed.errors && Array.isArray(parsed.errors)) {
      const parts = parsed.errors
        .map((it: FieldError) => {
          if (typeof it === "string") return it;
          const key = it.field || it.path || "";
          if (key && it.message) return `${key}: ${it.message}`;
          if (it.message) return it.message;
          return key || "";
        })
        .filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
    // Generic object: flatten
    if (typeof parsed === "object") {
      const flat = flattenObject(parsed);
      if (flat.length) {
        return flat
          .map(({ path, value }) => {
            // If value is a primitive or short string, print inline; else JSON-stringify
            const valStr =
              typeof value === "string" && value.length <= 80
                ? value
                : typeof value === "number" ||
                    typeof value === "boolean" ||
                    value == null
                  ? String(value)
                  : JSON.stringify(value);
            return `${path}: ${valStr}`;
          })
          .join("; ");
      }
    }
  }
  // 2) Fallback: clean raw string
  return raw.replace(/\s+/g, " ").trim();
}
