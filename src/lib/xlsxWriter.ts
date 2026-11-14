/**
 * Dependency-free OOXML (.xlsx) writer.
 *
 * Produces a real SpreadsheetML workbook (ZIP + OOXML parts) so Excel,
 * LibreOffice, and Google Sheets open the file without the "format mismatch"
 * warning that HTML-based .xls exports trigger.
 */

export type XlsxCell = string | number | boolean | null | undefined;
export type XlsxRow = XlsxCell[];
export interface XlsxSheet {
  name: string;
  rows: XlsxRow[];
  columnWidths?: number[];
}

const encoder = new TextEncoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeU16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeU32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  offset: number;
}

/** Minimal ZIP writer using the "store" method (no compression). */
export function createZip(files: Array<{ name: string; content: string | Uint8Array }>): Uint8Array {
  const entries: ZipEntry[] = [];
  const chunks: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc = crc32(data);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    writeU32(view, 0, 0x04034b50);
    writeU16(view, 4, 20);
    writeU16(view, 6, 0x0800); // UTF-8 filename
    writeU16(view, 8, 0); // stored
    writeU16(view, 10, 0);
    writeU16(view, 12, 0);
    writeU32(view, 14, crc);
    writeU32(view, 18, data.length);
    writeU32(view, 22, data.length);
    writeU16(view, 26, nameBytes.length);
    writeU16(view, 28, 0);
    header.set(nameBytes, 30);
    chunks.push(header, data);
    entries.push({ name: file.name, data, crc, offset });
    offset += header.length + data.length;
  }

  const centralStart = offset;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);
    writeU32(view, 0, 0x02014b50);
    writeU16(view, 4, 20);
    writeU16(view, 6, 20);
    writeU16(view, 8, 0x0800);
    writeU16(view, 10, 0);
    writeU16(view, 12, 0);
    writeU16(view, 14, 0);
    writeU32(view, 16, entry.crc);
    writeU32(view, 20, entry.data.length);
    writeU32(view, 24, entry.data.length);
    writeU16(view, 28, nameBytes.length);
    writeU16(view, 30, 0);
    writeU16(view, 32, 0);
    writeU16(view, 34, 0);
    writeU16(view, 36, 0);
    writeU32(view, 38, 0);
    writeU32(view, 42, entry.offset);
    header.set(nameBytes, 46);
    chunks.push(header);
    offset += header.length;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeU32(endView, 0, 0x06054b50);
  writeU16(endView, 4, 0);
  writeU16(endView, 6, 0);
  writeU16(endView, 8, entries.length);
  writeU16(endView, 10, entries.length);
  writeU32(endView, 12, offset - centralStart);
  writeU32(endView, 16, centralStart);
  writeU16(endView, 20, 0);
  chunks.push(end);

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base = (name || 'Sheet')
    .replace(/[\\/?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31) || 'Sheet';
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${n}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    n += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function columnLetter(index: number): string {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function cellXml(value: XlsxCell, ref: string, style = 0): string {
  if (value === null || value === undefined || value === '') {
    return `<c r="${ref}" s="${style}"/>`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet): string {
  const rows = sheet.rows.length > 0 ? sheet.rows : [['No data captured']];
  const maxCols = Math.max(...rows.map((row) => row.length), 1);
  const widths = sheet.columnWidths && sheet.columnWidths.length > 0
    ? sheet.columnWidths
    : Array.from({ length: maxCols }, () => 22);
  const cols = widths
    .map((width, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${Math.max(8, Math.min(70, width))}" customWidth="1"/>`)
    .join('');
  const sheetRows = rows
    .map((row, rowIdx) => {
      const cells = row
        .map((value, colIdx) => cellXml(value, `${columnLetter(colIdx)}${rowIdx + 1}`, rowIdx === 0 ? 1 : 0))
        .join('');
      return `<row r="${rowIdx + 1}">${cells}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${cols}</cols>
<sheetData>${sheetRows}</sheetData>
<autoFilter ref="A1:${columnLetter(maxCols - 1)}1"/>
</worksheet>`;
}

export function buildXlsxWorkbook(sheets: XlsxSheet[]): Uint8Array {
  const used = new Set<string>();
  const normalized = (sheets.length > 0 ? sheets : [{ name: 'Summary', rows: [['No data captured']] }]).map((sheet) => ({
    ...sheet,
    safeName: sanitizeSheetName(sheet.name, used),
  }));

  const files: Array<{ name: string; content: string }> = [];
  files.push({
    name: '[Content_Types].xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${normalized
  .map(
    (_sheet, idx) =>
      `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join('')}
</Types>`,
  });
  files.push({
    name: '_rels/.rels',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  });
  files.push({
    name: 'xl/workbook.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
${normalized
  .map(
    (sheet, idx) =>
      `<sheet name="${escapeXml(sheet.safeName)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`
  )
  .join('')}
</sheets>
</workbook>`,
  });
  files.push({
    name: 'xl/_rels/workbook.xml.rels',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${normalized
  .map(
    (_sheet, idx) =>
      `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
  )
  .join('')}
<Relationship Id="rId${normalized.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  });
  files.push({
    name: 'xl/styles.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="10"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
  });
  normalized.forEach((sheet, idx) => {
    files.push({ name: `xl/worksheets/sheet${idx + 1}.xml`, content: sheetXml(sheet) });
  });

  return createZip(files);
}

export function downloadXlsx(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
