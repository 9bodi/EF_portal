export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === "," || ch === ";") { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export function readCsv(text: string) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) throw new Error("Le fichier doit contenir un en-tête et au moins une ligne");
  const header = parseCsvLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map(l => {
    const cols = parseCsvLine(l);
    return Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ""]));
  });
}
