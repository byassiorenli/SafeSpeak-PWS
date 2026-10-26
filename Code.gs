// ============================================================
// SafeSpeak v2 - Code.gs
// ============================================================


const APP_NAME       = "SafeSpeak";
const SHEET_FEEDBACK = "Feedback_Database";
const SHEET_ACCOUNTS = "Leerling_Accounts";
const SHEET_DOCENTEN = "Docent_Accounts";
const SHEET_LOG      = "Log";
const SHEET_KLASVERZOEKEN = "Klas_Verzoeken";
const SHEET_INSTELLINGEN  = "Systeem_Instellingen";


// ── Opstarten ───────────────────────────────────────────────


function doGet() {
 // Index.html gebruikt <?!= include(...) ?> om CSS.html, Login.html, Leerling.html,
 // Moderator.html, Docent.html en Instellingen.html samen te voegen tot één pagina.
 // Dit verandert niets aan de werking van de app, alleen aan de bestandsstructuur.
 return HtmlService.createTemplateFromFile('Index').evaluate()
   .setTitle(APP_NAME)
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
   .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Voegt de inhoud van een ander HTML-bestand in op de plek van <?!= include('Bestandsnaam'); ?>
function include(bestandsnaam) {
 return HtmlService.createHtmlOutputFromFile(bestandsnaam).getContent();
}


function onOpen() {
 SpreadsheetApp.getUi()
   .createMenu(APP_NAME)
   .addItem('1. Start App', 'openApp')
   .addItem('2. Initialiseer Sheets', 'setupSheets')
   .addToUi();
 setupSheets();
}


function openApp() {
 const html = HtmlService.createTemplateFromFile('Index').evaluate()
   .setWidth(1100).setHeight(850).setTitle(APP_NAME);
 SpreadsheetApp.getUi().showModalDialog(html, APP_NAME);
}


// ── Sheet-initialisatie ─────────────────────────────────────


function setupSheets() {
 const ss = SpreadsheetApp.getActiveSpreadsheet();


 // Leerling_Accounts (kolom 9 = CookieKeuze: "" / "true" / "false")
 let acc = ss.getSheetByName(SHEET_ACCOUNTS);
 if (!acc) {
   acc = ss.insertSheet(SHEET_ACCOUNTS);
   acc.appendRow(["Leerlingnummer","Voornaam","Achternaam","Wachtwoord","Leerjaar","Niveau","Klas","Datum","CookieKeuze"]);
   logMessage("Sheet aangemaakt: " + SHEET_ACCOUNTS);
 } else if (acc.getLastColumn() < 9) {
   acc.getRange(1, 9).setValue("CookieKeuze");
 }


 // Docent_Accounts (kolom 6 = Vak, kolom 7 = CookieKeuze)
 let doc = ss.getSheetByName(SHEET_DOCENTEN);
 if (!doc) {
   doc = ss.insertSheet(SHEET_DOCENTEN);
   doc.appendRow(["Username","Voornaam","Achternaam","Wachtwoord","Klassen","Vak","CookieKeuze"]);
   logMessage("Sheet aangemaakt: " + SHEET_DOCENTEN);
 } else if (doc.getLastColumn() < 7) {
   doc.getRange(1, 7).setValue("CookieKeuze");
 }


 // Moderator-cookiekeuze wordt apart bijgehouden (moderator heeft geen eigen rij in een sheet)
 if (!ss.getSheetByName(SHEET_INSTELLINGEN)) {
   const inst = ss.insertSheet(SHEET_INSTELLINGEN);
   inst.appendRow(["Sleutel","Waarde"]);
   inst.appendRow(["moderator_cookie",""]);
   logMessage("Sheet aangemaakt: " + SHEET_INSTELLINGEN);
 }


 // Feedback_Database
 let fb = ss.getSheetByName(SHEET_FEEDBACK);
 if (!fb) {
   fb = ss.insertSheet(SHEET_FEEDBACK);
   fb.appendRow([
     "feedback_id","Tijdstempel","Alias","KlasTag","Snippet","VolledigeFeedback",
     "Status","AfwijsReden","IdentiteitOnthuldA","StudentNaam","StudentNummer","StudentKlas",
     "Gebruikersnaam","Leerjaar","Niveau","Klas","DocentUsername","DocentNaam",
     "Q1","Q2","Q3","Toelichting"
   ]);
   logMessage("Sheet aangemaakt: " + SHEET_FEEDBACK);
 }


 if (!ss.getSheetByName(SHEET_LOG)) {
   ss.insertSheet(SHEET_LOG);
   logMessage("Sheet aangemaakt: " + SHEET_LOG);
 }


 // Klas_Verzoeken (klaswijzigingen die wachten op moderatorgoedkeuring)
 if (!ss.getSheetByName(SHEET_KLASVERZOEKEN)) {
   const kv = ss.insertSheet(SHEET_KLASVERZOEKEN);
   kv.appendRow(["verzoek_id","Leerlingnummer","OudeKlas","NieuweLeerjaar","NieuweNiveau","NieuweKlas","Status","Datum"]);
   logMessage("Sheet aangemaakt: " + SHEET_KLASVERZOEKEN);
 }
}


// ── Log ─────────────────────────────────────────────────────


function logMessage(msg) {
 try {
   const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOG);
   if (s) s.appendRow([new Date().toISOString(), msg]);
 } catch(e) {}
}


// ── Constanten ──────────────────────────────────────────────


function getConstants() {
 return {
   LEERJAAR_OPTIES: ["Leerjaar 1","Leerjaar 2","Leerjaar 3","Leerjaar 4","Leerjaar 5","Leerjaar 6"],
   NIVEAU_MAP: {
     "Leerjaar 1":["Brugklas"],
     "Leerjaar 2":["Mavo","Havo","Vwo"],
     "Leerjaar 3":["Mavo","Havo","Vwo"],
     "Leerjaar 4":["Mavo","Havo","Vwo"],
     "Leerjaar 5":["Havo","Vwo"],
     "Leerjaar 6":["Vwo"]
   },
   KLAS_GENERATOR: {
     "Leerjaar 1":{"Brugklas":["1b1","1b2","1b3","1b4","1b5","1b6","1b7","1b8","1b9","1b10","1b11"]},
     "Leerjaar 2":{"Mavo":["2M1","2M2","2M3"],"Havo":["2H1","2H2","2H3","2H4","2H5"],"Vwo":["2V1","2V2","2V3"]},
     "Leerjaar 3":{"Mavo":["3M1","3M2","3M3"],"Havo":["3H1","3H2","3H3","3H4","3H5"],"Vwo":["3V1","3V2","3V3"]},
     "Leerjaar 4":{"Mavo":["4M1","4M2","4M3"],"Havo":["4H1","4H2","4H3","4H4","4H5"],"Vwo":["4V1","4V2","4V3"]},
     "Leerjaar 5":{"Havo":["5H1","5H2","5H3","5H4","5H5"],"Vwo":["5V1","5V2","5V3"]},
     "Leerjaar 6":{"Vwo":["6V1","6V2","6V3"]}
   },
   QUESTIONS: [
     "Hoe duidelijk was de uitleg?",
     "Vond je de opdracht uitdagend?",
     "In welke mate heeft deze les je geholpen?"
   ]
 };
}


// ── Login ────────────────────────────────────────────────────


function checkLogin(username, password, role) {
 logMessage("Inlogpoging: " + username + " | rol: " + role);


 if (role === "moderator") {
   if (username === "moderator" && password === "Saf3Sp3ak!") {
     // Cookiekeuze van de moderator wordt in dezelfde aanroep opgehaald (geen extra round-trip)
     let cookieKeuze = "";
     const instSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INSTELLINGEN);
     if (instSheet) {
       const instData = instSheet.getDataRange().getValues();
       for (let i = 1; i < instData.length; i++) {
         if (instData[i][0] === "moderator_cookie") { cookieKeuze = instData[i][1] || ""; break; }
       }
     }
     return { success: true, user: username, role: "moderator", voornaam: "Moderator", cookieKeuze: cookieKeuze.toString() };
   }
   return { success: false, error: "⚠️ Onjuiste moderatorgegevens." };
 }


 if (role === "docent") {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DOCENTEN);
   if (!sheet) return { success: false, error: "⚠️ Docentendatabase niet gevonden." };
   const data = sheet.getDataRange().getValues();
   for (let i = 1; i < data.length; i++) {
     if (String(data[i][0]).trim() === String(username).trim() &&
         String(data[i][3]).trim() === String(password).trim()) {
       const klassen = data[i][4] ? data[i][4].toString().split(",").map(k=>k.trim()) : [];
       const cookieKeuze = data[i][6] !== undefined ? data[i][6].toString() : "";
       logMessage("Docent ingelogd: " + username);
       return { success: true, user: username, role: "docent",
                voornaam: data[i][1], achternaam: data[i][2], klassen, cookieKeuze };
     }
   }
   return { success: false, error: "⚠️ Onjuiste docentgegevens." };
 }


 if (role === "leerling") {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACCOUNTS);
   if (!sheet) return { success: false, error: "⚠️ Leerlingendatabase niet gevonden." };
   const data = sheet.getDataRange().getValues();
   for (let i = 1; i < data.length; i++) {
     if (String(data[i][0]).trim() === String(username).trim() &&
         String(data[i][3]).trim() === String(password).trim()) {
       const cookieKeuze = data[i][8] !== undefined ? data[i][8].toString() : "";
       logMessage("Leerling ingelogd: " + username);
       return {
         success: true, user: username, role: "leerling",
         voornaam: data[i][1], achternaam: data[i][2],
         leerjaar: data[i][4], niveau: data[i][5], klas: data[i][6],
         cookieKeuze
       };
     }
   }
   return { success: false, error: "⚠️ Ongeldig leerlingnummer of wachtwoord." };
 }


 return { success: false, error: "⚠️ Onbekende rol." };
}


// ── Leerling registreren ─────────────────────────────────────


function registerLeerling(voornaam, achternaam, username, password, confirmPassword, leerjaar, niveau, klas) {
 if (!voornaam||!achternaam||!username||!password||!confirmPassword||!leerjaar||!niveau||!klas)
   return { success: false, error: "⚠️ Vul alle velden in!" };
 if (!/^\d{6}$/.test(username))
   return { success: false, error: "⚠️ Leerlingnummer moet uit exact 6 cijfers bestaan!" };
 if (password !== confirmPassword)
   return { success: false, error: "⚠️ Wachtwoorden komen niet overeen!" };


 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACCOUNTS);
 if (!sheet) return { success: false, error: "⚠️ Database niet gevonden." };
 const data = sheet.getDataRange().getValues();
 for (let i = 1; i < data.length; i++) {
   if (String(data[i][0]).trim() === String(username).trim())
     return { success: false, error: "⚠️ Dit leerlingnummer is al geregistreerd!" };
 }


 sheet.appendRow([username, voornaam, achternaam, password, leerjaar, niveau, klas, new Date().toISOString().split('T')[0]]);
 logMessage("Nieuw leerlingaccount: " + username + " | " + klas);
 return { success: true };
}


// ── Leerling: klas bijwerken ─────────────────────────────────


function updateLeerlingKlas(username, leerjaar, niveau, klas) {
 // Klaswijziging wordt NIET direct doorgevoerd, maar als verzoek opgeslagen.
 // Een moderator moet dit verzoek eerst goedkeuren (zie keurKlasVerzoekGoed/Af).
 const ss = SpreadsheetApp.getActiveSpreadsheet();
 const sheet = ss.getSheetByName(SHEET_ACCOUNTS);
 if (!sheet) return { success: false, error: "Database niet gevonden." };
 const data = sheet.getDataRange().getValues();
 let oudeKlas = "";
 let gevonden = false;
 for (let i = 1; i < data.length; i++) {
   if (String(data[i][0]).trim() === String(username).trim()) {
     oudeKlas = data[i][6] || "";
     gevonden = true;
     break;
   }
 }
 if (!gevonden) return { success: false, error: "Leerling niet gevonden." };

 const kvSheet = ss.getSheetByName(SHEET_KLASVERZOEKEN);
 if (!kvSheet) return { success: false, error: "Klasverzoekendatabase niet gevonden." };

 // Check of er al een openstaand verzoek is voor deze leerling
 const kvData = kvSheet.getDataRange().getValues();
 for (let j = 1; j < kvData.length; j++) {
   if (String(kvData[j][1]).trim() === String(username).trim() && kvData[j][6] === "pending") {
     return { success: false, error: "Je hebt al een openstaand verzoek dat wacht op goedkeuring." };
   }
 }

 const verzoekId = "KV-" + kvSheet.getLastRow();
 kvSheet.appendRow([verzoekId, username, oudeKlas, leerjaar, niveau, klas, "pending", new Date().toISOString()]);
 logMessage("Klaswijzigingsverzoek ingediend door " + username + ": " + oudeKlas + " → " + klas);
 return { success: true, pending: true };
}

// ── Leerling: eigen openstaande klasverzoek ophalen ──────────

function getMijnKlasVerzoek(username) {
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_KLASVERZOEKEN);
   if (!sheet) return { success: true, verzoek: null };
   const data = sheet.getDataRange().getValues();
   for (let i = data.length - 1; i >= 1; i--) {
     if (String(data[i][1]).trim() === String(username).trim() && data[i][6] === "pending") {
       return { success: true, verzoek: { id: data[i][0], nieuweKlas: data[i][5] } };
     }
   }
   return { success: true, verzoek: null };
 } catch(e) { return { success: false, error: e.toString() }; }
}

// ── Moderator: alle openstaande klasverzoeken ophalen ────────

function getKlasVerzoeken() {
 try {
   const ss = SpreadsheetApp.getActiveSpreadsheet();
   const kvSheet  = ss.getSheetByName(SHEET_KLASVERZOEKEN);
   const accSheet = ss.getSheetByName(SHEET_ACCOUNTS);
   if (!kvSheet) return [];

   // Eén batch-read voor beide sheets, daarna in-memory koppelen (sneller dan per rij opzoeken)
   const kvData  = kvSheet.getDataRange().getValues();
   const accData = accSheet ? accSheet.getDataRange().getValues() : [];

   const naamPerLeerling = {};
   for (let j = 1; j < accData.length; j++) {
     const nr = String(accData[j][0]).trim();
     naamPerLeerling[nr] = (accData[j][1] || "") + " " + (accData[j][2] || "");
   }

   return kvData.slice(1)
     .filter(row => row[6] === "pending")
     .map(row => ({
       id: row[0], leerlingnummer: row[1],
       naam: naamPerLeerling[String(row[1]).trim()] ? naamPerLeerling[String(row[1]).trim()].trim() : "Onbekend",
       oudeKlas: row[2],
       nieuweLeerjaar: row[3], nieuweNiveau: row[4], nieuweKlas: row[5],
       datum: row[7]
     }));
 } catch(e) { return []; }
}

// ── Moderator: klasverzoek goedkeuren ─────────────────────────

function keurKlasVerzoekGoed(verzoekId) {
 try {
   const ss = SpreadsheetApp.getActiveSpreadsheet();
   const kvSheet = ss.getSheetByName(SHEET_KLASVERZOEKEN);
   const accSheet = ss.getSheetByName(SHEET_ACCOUNTS);
   if (!kvSheet || !accSheet) return { success: false, error: "Database niet gevonden." };

   // Eén batch-read voor beide sheets
   const kvData  = kvSheet.getDataRange().getValues();
   const accData = accSheet.getDataRange().getValues();

   let rij = -1, username, nieuwLeerjaar, nieuwNiveau, nieuweKlas;
   for (let i = 1; i < kvData.length; i++) {
     if (kvData[i][0] === verzoekId) {
       rij = i;
       username      = kvData[i][1];
       nieuwLeerjaar = kvData[i][3];
       nieuwNiveau   = kvData[i][4];
       nieuweKlas    = kvData[i][5];
       break;
     }
   }
   if (rij === -1) return { success: false, error: "Verzoek niet gevonden." };

   for (let j = 1; j < accData.length; j++) {
     if (String(accData[j][0]).trim() === String(username).trim()) {
       // Eén batch-write voor leerjaar, niveau, klas i.p.v. drie losse setValue-calls
       accSheet.getRange(j+1, 5, 1, 3).setValues([[nieuwLeerjaar, nieuwNiveau, nieuweKlas]]);
       break;
     }
   }
   kvSheet.getRange(rij+1, 7).setValue("goedgekeurd");
   logMessage("Klasverzoek " + verzoekId + " goedgekeurd. " + username + " → " + nieuweKlas);
   return { success: true };
 } catch(e) { return { success: false, error: e.toString() }; }
}

// ── Moderator: klasverzoek afwijzen ───────────────────────────

function keurKlasVerzoekAf(verzoekId) {
 try {
   const kvSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_KLASVERZOEKEN);
   if (!kvSheet) return { success: false, error: "Database niet gevonden." };
   const kvData = kvSheet.getDataRange().getValues();
   for (let i = 1; i < kvData.length; i++) {
     if (kvData[i][0] === verzoekId) {
       kvSheet.getRange(i+1, 7).setValue("afgewezen");
       logMessage("Klasverzoek " + verzoekId + " afgewezen.");
       return { success: true };
     }
   }
   return { success: false, error: "Verzoek niet gevonden." };
 } catch(e) { return { success: false, error: e.toString() }; }
}


// ── Docenten voor een klas ophalen ───────────────────────────


function getDocentenVoorKlas(klas) {
 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DOCENTEN);
 if (!sheet) return [];
 const data = sheet.getDataRange().getValues();
 const result = [];
 for (let i = 1; i < data.length; i++) {
   const klassen = data[i][4] ? data[i][4].toString().split(",").map(k=>k.trim()) : [];
   if (klassen.includes(klas)) {
     result.push({
       username: data[i][0],
       naam: data[i][1] + " " + data[i][2]
     });
   }
 }
 return result;
}


// ── Leerling: feedback opslaan ───────────────────────────────


function saveFeedback(data) {
 logMessage("Feedback ingestuurd door: " + data.username + " voor " + data.docentNaam);
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FEEDBACK);
   if (!sheet) return { success: false, error: "Feedbackdatabase niet gevonden." };
   const newId    = "FB-" + sheet.getLastRow();
   const alias    = "Anoniem-" + Math.floor(1000 + Math.random() * 9000);
   const toel     = data.toelichting || "";
   const snippet  = toel.length > 60 ? toel.substring(0,60)+"…" : (toel || "Scores: "+data.q1+"/"+data.q2+"/"+data.q3);
  
   sheet.appendRow([
     newId, new Date().toISOString(), alias, data.klas||"?", snippet, toel,
     "pending","","FALSE",
     ((data.voornaam||"")+" "+(data.achternaam||"")).trim(),
     data.username, data.klas||"",
     data.username, data.leerjaar, data.niveau, data.klas,
     data.docentUsername, data.docentNaam,
     data.q1, data.q2, data.q3, toel
   ]);
   return { success: true, feedbackId: newId };
 } catch(e) { return { success: false, error: e.toString() }; }
}


// ── Leerling: eigen feedback ophalen ─────────────────────────


function getMyFeedback(username) {
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FEEDBACK);
   if (!sheet) return { success: true, data: [] };
   const data = sheet.getDataRange().getValues();
   if (data.length <= 1) return { success: true, data: [] };
   const result = data.slice(1)
     .filter(row => row[12] && row[12].toString() === username.toString())
     .map(row => ({
       id:          row[0] ? row[0].toString() : "",
       datum:       row[1] ? row[1].toString() : "",
       docent:      row[17] ? row[17].toString() : "",
       klas:        row[15] ? row[15].toString() : "",
       q1: row[18], q2: row[19], q3: row[20],
       toelichting: row[21] ? row[21].toString() : "",
       status:      row[6] ? row[6].toString().toLowerCase().trim() : "pending",
       afwijsReden: row[7] ? row[7].toString() : ""
     }));
   return { success: true, data: result };
 } catch(e) { return { success: false, error: e.toString() }; }
}

// ── Leerling: één specifiek feedbackbericht verwijderen ──

function deleteSingleFeedback(feedbackId, username) {
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FEEDBACK);
   if (!sheet) return { success: false, error: "Database niet gevonden." };
   const data = sheet.getDataRange().getValues();
   for (let i = 1; i < data.length; i++) {
     if (data[i][0].toString() === feedbackId.toString() &&
         data[i][12].toString() === username.toString()) {
       sheet.deleteRow(i + 1);
       logMessage("Feedback " + feedbackId + " verwijderd door eigenaar " + username);
       return { success: true };
     }
   }
   return { success: false, error: "Feedback niet gevonden of niet van jou." };
 } catch(e) { return { success: false, error: e.toString() }; }
}


// ── Moderator: alle feedback ophalen ─────────────────────────


function getFeedbackData() {
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FEEDBACK);
   if (!sheet) throw new Error("Tabblad niet gevonden.");
   const data = sheet.getDataRange().getValues();
   if (data.length <= 1) return JSON.stringify([]);
   return JSON.stringify(data.slice(1).map(row => {
     let dt = row[1];
     if (dt instanceof Date) dt = dt.toISOString(); else dt = dt ? dt.toString() : "";
     return {
       id: row[0]?row[0].toString():"", dateTime: dt,
       alias: row[2]?row[2].toString():"", classTag: row[3]?row[3].toString():"",
       snippet: row[4]?row[4].toString():"", fullFeedback: row[5]?row[5].toString():"",
       status: row[6]?row[6].toString().toLowerCase().trim():"pending",
       rejectionReason: row[7]?row[7].toString():null,
       identityRevealed: row[8]==="TRUE"||row[8]===true,
       studentInfo: { name:row[9]?row[9].toString():"", studentId:row[10]?row[10].toString():"", class:row[11]?row[11].toString():"" },
       docentUsername: row[16]?row[16].toString():"",
       docent: row[17]?row[17].toString():"",
       q1: row[18]!==undefined?row[18]:"",
       q2: row[19]!==undefined?row[19]:"",
       q3: row[20]!==undefined?row[20]:""
     };
   }));
 } catch(error) { throw new Error("Server Error: " + error.message); }
}


// ── Moderator: status bijwerken ──────────────────────────────


function updateFeedbackStatus(id, actionType, reason, identityRevealed) {
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FEEDBACK);
   if (!sheet) throw new Error("Tabblad niet gevonden.");
   const data = sheet.getDataRange().getValues();
   for (let i = 1; i < data.length; i++) {
     if (data[i][0].toString() === id.toString()) {
       const status = actionType==='approve' ? 'approved' : 'rejected';
       // Eén batch-write i.p.v. drie losse setValue-calls
       sheet.getRange(i+1, 7, 1, 3).setValues([[status, reason||"", identityRevealed?"TRUE":"FALSE"]]);
       logMessage("Feedback "+id+" → "+status);
       return true;
     }
   }
   throw new Error("Item met ID " + id + " niet gevonden.");
 } catch(error) { throw new Error("Update mislukt: " + error.message); }
}


// ── Moderator: docent aanmaken ───────────────────────────────


function createDocentAccount(voornaam, achternaam, vak, password, klassen) {
 if (!voornaam||!achternaam||!password)
   return { success: false, error: "⚠️ Vul alle verplichte velden in!" };


 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DOCENTEN);
 if (!sheet) return { success: false, error: "⚠️ Docentendatabase niet gevonden." };


 // username = voornaam.achternaam lowercase
 const base = (voornaam.toLowerCase().replace(/\s+/g,'') + "." + achternaam.toLowerCase().replace(/\s+/g,'')).normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const data = sheet.getDataRange().getValues();
 let username = base;
 let counter  = 1;
 const existing = data.slice(1).map(r => r[0].toString().toLowerCase());
 while (existing.includes(username)) { username = base + counter; counter++; }


 const klassenStr = Array.isArray(klassen) ? klassen.join(",") : klassen;
 sheet.appendRow([username, voornaam, achternaam, password, klassenStr, vak||""]);
 logMessage("Nieuw docentaccount aangemaakt: " + username + " | klassen: " + klassenStr);
 return { success: true, username };
}


// ── Docent: goedgekeurde feedback ophalen ────────────────────


function getApprovedFeedbackForDocent(docentUsername) {
 try {
   // Eén keer de spreadsheet openen i.p.v. twee keer (sneller)
   const ss = SpreadsheetApp.getActiveSpreadsheet();
   const sheet = ss.getSheetByName(SHEET_FEEDBACK);
   if (!sheet) return { success: false, error: "Database niet gevonden." };
   const data = sheet.getDataRange().getValues();
   if (data.length <= 1) return { success: true, data: [], vak: "" };

   // Vak van deze docent opzoeken in Docent_Accounts
   let vak = "";
   const docSheet = ss.getSheetByName(SHEET_DOCENTEN);
   if (docSheet) {
     const docData = docSheet.getDataRange().getValues();
     for (let i = 1; i < docData.length; i++) {
       if (String(docData[i][0]).trim() === docentUsername.trim()) {
         vak = docData[i][5] ? docData[i][5].toString() : "";
         break;
       }
     }
   }

   const approved = data.slice(1)
     .filter(row =>
       (row[6]||"").toString().toLowerCase().trim() === "approved" &&
       (row[16]||"").toString().trim() === docentUsername.trim()
     )
     .map(row => ({
       id:     row[0]?row[0].toString():"",
       docent: row[17]?row[17].toString():"",
       q1: parseFloat(row[18])||0,
       q2: parseFloat(row[19])||0,
       q3: parseFloat(row[20])||0,
       note:  row[21]?row[21].toString():"",
       klas:  row[15]?row[15].toString():"",
       datum: row[1]?row[1].toString():""
     }));
   return { success: true, data: approved, vak: vak };
 } catch(e) { return { success: false, error: e.toString() }; }
}


// ── Instellingen: data verwijderen ───────────────────────────


function deleteMyData(username) {
 try {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FEEDBACK);
   if (!sheet) return { success: false, error: "Sheet niet gevonden." };
   const data = sheet.getDataRange().getValues();
   let deleted = 0;
   for (let i = data.length - 1; i >= 1; i--) {
     if (data[i][12] && data[i][12].toString() === username.toString()) {
       sheet.deleteRow(i + 1);
       deleted++;
     }
   }
   logMessage("Data verwijderd voor: " + username + " (" + deleted + " rijen)");
   return { success: true, deleted };
 } catch(e) { return { success: false, error: e.toString() }; }
}

// ── Cookievoorkeur opslaan (per account, backend-opgeslagen) ─

function slaCookieKeuzeOp(username, role, ja) {
 try {
   const waarde = ja ? "true" : "false";

   if (role === "moderator") {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INSTELLINGEN);
     if (!sheet) return { success: false, error: "Instellingendatabase niet gevonden." };
     const data = sheet.getDataRange().getValues();
     for (let i = 1; i < data.length; i++) {
       if (data[i][0] === "moderator_cookie") {
         sheet.getRange(i + 1, 2).setValue(waarde);
         return { success: true };
       }
     }
     sheet.appendRow(["moderator_cookie", waarde]);
     return { success: true };
   }

   if (role === "docent") {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DOCENTEN);
     if (!sheet) return { success: false, error: "Docentendatabase niet gevonden." };
     const data = sheet.getDataRange().getValues();
     for (let i = 1; i < data.length; i++) {
       if (String(data[i][0]).trim() === String(username).trim()) {
         sheet.getRange(i + 1, 7).setValue(waarde);
         return { success: true };
       }
     }
     return { success: false, error: "Docent niet gevonden." };
   }

   if (role === "leerling") {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACCOUNTS);
     if (!sheet) return { success: false, error: "Leerlingendatabase niet gevonden." };
     const data = sheet.getDataRange().getValues();
     for (let i = 1; i < data.length; i++) {
       if (String(data[i][0]).trim() === String(username).trim()) {
         sheet.getRange(i + 1, 9).setValue(waarde);
         return { success: true };
       }
     }
     return { success: false, error: "Leerling niet gevonden." };
   }

   return { success: false, error: "Onbekende rol." };
 } catch(e) { return { success: false, error: e.toString() }; }
}
