function doGet() {
  // CONFIGURAZIONE: Assicurati che il foglio si chiami "Dati" o cambia il nome qui sotto
  var sheetName = "Dati"; 
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  // FALLBACK: Se non esiste "Dati", usa il primo foglio disponibile (spesso Foglio1)
  if (!sheet) {
    var allSheets = ss.getSheets();
    if (allSheets.length > 0) {
      sheet = allSheets[0];
    } else {
      // Caso estremo: nessun foglio? Crealo.
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Date", "Category", "Method", "In", "Out", "Recurring"]);
    }
  }
  
  var rows = sheet.getDataRange().getValues();
  var data = [];
  
  // Partiamo da i=1 per saltare l'intestazione
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    // Evita righe vuote
    if (row[0] === "" && row[1] === "") continue;
    
    // Converti la data in stringa YYYY-MM-DD per l'app
    var dateStr = row[0];
    try {
      if (dateStr instanceof Date) {
        dateStr = Utilities.formatDate(dateStr, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
    } catch(e) {}

    data.push({
      date: dateStr,
      category: row[1],
      method: row[2],
      in: Number(row[3]),
      out: Number(row[4]),
      recurring: row[5] === true || row[5] === "TRUE" || row[5] === "Sì" ? true : false
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheetName = "Dati";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    var allSheets = ss.getSheets();
    if (allSheets.length > 0) {
      sheet = allSheets[0];
    } else {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Date", "Category", "Method", "In", "Out", "Recurring"]);
    }
  }
  
  try {
    // I dati arrivano come stringa JSON nel corpo della richiesta
    var jsonData = JSON.parse(e.postData.contents);
    
    // Pulisce tutto tranne l'intestazione
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
    }
    
    if (jsonData.length > 0) {
      var newRows = jsonData.map(function(item) {
        return [
          item.date,
          item.category,
          item.method,
          item.in,
          item.out,
          item.recurring ? "TRUE" : "FALSE"
        ];
      });
      
      // Scrive in blocco per velocità
      sheet.getRange(2, 1, newRows.length, 6).setValues(newRows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success", count: jsonData.length}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
