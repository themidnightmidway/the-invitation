/**
 * THE MIDNIGHT MIDWAY RSVP endpoint
 *
 * 1. Create a Google Sheet.
 * 2. In Extensions > Apps Script, paste this file.
 * 3. Replace SHEET_NAME if desired.
 * 4. Deploy > New deployment > Web app.
 * 5. Execute as: Me. Who has access: Anyone.
 * 6. Copy the Web App URL into GOOGLE_SCRIPT_URL in script.js.
 */

const SHEET_NAME = 'RSVPs';

function doPost(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(['Received', 'Name(s)', 'Attendance', 'Guest Count', 'Client timestamp']);
    sheet.setFrozenRows(1);
  }

  const p = e && e.parameter ? e.parameter : {};
  sheet.appendRow([
    new Date(),
    p.name || '',
    p.attendance || '',
    p.guests || '',
    p.submittedAt || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
