// utils/url.ts
export type SearchParamsLike =
  | URLSearchParams
  | Record<string, unknown>
  | null
  | undefined;

export function toQueryString(sp: SearchParamsLike): string {
  if (!sp) return "";
  // Prefer feature detection over instanceof for ReadonlyURLSearchParams
  if (
    typeof (sp as any).get === "function" &&
    typeof (sp as any).toString === "function"
  ) {
    return (sp as URLSearchParams).toString();
  }
  const qs = new URLSearchParams();
  const obj = sp as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val == null) continue;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item == null) continue;
        qs.append(key, String(item));
      }
    } else if (
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean"
    ) {
      qs.set(key, String(val));
    }
  }
  return qs.toString();
}

export function getFirst(sp: Record<string, unknown>, key: string): string {
  const v = sp[key];
  if (Array.isArray(v)) {
    const first = v[0];
    return first != null ? String(first) : "";
  }
  return v != null ? String(v) : "";
}
