# Mathe-Abenteuer 🐉

Ein kleines Abenteuerspiel zum Üben von **Plus und Minus bis 100** für Grundschulkinder.
Der kleine Drache **Funki** begleitet das Kind durch fünf Welten – vom Sonnendorf bis ins Weltall.
Das Kind rechnet, sammelt Punkte, Sterne, Schätze und Abzeichen und schaltet neue Welten frei.

- läuft komplett im Browser, **ohne Anmeldung, ohne Konto, ohne Server-Datenbank**
- funktioniert nach dem ersten Laden **vollständig offline**
- für das **iPad** optimiert und als App auf dem Home-Bildschirm installierbar (PWA)
- speichert den Spielstand **nur lokal auf dem Gerät** – kein Tracking, keine Werbung, keine Datenübertragung

---

## Inhalt

1. [Spielprinzip](#spielprinzip)
2. [Dateistruktur](#dateistruktur)
3. [Lokal ausprobieren](#lokal-ausprobieren)
4. [Veröffentlichen mit GitHub Pages (Schritt für Schritt)](#veröffentlichen-mit-github-pages-schritt-für-schritt)
5. [Andere Hoster](#andere-hoster)
6. [Auf dem iPad nutzen („Zum Home-Bildschirm“)](#auf-dem-ipad-nutzen)
7. [Offline-Test](#offline-test)
8. [Elternbereich und Einstellungen](#elternbereich-und-einstellungen)
9. [Spielstand zurücksetzen](#spielstand-zurücksetzen)
10. [Spätere Änderungen vornehmen](#spätere-änderungen-vornehmen)
11. [Tests](#tests)
12. [Datenschutz](#datenschutz)
13. [Häufige Fragen](#häufige-fragen)

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
- **Serie:** richtige Antworten auf Anhieb hintereinander. Bei 5 in Folge +25 Bonus, bei 10 in Folge +50.
- **Sterne pro Level:** ab 90 % auf Anhieb richtig ★★★, ab 70 % ★★, sonst ★. Level können wiederholt werden, um mehr Sterne zu holen. Level-Bonus und Truhen gibt es nur **einmal**.
- **Fehler:** 1. Fehlversuch → freundliche Ermutigung. 2. Fehlversuch → kleiner Rechentipp (z. B. „Rechne zuerst 54 − 20.“).
  3. Fehlversuch → zweiter Tipp („54 − 20 = 34. Jetzt noch 7 wegnehmen.“). Danach → Schritt-für-Schritt-Erklärung, das Kind tippt das Ergebnis selbst ein.
- **Adaptiv:** Aufgabentypen, die oft falsch sind oder lange dauern (z. B. „Minus mit Zehnerübergang bis 50“), kommen etwas häufiger (ca. 30 %). Aufgaben, die im Level falsch waren, kommen einige Aufgaben später noch einmal. Wer 9 von 10 Aufgaben auf Anhieb schafft, bekommt etwas schwierigere Aufgaben; bei vielen Fehlern wird es etwas leichter.

---

## Dateistruktur

```text
mathe-abenteuer/
├── index.html            Startseite der App (alle Bildschirme)
├── style.css             Gestaltung (Farben, Größen, Animationen, iPad-Layout)
├── app.js                Bedienung, Bildschirme, Spielablauf, Elternbereich
├── manifest.json         PWA-Angaben (Name, Icons, Farben, Vollbild)
├── service-worker.js     Offline-Speicher und Updates
├── README.md             diese Anleitung
├── TESTCHECKLISTE.md     manuelle Prüfliste
├── .nojekyll             sorgt dafür, dass GitHub Pages alle Dateien unverändert ausliefert
├── js/
│   ├── generator.js      Aufgabengenerator, Hinweise, Multiple Choice, adaptive Auswahl
│   ├── game.js           Spielregeln: Welten, Level, Punkte, Serien, Truhen
│   ├── storage.js        Speichern/Laden mit Prüfung aller Werte
│   ├── graphics.js       alle Grafiken als SVG (Drache, Truhen, Schätze, Abzeichen, Symbole)
│   └── sound.js          Soundeffekte (werden live erzeugt, keine Audiodateien nötig)
├── assets/
│   └── images/           Hintergründe der 5 Welten (SVG)
├── icons/                App-Icons (PNG) für iPad, Android und Browser
└── tests/
    ├── index.html        Selbsttest im Browser (21 automatische Prüfungen)
    ├── tests.js          die Testfälle
    └── run-node.js       dieselben Tests ohne Browser (optional, braucht Node.js)
```

Es gibt **keinen Build-Schritt**, keine Frameworks und keine externen Bibliotheken. Alle Schriften sind Systemschriften, alle Bilder und Töne gehören zum Projekt.

> Hinweis: Einen Ordner `assets/sounds/` gibt es bewusst nicht – alle Töne werden mit der Web-Audio-Schnittstelle direkt im Browser erzeugt (Datei `js/sound.js`). Das spart Speicher und funktioniert offline.

---

## Lokal ausprobieren

**Schnell anschauen:** `index.html` doppelklicken. Das Spiel läuft, allerdings ohne Offline-Funktion (Service Worker funktioniert nur über einen Webserver).

**Wie im echten Betrieb (mit Offline-Funktion):** einen kleinen lokalen Webserver starten.

- **Mac:** Terminal öffnen, in den Ordner wechseln und starten:
  ```bash
  cd Pfad/zu/mathe-abenteuer
  python3 -m http.server 8000
  ```
  Dann im Browser `http://localhost:8000` öffnen. Beenden mit `Ctrl + C`.
- **Windows:** Python installieren (python.org) und denselben Befehl in der Eingabeaufforderung ausführen – oder in Visual Studio Code die Erweiterung „Live Server“ nutzen.

---

## Veröffentlichen mit GitHub Pages (Schritt für Schritt)

Ergebnis: eine eigene Web-Adresse wie `https://DEINNAME.github.io/mathe-abenteuer/`, die auf dem iPad geöffnet wird.

1. **Konto anlegen:** auf [github.com](https://github.com) kostenlos registrieren (falls noch nicht vorhanden).
2. **Neues Repository:** oben rechts auf **„+“ → „New repository“**.
   - Name: `mathe-abenteuer`
   - Sichtbarkeit: **Public** (für kostenlose GitHub Pages nötig)
   - auf **„Create repository“** klicken.
3. **Dateien hochladen:** im neuen Repository auf **„uploading an existing file“** klicken.
   - Den **Inhalt** des Ordners `mathe-abenteuer` (also `index.html`, `app.js`, die Ordner `js`, `assets`, `icons`, `tests` usw.) per Drag & Drop in das Browserfenster ziehen.
   - Wichtig: `index.html` muss **direkt** im Repository liegen, nicht in einem Unterordner.
   - Die Datei `.nojekyll` ist auf dem Mac versteckt (Punkt am Anfang). Im Finder mit `Cmd + Shift + .` sichtbar machen und mit hochladen. Sie ist nicht zwingend nötig, schadet aber nicht.
   - Unten auf **„Commit changes“** klicken.
4. **GitHub Pages aktivieren:** **Settings → Pages**.
   - Unter „Build and deployment“ → **Source: „Deploy from a branch“**
   - **Branch: `main`**, Ordner **`/ (root)`** → **Save**.
5. **Warten:** nach 1–2 Minuten erscheint oben auf der Pages-Seite die Adresse, z. B.
   `https://DEINNAME.github.io/mathe-abenteuer/`
6. **Testen:** Adresse am Computer öffnen – der Startbildschirm mit dem Drachen erscheint.

GitHub Pages liefert automatisch über **HTTPS** aus – das ist Voraussetzung für Offline-Funktion und Installation auf dem iPad.

---

## Andere Hoster

Das Projekt ist eine rein statische Website. Es funktioniert überall, wo man Dateien hochladen kann und **HTTPS** verfügbar ist:

- **Netlify:** [app.netlify.com/drop](https://app.netlify.com/drop) öffnen und den Ordner `mathe-abenteuer` hineinziehen – fertig.
- **Cloudflare Pages:** „Create a project → Direct Upload“, Ordner hochladen, kein Build-Befehl.
- **Eigener Webspace:** Ordnerinhalt per FTP hochladen.

---

## Auf dem iPad nutzen

1. Das iPad muss beim **ersten Öffnen online** sein.
2. **Safari** öffnen und die Adresse eingeben (z. B. `https://DEINNAME.github.io/mathe-abenteuer/`).
3. Ein paar Sekunden warten, bis der Startbildschirm vollständig geladen ist.
4. Auf das **Teilen-Symbol** tippen (Quadrat mit Pfeil nach oben, oben rechts bzw. in der Adressleiste).
5. **„Zum Home-Bildschirm“** wählen, Namen bestätigen (z. B. „Mathe-Abenteuer“) → **„Hinzufügen“**.
6. Auf dem Home-Bildschirm erscheint das Drachen-Icon. Ab jetzt die App **immer über dieses Icon** starten – sie läuft dann im Vollbild wie eine normale App.

> **Wichtig:** Safari und die Home-Bildschirm-App haben auf dem iPad **getrennte Speicher**. Ein Spielstand, der in einem normalen Safari-Tab entstanden ist, erscheint nicht in der installierten App (und umgekehrt). Deshalb am besten direkt nach der Installation nur noch die App vom Home-Bildschirm nutzen.

**Empfehlung für Eltern:** Unter *Einstellungen → Bedienungshilfen → Geführter Zugriff* kann man das iPad auf diese eine App beschränken.

---

## Offline-Test

1. App wie oben beschrieben installieren und **einmal online starten** (kurz bis zur Abenteuerkarte tippen).
2. App schließen (vom unteren Rand nach oben wischen und App wegschieben).
3. iPad in den **Flugmodus** schalten (WLAN aus).
4. App über das Home-Bildschirm-Icon starten.
5. Prüfen: Startbildschirm, Karte mit Bildern, Level spielen, Töne, Truhe, Sammlung, Elternbereich und Statistik funktionieren. Der Spielstand ist noch da.

Gespeichert für die Offline-Nutzung werden alle Dateien, die in `service-worker.js` in der Liste `FILES` stehen.

---

## Elternbereich und Einstellungen

**Öffnen:** Auf dem Startbildschirm oder der Karte das **Zahnrad 3 Sekunden gedrückt halten** (ein lila Ring füllt sich). Danach eine kleine Malaufgabe lösen (z. B. „7 × 8“). Ein kurzes Antippen zeigt nur den Hinweis „Für Eltern: 3 Sekunden gedrückt halten“.

| Einstellung | Möglichkeiten | Standard | Bedeutung |
|---|---|---|---|
| Zahlenraum | bis 20 / 50 / 100 | bis 100 | Obergrenze für alle Zahlen und Ergebnisse (gilt immer, auch im Automatikmodus) |
| Addition | an / aus | an | Plus-Aufgaben |
| Subtraktion | an / aus | an | Minus-Aufgaben (mindestens eine Rechenart bleibt immer an) |
| Zehnerübergang | an / aus | an | Aufgaben wie 47 + 28 oder 52 − 7 |
| Schwierigkeit | automatisch / manuell | automatisch | automatisch: steigt mit den Welten und passt sich an; manuell: nur Zahlenraum und Zehnerübergang zählen |
| Antwortmodus | Zahlentastatur / Multiple Choice | Zahlentastatur | Multiple Choice zeigt 4 Antworten mit typischen Rechenfehlern |
| Rundenlänge | 5 / 10 / 20 / unbegrenzt | 10 | Aufgaben pro Level; „unbegrenzt“: Level kann ab 5 Aufgaben mit „Level beenden“ abgeschlossen werden |
| Hilfestellungen | an / aus | an | Tipps nach dem 2. und 3. Fehlversuch; bei „aus“ gibt es nach 3 Fehlversuchen direkt die Erklärung |
| Sound | an / aus | an | alle Soundeffekte |
| Animationen | an / reduziert | an | „reduziert“ schaltet Bewegungen und Konfetti ab (die iPad-Einstellung „Bewegung reduzieren“ wird automatisch berücksichtigt) |

Alle Änderungen wirken sofort und werden automatisch gespeichert.

**Statistik** (zweiter Reiter): Aufgaben heute und insgesamt, auf Anhieb richtig, Fehlversuche, Trefferquote, beste Serie, Punkte, geschaffte Level, freie Welten, Sterne, durchschnittliche Zeit pro Aufgabe, genutzte Hilfen, ein Balkendiagramm der letzten 7 Tage und die **häufigsten Fehlertypen** (z. B. „Minus mit Zehnerübergang (bis 50)“).

---

## Spielstand zurücksetzen

**In der App (empfohlen):** Elternbereich → Einstellungen → ganz unten **„Zurücksetzen …“** → „Ja, löschen“ → zur Sicherheit **ein zweites Mal** tippen.
Gelöscht werden Punkte, Sterne, Level, Sammlung und Statistik. **Die Einstellungen bleiben erhalten.**

**Komplett (inkl. Einstellungen):** die App vom Home-Bildschirm löschen (Icon lange drücken → „App entfernen“) und neu hinzufügen. In Safari: *Einstellungen → Apps → Safari → Erweitert → Website-Daten* → Eintrag der Adresse löschen.

---

## Spätere Änderungen vornehmen

1. Datei(en) ändern, z. B. Texte in `app.js`, Farben in `style.css` (oben unter `:root`), Welten und Namen in `js/game.js`, Punkte in `js/game.js` (`POINTS`), Schwierigkeitsstufen in `js/generator.js` (`STAGES`).
2. **Ganz wichtig:** In `service-worker.js` oben die Versionsnummer erhöhen, z. B.
   ```js
   var VERSION = 'v1.0.1';
   ```
   Nur so erkennen die installierten Apps, dass es eine neue Version gibt. Ohne diese Änderung bleibt die alte Version im Offline-Speicher.
3. Wenn neue Dateien (z. B. ein weiteres Bild) dazukommen: den Pfad zusätzlich in die Liste `FILES` in `service-worker.js` eintragen.
4. Geänderte Dateien bei GitHub hochladen („Add file → Upload files“, gleichnamige Dateien werden ersetzt) → „Commit changes“.
5. Auf dem iPad: App öffnen (online). Die neue Version wird im Hintergrund geladen und ist beim **nächsten Öffnen** bzw. beim nächsten Wechsel zum Startbildschirm aktiv. Der Spielstand bleibt erhalten.
6. Danach `tests/index.html` öffnen und prüfen, dass alle Tests grün sind.

Der gespeicherte Spielstand wird beim Laden immer geprüft: fehlende oder ungültige Werte werden automatisch durch sinnvolle Standardwerte ersetzt – die App stürzt also auch nach Änderungen nicht ab.

---

## Tests

- **Automatisch im Browser:** `https://DEINNAME.github.io/mathe-abenteuer/tests/` bzw. lokal `tests/index.html` öffnen. 21 Prüfungen laufen durch (u. a. tausende Aufgaben auf Zahlenraum, negative Ergebnisse, Multiple-Choice-Doppelungen, Hinweise, Punkte, Serien, Level, Truhen, Speichern, kaputte Speicherdaten). Der Spielstand wird dabei nicht verändert.
- **Ohne Browser (optional):** `node tests/run-node.js`
- **Manuell:** siehe [TESTCHECKLISTE.md](TESTCHECKLISTE.md).

---

## Datenschutz

- Alle Daten liegen ausschließlich im lokalen Speicher (`localStorage`) des Browsers auf dem Gerät.
- Kein Konto, keine Anmeldung, keine Cookies, keine Analyse- oder Tracking-Werkzeuge, keine Werbung.
- Die App lädt zur Laufzeit keine externen Dateien (keine Schriften, Bilder, Skripte oder Schnittstellen von Dritten).
- Beim Hosting auf GitHub Pages sieht nur GitHub technisch bedingt die Seitenaufrufe (wie bei jeder Website); Spielstände werden nie übertragen.

---

## Häufige Fragen

**Die App zeigt nach einer Änderung noch die alte Version.**
→ Versionsnummer in `service-worker.js` erhöht? App einmal online öffnen, schließen und erneut öffnen.

**Der Spielstand ist weg.**
→ Wurde die App über Safari statt über das Home-Bildschirm-Icon geöffnet (getrennte Speicher)? Oder wurden Website-Daten gelöscht? Im privaten Surfmodus wird nicht dauerhaft gespeichert – der Elternbereich zeigt dann einen Hinweis.

**Es ist kein Ton zu hören.**
→ Stummschalter/Lautstärke am iPad prüfen und im Elternbereich „Sound: an“ wählen. Töne starten aus technischen Gründen erst nach der ersten Berührung.

**Kann ich das Spiel auf mehreren Geräten nutzen?**
→ Ja, aber jedes Gerät hat seinen eigenen Spielstand (es gibt bewusst keine Cloud).
