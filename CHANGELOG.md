# Änderungsprotokoll – Mathe-Abenteuer (Funki)

## Version 2.0.0 (Branch `v2-development`)

Basis: Version 1.0.0, Commit `1f752d598a2e9ffe584f909aa9aa81f49f67466a` („Add files via upload“, 27.09.2026) auf `main`.

**Neu**
- Bereichswechsel auf der Abenteuerkarte: Plus & Minus / Mal & Geteilt
- Kleines Einmaleins (Reihen 1–10, Mal und Geteilt ohne Rest, nie durch 0), Reihenauswahl einzeln/mehrere/alle/gemischt
- Einmaleins-Zauberturm mit Aufgaben-Runde, Sternen je Reihe und 10 Reihen-Medaillen
- Reihentraining mit echten Eingabefeldern und der iPad-Zahlentastatur
- Tempo: Countdown (1/2/5/10 Min, eigene Dauer) und Stoppuhr, vergleichbare Bestwerte
- Darstellung Hell / Dunkel / System, ohne Neuladen umschaltbar
- Export und Import des Spielstands (JSON), Sicherung vor jedem Import
- Erweiterte Statistik: Rechenarten, Reihen, Tempo-Runden, Bestzeiten
- Versionsanzeige im Elternbereich, zentrale Versionsdatei `js/version.js`

**Geändert**
- Speicherformat Schema 2 unter `matheAbenteuer.v2`; automatische Übernahme aus `matheAbenteuer.v1`, einmalige Sicherung `matheAbenteuer.v1.backup-before-v2`, V1-Daten bleiben unverändert
- Service Worker `v2.0.0`: vollständiges Vorladen, Aktivierung erst auf Anfrage bzw. am Startbildschirm, Sonderfall für den Übergang von V1
- Farben in `style.css` als Variablen (helle Darstellung optisch unverändert)

**Unverändert**
- Funki, Startbildschirm, fünf Welten mit je 5 Leveln, Schatztruhen, Punkte, Sterne, Serien, Plus/Minus-Generator, Hinweise, Zahlentastatur, Multiple Choice, Sammlung, Manifest (id, start_url, scope), Icons

## Version 1.0.0
Erste Veröffentlichung: Plus und Minus bis 100, fünf Welten, Schatztruhen, Elternbereich, Statistik, offline nutzbar.
