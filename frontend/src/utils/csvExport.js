/**
 * Utility to export data as CSV file with security protection.
 * - Guards against CSV formula injection (cells starting with =, +, -, @)
 * - Escapes quotes and commas
 * - Uses UTF-8 BOM so Excel opens with proper character encoding
 */

export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const sanitizeCell = (cell) => {
    if (cell === null || cell === undefined) return '';
    let text = String(cell);

    // Guard against CSV formula injection (DDE attacks)
    if (/^[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    // Escape double quotes and enclose in quotes if needed
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
      text = `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const headerRow = headers.map((h) => sanitizeCell(h.label)).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => sanitizeCell(row[h.key])).join(',')
  );

  // UTF-8 BOM prefix (\uFEFF)
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
