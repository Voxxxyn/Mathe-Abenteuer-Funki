# Mathe-Abenteuer mit Funki 🐉 – Version 2

Ein kleines Abenteuerspiel zum Üben von **Plus und Minus bis 100** und – neu in Version 2 – dem **kleinen Einmaleins (Mal und Geteilt)** für Grundschulkinder.
Der kleine Drache **Funki** begleitet das Kind durch fünf Welten vom Sonnendorf bis ins Weltall und durch den neuen **Einmaleins-Zauberturm**.
Das Kind rechnet, sammelt Punkte, Sterne, Schätze, Abzeichen und Reihen-Medaillen und schaltet neue Welten frei.

- läuft komplett im Browser, **ohne Anmeldung, ohne Konto, ohne Server-Datenbank**
- funktioniert nach dem ersten Laden **vollständig offline**
- für das **iPad** optimiert und als App auf dem Home-Bildschirm installierbar (PWA)
- speichert den Spielstand **nur lokal auf dem Gerät** – kein Tracking, keine Werbung, keine Datenübertragung

---

## Inhalt

1. [Neu in Version 2](#neu-in-version-2)
2. [Spielprinzip](#spielprinzip)
3. [Einmaleins: Mal & Geteilt](#einmaleins-mal--geteilt)
4. [Tempo-Modus](#tempo-modus)
5. [Hell und Dunkel](#hell-und-dunkel)
6. [Dateistruktur](#dateistruktur)
7. [Lokal ausprobieren](#lokal-ausprobieren)
8. [Veröffentlichen mit GitHub Pages (Schritt für Schritt)](#veröffentlichen-mit-github-pages-schritt-für-schritt)
9. [Andere Hoster](#andere-hoster)
10. [Auf dem iPad nutzen](#auf-dem-ipad-nutzen)
11. [Update von Version 1 auf Version 2 (iPad)](#update-von-version-1-auf-version-2-ipad)
12. [Spielstand: Migration, Backup, Export und Import](#spielstand-migration-backup-export-und-import)
13. [Offline-Test](#offline-test)
14. [Elternbereich und Einstellungen](#elternbereich-und-einstellungen)
15. [Spielstand zurücksetzen](#spielstand-zurücksetzen)
16. [Spätere Änderungen vornehmen](#spätere-änderungen-vornehmen)
17. [Tests](#tests)
18. [Datenschutz](#datenschutz)
19. [Häufige Fragen](#häufige-fragen)

---

## Neu in Version 2

| Bereich | Neu |
|---|---|
| Rechenbereiche | Kindgerechter Wechsel auf der Abenteuerkarte: **Plus & Minus** (wie bisher) oder **Mal & Geteilt** |
| Kleines Einmaleins | Reihen 1–10, Multiplikation und Division (immer ohne Rest, nie durch 0), einzelne Reihe, mehrere Reihen, alle Reihen oder gemischt |
| Einmaleins-Zauberturm | Aufgaben-Runde mit Funki, Punkten, Serien, Hinweisen und Sternen; Sterne pro Reihe; 10 Reihen-Medaillen in der Sammlung |
| Reihentraining | Eine Reihe am Stück (`1 × 8 … 10 × 8` bzw. `8 ÷ 8 … 80 ÷ 8`) mit echten Eingabefeldern und der iPad-Zahlentastatur |
| Tempo | Countdown (1, 2, 5, 10 Minuten oder eigene Dauer) und Stoppuhr, mit Ergebnis, Trefferquote, bester Serie und Bestwerten |
| Darstellung | Hell, Dunkel („Funki bei Nacht“) oder automatisch wie das iPad (System) |
| Daten | Automatische Übernahme des V1-Spielstands, einmalige Sicherung, Export und Import als JSON-Datei |
| Statistik | Zusätzlich nach Rechenart, nach Einmaleins-Reihe, Tempo-Runden und Bestzeiten |
| Updates | Neue Versionen werden vollständig im Hintergrund geladen und erst in einem ruhigen Moment aktiviert |

Unverändert geblieben sind Funki, die fünf Welten mit je 5 Leveln, Schatztruhen, Punkte, Sterne, Serien, Plus/Minus-Aufgaben, Hinweise, Zahlentastatur, Multiple Choice, Sammlung, Offline-Funktion und das iPad-Layout. **Bisherige Fortschritte bleiben vollständig gültig.**

---

## Spielprinzip

| Welt | Name | Schwierigkeit (automatisch) |
|---|---|---|
| 1 | Sonnendorf | kleine Zahlen bis 20, kein Zehnerübergang |
| 2 | Zauberwald | bis 30, erste Zehnerübergänge (z. B. 8 + 5, 17 + 6) |
| 3 | Wolkenburg | bis 50, mehr Zehnerübergänge, glatte Zehner |
| 4 | Feuerberg | bis 100, zweistellig ± zweistellig |
| 5 | Sternenreise | bis 100, gemischte anspruchsvolle Aufgaben |

- Jede Welt hat **5 Level**. Ein Level besteht standardmäßig aus **10 Aufgaben**.
- Nach **Level 3** gibt es eine **Schatztruhe** (Sammelgegenstand + 100 Punkte).
- Nach **Level 5** gibt es die **Welt-Schatztruhe** (Gegenstand, Abzeichen) – danach ist die **nächste Welt frei**.
- **Punkte:** richtig beim 1. Versuch +10, beim 2. Versuch +5, nach Hilfen +2. **Keine Punktabzüge.**
- **Serie:** richtige Antworten auf Anhieb hintereinander (gilt in allen Bereichen). Bei 5 in Folge +25 Bonus, bei 10 in Folge +50.
- **Sterne:** ab 90 % auf Anhieb richtig ★★★, ab 70 % ★★, sonst ★. Level-Bonus und Truhen gibt es nur **einmal**.
- **Fehler:** 1. Fehlversuch → Ermutigung. 2. Fehlversuch → kleiner Rechentipp. 3. Fehlversuch → zweiter Tipp. Danach → Schritt-für-Schritt-Erklärung, das Kind tippt das Ergebnis selbst ein.
- **Adaptiv:** Aufgabentypen, die oft falsch sind oder lange dauern, kommen etwas häufiger (ca. 30 %). Falsch gelöste Aufgaben kommen einige Aufgaben später noch einmal.

---

## Einmaleins: Mal & Geteilt

Auf der **Abenteuerkarte** oben zwischen **„Plus & Minus“** und **„Mal & Geteilt“** wechseln. „Mal & Geteilt“ öffnet den **Einmaleins-Zauberturm**:

- **Aufgaben-Runde:** Einzelaufgaben wie `8 × 7 = ?` oder `56 ÷ 8 = ?` – genau wie die bisherigen Level mit Funki, integrierter Zahlentastatur (oder Multiple Choice), Punkten, Serien, Hinweisen und 1–3 Sternen.
- **Reihentraining:** eine Reihenkarte antippen (1er bis 10er), dann „Mal üben“ oder „Geteilt üben“.
  - Alle zehn Aufgaben der Reihe stehen untereinander, jeweils mit einem großen Eingabefeld.
  - Hier erscheint bewusst die **Zahlentastatur des iPads** (`inputmode="numeric"`).
  - Ergebnis eintippen und **„Weiter“/Enter** drücken (oder „Prüfen & weiter“) → richtig: grüner Haken, das nächste Feld bekommt automatisch den Fokus. Falsch: Funki ermutigt, nach dem 2. Fehlversuch kommt ein Tipp, nach dem 3. die Erklärung.
  - Jede Reihe sammelt eigene Sterne für Mal und für Geteilt. Haben **beide 3 Sterne**, gibt es die **Medaille** dieser Reihe (Sammlung → „Einmaleins-Medaillen“).
- **Regeln der Aufgaben:** Reihen 1 bis 10, Ergebnis höchstens 100; Division immer **ohne Rest** und **nie durch 0**.
- **Reihenauswahl** (Elternbereich): einzelne Reihe, mehrere Reihen, **alle** (gleichmäßig) oder **gemischt** (alle Reihen, schwierige Reihen 3, 4, 6–9 etwas häufiger).
- **Adaptiv:** Reihen mit vielen Fehlern oder langer Bearbeitungszeit kommen moderat öfter dran (ca. 25 %). Die Plus/Minus-Anpassung bleibt davon unberührt.

Die Welten werden durch das Einmaleins **nicht** neu bewertet – der Zauberturm ist eine zusätzliche Trainingsstruktur.

---

## Tempo-Modus

Im Elternbereich unter **Tempo** einschalten. Dann erscheint auf der Abenteuerkarte zusätzlich eine **Tempo-Runde** (für den gerade gewählten Rechenbereich). Die normalen Level bleiben unverändert.

| Modus | Ablauf | Ergebnis | Bestwert |
|---|---|---|---|
| Countdown | Uhr läuft rückwärts (1, 2, 5, 10 Minuten oder eigene Dauer 1–30 Minuten) | Aufgaben, auf Anhieb richtig, Trefferquote, beste Serie | meiste richtige Antworten |
| Stoppuhr | Zeit läuft aufwärts, feste Anzahl Aufgaben (= Rundenlänge, „unbegrenzt“ = 20) | benötigte Zeit, Aufgaben, Trefferquote, beste Serie | kürzeste Zeit |
| Reihentraining mit Stoppuhr | Stoppuhr-Einstellung gilt auch fürs Reihentraining | Zeit für 10 Aufgaben | Bestzeit je Reihe und Rechenart |

Bestwerte werden nur zwischen **vergleichbaren** Runden verglichen (gleicher Modus, gleiche Dauer bzw. Anzahl, gleicher Rechenbereich und gleiche Aufgaben-Einstellungen). Die Pause-Taste (Pfeil oben links) hält die Uhr an; beim Wechsel aus der App wird automatisch pausiert.

Mögliche Kombinationen: Plus/Minus normal · Countdown · Stoppuhr, Mal/Geteilt normal · Countdown · Stoppuhr, Reihentraining normal · Stoppuhr.

---

## Hell und Dunkel

Elternbereich → **Darstellung**: **Hell** (Standard, wie Version 1), **Dunkel** oder **System** (folgt der iPad-Einstellung). Die dunkle Darstellung ist eigens gestaltet („Funki bei Nacht“): dunkle Nachtfarben, abgedunkelte Weltbilder, kräftige Knöpfe und hoher Kontrast – Funki und alle Belohnungsanimationen bleiben unverändert. Umschalten wirkt sofort und wird gespeichert.

---

## Dateistruktur

```text
mathe-abenteuer/
├── index.html            Startseite der App (alle Bildschirme)
├── style.css             Gestaltung inkl. dunkler Darstellung (Farbvariablen oben)
├── app.js                Bedienung, Bildschirme, Spielablauf, Elternbereich, Export/Import, Updates
├── manifest.json         PWA-Angaben (Name, Icons, Farben, Vollbild) – unverändert seit V1
├── service-worker.js     Offline-Speicher und Updates (VERSION = 'v2.0.0')
├── README.md             diese Anleitung
├── TESTCHECKLISTE.md     manuelle Prüfliste
├── CHANGELOG.md          Änderungen je Version
├── js/
│   ├── version.js        zentrale Versionsnummer (App 2.0.0, Speicherschema 2)
│   ├── storage.js        Speichern/Laden, Prüfung, Migration V1 → V2, Backup, Export/Import
│   ├── generator.js      Aufgaben (Plus/Minus und Einmaleins), Hinweise, Multiple Choice, Anpassung
│   ├── game.js           Spielregeln: Welten, Level, Truhen, Punkte, Serien, Reihen-Sterne, Tempo-Bestwerte
│   ├── graphics.js       alle Grafiken als SVG (Funki, Truhen, Schätze, Abzeichen, Zauberturm, Medaillen)
│   └── sound.js          Soundeffekte, live erzeugt (keine Audiodateien nötig)
├── assets/images/        Hintergründe der 5 Welten und des Zauberturms (SVG)
├── icons/                App-Icons (PNG)
└── tests/
    ├── index.html        Selbsttest im Browser (40 automatische Prüfungen)
    ├── tests.js          die Testfälle
    ├── fixtures/         echter Spielstand aus Version 1 für die Migrationstests
    ├── run-node.js       dieselben Tests ohne Browser + Prüfung von Service Worker, Manifest, externen Adressen
    └── e2e/run-e2e.js    optionaler Browser-Gesamttest (Playwright) für Entwickler
```

Es gibt weiterhin **keinen Build-Schritt**, keine Frameworks und keine externen Bibliotheken. Alle Schriften sind Systemschriften, alle Bilder und Töne gehören zum Projekt.

---

## Lokal ausprobieren

**Schnell anschauen:** `index.html` doppelklicken. Das Spiel läuft, allerdings ohne Offline-Funktion.

**Wie im echten Betrieb (mit Offline-Funktion):** einen kleinen lokalen Webserver starten.

```bash
cd Pfad/zu/mathe-abenteuer
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen. Beenden mit `Ctrl + C`.

> Auf dem iPad selbst lässt sich die App nicht aus einer ZIP-Datei oder der Dateien-App starten – sie braucht eine Internetadresse (siehe GitHub Pages).

---

## Veröffentlichen mit GitHub Pages (Schritt für Schritt)

Ergebnis: eine eigene Adresse wie `https://DEINNAME.github.io/Mathe-Abenteuer-Funki/`.

1. Auf [github.com](https://github.com) anmelden.
2. Repository öffnen (bzw. neu anlegen: **„+“ → „New repository“**, Sichtbarkeit **Public**).
3. Dateien hochladen: **„Add file → Upload files“**, den **Inhalt** des Projektordners hineinziehen (`index.html` muss direkt im Repository liegen) → **„Commit changes“**.
4. **Settings → Pages** → Source **„Deploy from a branch“**, Branch **`main`**, Ordner **`/ (root)`** → **Save**.
5. Nach 1–2 Minuten erscheint die Adresse oben auf der Pages-Seite.

Für Version 2 gilt: Die Änderungen liegen im Branch `v2-development` und kommen über den **Pull Request** nach `main`. Sobald der Pull Request gemergt ist, veröffentlicht GitHub Pages automatisch Version 2 unter **derselben Adresse**.

---

## Andere Hoster

Rein statische Website – funktioniert überall mit **HTTPS**: Netlify (Ordner auf [app.netlify.com/drop](https://app.netlify.com/drop) ziehen), Cloudflare Pages (Direct Upload, kein Build-Befehl) oder eigener Webspace.

---

## Auf dem iPad nutzen

1. Beim **ersten Öffnen online** sein.
2. **Safari** öffnen und die Adresse eingeben.
3. Warten, bis der Startbildschirm vollständig geladen ist.
4. **Teilen-Symbol** → **„Zum Home-Bildschirm“** → **„Hinzufügen“**.
5. Ab jetzt die App **immer über das Drachen-Icon** starten.

> Safari und die Home-Bildschirm-App haben auf dem iPad **getrennte Speicher**. Am besten nur noch die App vom Home-Bildschirm nutzen.

---

## Update von Version 1 auf Version 2 (iPad)

**Das vorhandene Home-Bildschirm-Symbol kann normalerweise weiterverwendet werden.** Adresse, Manifest-ID, Start-Adresse und Bereich (`scope`) sind unverändert – das iPad erkennt Version 2 als dieselbe App.

So läuft das Update ab:

1. Version 2 wird veröffentlicht (Pull Request nach `main` mergen, 1–2 Minuten warten).
2. Die App auf dem iPad **online** öffnen. Sie lädt die neue Version vollständig im Hintergrund.
3. Beim Übergang von Version 1 wird die neue Version sofort aktiv; die App lädt sich einmal neu, sobald der **Startbildschirm** angezeigt wird. Spätestens beim **nächsten Öffnen** läuft Version 2.
4. Beim ersten Start von Version 2 wird der Spielstand automatisch übernommen (siehe unten). Im Elternbereich steht dann **„Version 2.0.0 · Spielstand aus Version 1 übernommen“**.

Ab Version 2 gilt für alle weiteren Updates: Eine neue Version wird vollständig vorgeladen und erst aktiviert, wenn die App auf dem Startbildschirm ist oder im Elternbereich **„Jetzt aktualisieren“** getippt wird. Ein laufendes Level wird nie unterbrochen; es gibt genau ein Neuladen, keine Schleife. Schlägt das Vorladen fehl (z. B. Verbindungsabbruch), bleibt die bisherige Version unverändert nutzbar.

Nur falls nach einem Tag immer noch Version 1 läuft: App komplett schließen (vom unteren Rand nach oben wischen, App wegschieben) und online neu öffnen. Das Symbol neu anzulegen ist nicht nötig – und wäre sogar ungünstig, weil eine neu hinzugefügte App einen eigenen, leeren Speicher bekommen kann.

---

## Spielstand: Migration, Backup, Export und Import

**Speicherorte im Browser (localStorage):**

| Schlüssel | Inhalt |
|---|---|
| `matheAbenteuer.v2` | aktueller Spielstand (Schema 2) |
| `matheAbenteuer.v1` | Spielstand aus Version 1 – wird von Version 2 **nie verändert** |
| `matheAbenteuer.v1.backup-before-v2` | unveränderte Kopie des V1-Stands, angelegt **einmal** vor der ersten Migration |
| `matheAbenteuer.backup-before-import` | Sicherung des Stands vor dem letzten Import |

**Migration V1 → V2 (automatisch beim ersten Start):** V1-Stand laden → unverändert sichern → prüfen → V2-Struktur erzeugen → alle bisherigen Daten übernehmen (Einstellungen, Punkte, Serie, beste Serie, Level und Sterne, Schatztruhen, Gegenstände, Abzeichen, freigeschaltete Welten, Statistik inkl. Tage und Fehlerschwerpunkte) → neue Bereiche mit Standardwerten ergänzen (Einmaleins, Tempo, Darstellung „Hell“, Bereich „Plus & Minus“) → als V2 speichern. Das Backup wird bei späteren Starts nicht überschrieben.

**Export:** Elternbereich → Einstellungen → **Daten → „Exportieren“**. Auf dem iPad öffnet sich das Teilen-Menü → **„In Dateien sichern“**. Die Datei `funki-spielstand-JJJJ-MM-TT.json` enthält Schema-Version, App-Version, Zeitstempel, Einstellungen, Fortschritt, Statistik, Tempo-Ergebnisse und Einmaleins-Daten.

**Import:** **„Importieren …“** → Datei wählen. Akzeptiert werden Exporte aus Version 2 und Spielstände aus Version 1 (werden automatisch migriert). Vor dem Übernehmen zeigt die App eine Zusammenfassung; der bisherige Stand wird automatisch gesichert. Ungültige Dateien, Dateien anderer Apps oder aus neueren Versionen werden abgelehnt – der aktuelle Stand bleibt dann unverändert.

---

## Offline-Test

1. App installieren und **einmal online starten** (kurz bis zur Abenteuerkarte und in den Zauberturm tippen).
2. App schließen, **Flugmodus** einschalten, App über das Icon starten.
3. Prüfen: Start, Karte, beide Rechenbereiche, Reihentraining (Tastatur erscheint), Tempo-Runde, Töne, Truhe, Sammlung, Elternbereich, Statistik, Dunkel-Modus. Der Spielstand ist noch da.

Offline gespeichert werden alle Dateien aus der Liste `FILES` in `service-worker.js`.

---

## Elternbereich und Einstellungen

**Öffnen:** Auf Start oder Karte das **Zahnrad 3 Sekunden gedrückt halten**, dann eine kleine Malaufgabe lösen.

| Gruppe | Einstellung | Möglichkeiten | Standard |
|---|---|---|---|
| Rechenbereich | Rechenbereich beim Start | Plus & Minus / Mal & Geteilt | Plus & Minus |
| Plus & Minus | Zahlenraum | bis 20 / 50 / 100 | bis 100 |
| | Addition, Subtraktion | an / aus | an |
| | Zehnerübergang | an / aus | an |
| | Schwierigkeit | automatisch / manuell | automatisch |
| Mal & Geteilt | Multiplikation, Division | an / aus (eins bleibt immer an) | an |
| | Reihen | 1–10 einzeln/mehrere, alle, gemischt | alle |
| Spielablauf | Antwortmodus | Zahlentastatur / Multiple Choice | Zahlentastatur |
| | Rundenlänge | 5 / 10 / 20 / unbegrenzt | 10 |
| | Hilfestellungen | an / aus | an |
| Tempo | Tempo-Modus | aus / Countdown / Stoppuhr | aus |
| | Countdown-Dauer | 1 / 2 / 5 / 10 Min / eigene (1–30) | 2 Min |
| Darstellung, Ton & Bewegung | Darstellung | Hell / Dunkel / System | Hell |
| | Sound | an / aus | an |
| | Animationen | an / reduziert | an |
| Daten | Export, Import | siehe oben | – |

Ganz unten steht die **App-Version** (aktuell **Version 2.0.0**).

**Statistik:** Aufgaben heute und insgesamt, Trefferquote, beste Serie, Punkte, Level, Welten, Sterne, Ø Zeit, Hilfen, 7-Tage-Balken, **Tabelle nach Rechenart** (Plus, Minus, Mal, Geteilt), **Einmaleins nach Reihen** (Anzahl, Quote auf Anhieb, Ø Zeit, Sterne), **häufigste Fehlertypen** (inkl. Reihen) sowie **Tempo-Runden mit Bestwerten** und den letzten Runden.

---

## Spielstand zurücksetzen

Elternbereich → Einstellungen → **„Zurücksetzen …“** → „Ja, löschen“ → **ein zweites Mal** tippen. Gelöscht werden Punkte, Sterne, Level, Sammlung, Einmaleins-Sterne und -Medaillen, Tempo-Bestwerte und Statistik. **Die Einstellungen bleiben erhalten.** Zurücksetzen ist unabhängig von Export/Import – vorher am besten einmal exportieren.

---

## Spätere Änderungen vornehmen

1. Dateien ändern (Texte in `app.js`, Farben in `style.css` unter `:root` bzw. `html[data-theme="dark"]`, Welten und Punkte in `js/game.js`, Schwierigkeitsstufen in `js/generator.js`).
2. **Versionsnummer an zwei Stellen erhöhen:** `js/version.js` (`app: '2.0.1'`) und `service-worker.js` (`var VERSION = 'v2.0.1';`). Der Test prüft, dass beide zusammenpassen.
3. Neue Dateien zusätzlich in die Liste `FILES` in `service-worker.js` eintragen.
4. Neue Felder im Spielstand immer in `js/storage.js` (Standardwerte + Prüfung in `sanitize`) ergänzen – so bleiben alte Spielstände gültig.
5. Tests ausführen (siehe unten), dann hochladen.

---

## Tests

- **Im Browser:** `…/tests/` bzw. lokal `tests/index.html` öffnen → 40 Prüfungen (Plus/Minus, Einmaleins, Division ohne Rest, Hinweise, Multiple Choice, Punkte, Serien, Level, Truhen, Migration mit echtem V1-Spielstand, Backup, Export/Import, Reset, Tempo, Regression aller 25 Level). Der Spielstand wird dabei nicht verändert.
- **Ohne Browser:** `node tests/run-node.js` → dieselben Tests plus Service-Worker-Version, Offline-Dateiliste, Manifest und „keine externen Adressen“.
- **Browser-Gesamttest (optional, für Entwickler):** `npm install playwright` und `npx playwright install chromium`, dann `node tests/e2e/run-e2e.js` → 41 Prüfungen in einem echten Browser (Migration, Bereichswechsel, Reihentraining mit Fokus, Countdown, Stoppuhr, Dunkel-Modus inkl. Kontrast, Export, Import, Reset, Offline-Neustart, Hoch-/Querformat).
- **Manuell auf dem iPad:** [TESTCHECKLISTE.md](TESTCHECKLISTE.md).

---

## Datenschutz

- Alle Daten liegen ausschließlich im lokalen Speicher des Browsers auf dem Gerät.
- Kein Konto, keine Anmeldung, keine Cookies, keine Analyse- oder Tracking-Werkzeuge, keine Werbung.
- Zur Laufzeit werden keine externen Dateien geladen (keine Schriften, Bilder, Skripte oder Schnittstellen von Dritten).
- Export-Dateien entstehen nur auf Wunsch und werden nur dorthin gespeichert, wo man sie selbst ablegt.

---

## Häufige Fragen

**Muss ich die App nach dem Update neu auf den Home-Bildschirm legen?** Nein. Einfach online öffnen; die App aktualisiert sich selbst und behält den Spielstand.

**Die App zeigt nach einer Änderung noch die alte Version.** Versionsnummern erhöht? App einmal online öffnen, im Elternbereich „Jetzt aktualisieren“ tippen oder die App schließen und neu öffnen.

**Der Spielstand ist weg.** Wurde die App über Safari statt über das Icon geöffnet (getrennte Speicher)? Mit einer Export-Datei lässt sich der Stand jederzeit wiederherstellen (Import).

**Beim Reihentraining erscheint keine Tastatur.** Einmal in ein Eingabefeld tippen. Bei angeschlossener Hardware-Tastatur blendet das iPad die Bildschirmtastatur aus.

**Kann ich das Spiel auf mehreren Geräten nutzen?** Ja, jedes Gerät hat seinen eigenen Stand. Mit Export/Import lässt sich ein Stand übertragen.
