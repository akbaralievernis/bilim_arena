import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
const { crc32, buildXlsx, sheetName } = await import('../core/xlsx.js');
const { suggestGrade } = await import('../core/report-export.js');

test('zip checksum matches the standard CRC-32 value', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('xlsx: a zip with the workbook parts, text never becomes a formula', () => {
  const bytes = buildXlsx([{ name: 'Окуучулар', rows: [['Аты', '%'], ['=SUM(A1)', 90]] }]);
  const text = new TextDecoder().decode(bytes);
  assert.equal(text.slice(0, 2), 'PK');
  for (const part of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/styles.xml']) assert.ok(text.includes(part), part);
  assert.ok(text.includes('t="inlineStr"') && text.includes('=SUM(A1)') && !text.includes('<f>'), 'no formula cells');
  assert.equal(sheetName('Темы: [дроби]/*?', 0), 'Темы   дроби');
});

test('grade hint: 85/70/50 % → 5/4/3, lower → 2, no data → none', () => {
  assert.deepEqual([100, 85, 84, 70, 50, 49, 0].map(suggestGrade), [5, 5, 4, 4, 3, 2, 2]);
  assert.equal(suggestGrade(null), null);
});

// Аудит 21.10 (P3): повреждённые данные не роняют отчёт, даты в Excel — настоящие даты
test('grade hint and mastery survive broken data', async () => {
  assert.equal(suggestGrade(NaN), null);
  assert.equal(suggestGrade(Infinity), null);
  assert.equal(suggestGrade(-5), 2);
  const { masteryStatus } = await import('../core/mastery.js');
  assert.equal(masteryStatus({ answered: 3, correct: 2, checks: {} }).status, 'insufficient');
  assert.equal(masteryStatus({ answered: 'x', correct: null, checks: null }).status, 'new');
});

test('xlsx: a date is a real date cell (sortable), not text', () => {
  const at = new Date(2026, 9, 21, 15, 30).getTime();
  const text = new TextDecoder().decode(buildXlsx([{ name: 'S', rows: [['Күн'], [{ date: at }]] }]));
  // 21.10.2026 = серийный номер 46316 в Excel
  assert.match(text, /<c r="A2" s="2"><v>46316<\/v><\/c>/);
  assert.ok(text.includes('numFmtId="14"'));
});
