# Manuelle Testcheckliste – Mathe-Abenteuer (Version 2)

Vor jeder Veröffentlichung einer neuen Version durchgehen. Abhaken mit `[x]`.
Empfohlen auf einem echten iPad (Safari + installierte App), zusätzlich kurz am Computer.

## 0. Automatische Tests
- [ ] `tests/index.html` öffnen → „40 von 40 Tests bestanden“
- [ ] optional: `node tests/run-node.js` → 43 von 43, `node tests/e2e/run-e2e.js` → 41 von 41

## 1. Start und Navigation
- [ ] Startbildschirm: Drache, Sprechblase, Punkte, Sterne, „Los geht's!“, „Meine Sammlung“ sichtbar
- [ ] „Los geht's!“ → Abenteuerkarte mit 5 Welten, nur Welt 1 frei, Markierung „Hier bist du!“
- [ ] Gesperrte Welt antippen → freundlicher Hinweis, nichts passiert
- [ ] Welt 1 → Levelauswahl: Level 1 frei (pulsiert), Level 2–5 und Truhen gesperrt
- [ ] Gesperrtes Level antippen → Hinweis in der Sprechblase
- [ ] Zurück-Pfeile führen jeweils eine Ebene zurück (Rechnen → Pause-Dialog → Welt → Karte → Start)
- [ ] Sammlung → zurück landet dort, wo man herkam

## 2. Zahlentastatur
- [ ] Ziffern erscheinen groß im Antwortfeld
- [ ] Maximal 3 Stellen (vierte Ziffer wird ignoriert)
- [ ] „Löschen“ entfernt die letzte Ziffer
- [ ] Bestätigen-Haken ist bei leerem Feld ausgegraut
- [ ] Schnelles doppeltes Tippen auf Bestätigen wertet nur einmal aus
- [ ] Externe Tastatur: Ziffern, Rücktaste, Enter funktionieren; Escape öffnet Pause
- [ ] Die iPad-Bildschirmtastatur erscheint nie

## 3. Richtige und falsche Antworten
- [ ] Richtig: grüner Rahmen, Drache freut sich, Lob + „+10“, Ton, nächste Aufgabe startet automatisch
- [ ] Falsch (1. Mal): orangefarbener Rahmen, freundlicher Text (nie „Falsch!“), keine Lösung, sanfter Ton
- [ ] Falsch (2. Mal): Tipp-Karte mit erstem Rechenschritt (z. B. „Rechne zuerst 54 − 20.“)
- [ ] Falsch (3. Mal): zweiter Tipp mit Zwischenergebnis
- [ ] Falsch (4. Mal): Schritt-für-Schritt-Erklärung, Kind tippt Ergebnis selbst ein (+2 Punkte)
- [ ] Punktestand sinkt nie
- [ ] Eine falsch gelöste Aufgabe taucht einige Aufgaben später im selben Level erneut auf

## 4. Punkte, Serien, Level
- [ ] Serie (Flamme) zählt richtige Antworten auf Anhieb, fällt bei Fehler auf 0
- [ ] Bei 5 in Folge: Einblendung „Serie! … +25“, bei 10: „Super-Serie! … +50“
- [ ] Fortschrittsbalken und „x / 10“ steigen mit jeder gelösten Aufgabe
- [ ] Nach der letzten Aufgabe: „Level geschafft!“, 1–3 Sterne, beim ersten Mal „+50 Level-Bonus“
- [ ] Level erneut spielen: kein zweiter Level-Bonus; Sterne werden nur verbessert, nie verschlechtert
- [ ] Nächstes Level wird freigeschaltet

## 5. Schatztruhen und Welten
- [ ] Nach Level 3: „Schatztruhe öffnen!“ → Truhe wackelt → antippen → Schatz + „+100“
- [ ] Truhe lässt sich kein zweites Mal öffnen (auch nicht durch Doppeltippen)
- [ ] Schließt man die App vor dem Öffnen, wartet die Truhe in der Levelauswahl („Öffnen!“)
- [ ] Nach Level 5: Welt-Truhe → Abzeichen → „Neue Welt ist frei“ mit Bild
- [ ] „Auf in die neue Welt!“ öffnet Welt 2; auf der Karte ist Welt 2 frei
- [ ] Sammlung zeigt gefundene Schätze farbig, fehlende als graue Silhouette mit „???“

## 6. Rechenlogik (Stichprobe)
- [ ] Welt 1: nur Zahlen bis 20, kein Zehnerübergang
- [ ] Welt 4/5: Zahlen bis 100, gemischt mit und ohne Zehnerübergang
- [ ] Nie ein Ergebnis unter 0 oder über 100
- [ ] Elternbereich „bis 20“: auch in Welt 5 nur Zahlen bis 20
- [ ] „Zehnerübergang aus“: keine Aufgabe wie 8 + 5 oder 42 − 7
- [ ] Nur „Subtraktion an“: ausschließlich Minus-Aufgaben
- [ ] Keine identische Aufgabe direkt hintereinander

## 7. Multiple Choice
- [ ] Elternbereich → Antwortmodus „Multiple Choice“ → 4 große Antwortknöpfe
- [ ] Richtige Antwort ist immer dabei, keine Zahl doppelt
- [ ] Falsche Antworten sind plausibel (z. B. 47 + 28 → 65, 75, 85)
- [ ] Falsch gewählte Antwort wird durchgestrichen und ist nicht mehr wählbar
- [ ] Tasten 1–4 auf externer Tastatur wählen die Antworten

## 8. Elternbereich
- [ ] Zahnrad kurz antippen → nur Hinweis „3 Sekunden gedrückt halten“
- [ ] 3 Sekunden halten → Ring füllt sich → Malaufgabe
- [ ] Falsche Lösung → Hinweis, Dialog schließt; richtige Lösung → Elternbereich
- [ ] Alle Einstellungen umschaltbar, aktive Option lila markiert, wirken sofort
- [ ] Addition und Subtraktion lassen sich nicht beide ausschalten
- [ ] Rundenlänge 5 / 20 / unbegrenzt wirkt; bei „unbegrenzt“ erscheint ab 5 Aufgaben „Level beenden“
- [ ] Hilfestellungen „aus“: keine Tipps, nach 3 Fehlversuchen Erklärung
- [ ] Sound „aus“: keine Töne
- [ ] Animationen „reduziert“: keine Sprünge, kein Konfetti, alle Informationen trotzdem sichtbar
- [ ] Statistik zeigt plausible Werte (heute, gesamt, Trefferquote, beste Serie, Fehlertypen, 7-Tage-Balken)
- [ ] „Zurücksetzen …“ → erst „Ja, löschen“, dann nochmal tippen → Stand gelöscht, Einstellungen bleiben
- [ ] „Abbrechen“ im Zurücksetzen-Dialog löscht nichts

## 9. Speichern
- [ ] Einige Aufgaben lösen, App komplett schließen, neu öffnen → Punkte, Sterne, Level, Sammlung, Einstellungen sind noch da
- [ ] Während eines Levels schließen → Punkte bleiben erhalten, Level startet beim nächsten Mal neu

## 10. PWA und Offline
- [ ] Safari → Teilen → „Zum Home-Bildschirm“ → Drachen-Icon erscheint
- [ ] Start über Icon: Vollbild ohne Safari-Leisten, Statusleiste/Kamera-Aussparung verdecken nichts
- [ ] Flugmodus an → App starten → alles funktioniert inkl. Bilder, Töne, Spielstand, Elternbereich, Statistik
- [ ] Nach Veröffentlichung einer neuen Version (VERSION erhöht): App online öffnen, schließen, erneut öffnen → neue Version aktiv, Spielstand erhalten

## 11. iPad-Darstellung
- [ ] Querformat: Aufgabe links, Zahlentastatur rechts, alles ohne Scrollen sichtbar
- [ ] Hochformat: Aufgabe oben, Zahlentastatur unten, alles ohne Scrollen sichtbar
- [ ] Drehen während des Spiels funktioniert ohne Fehler
- [ ] Keine horizontale Scrollleiste auf keinem Bildschirm
- [ ] Doppeltippen oder Zwei-Finger-Geste zoomt nicht versehentlich
- [ ] Langes Drücken markiert keinen Text und öffnet kein Kontextmenü
- [ ] Alle Knöpfe sind mit Kinderfingern gut treffbar (mind. ca. 60 px)

## 12. Barrierearmut
- [ ] Mit VoiceOver: Aufgaben werden vorgelesen („47 plus 28“), Knöpfe haben verständliche Namen
- [ ] Mit Tab-Taste (externe Tastatur) sind Knöpfe erreichbar und sichtbar markiert
- [ ] iPad-Einstellung „Bewegung reduzieren“ wird automatisch berücksichtigt

---

# Ergänzungen für Version 2

## 13. Update von Version 1 (wichtigster Test!)
- [ ] Vor dem Update: in Version 1 Punkte, Sterne und Welten notieren (Screenshot)
- [ ] Version 2 veröffentlichen, App über das **bestehende** Home-Bildschirm-Symbol online öffnen
- [ ] Nach spätestens einem Neustart: Elternbereich zeigt „Version 2.0.0 · Spielstand aus Version 1 übernommen“
- [ ] Punkte, Serie, beste Serie, Level-Sterne, Truhen, Schätze, Abzeichen, freie Welten und Statistik sind unverändert
- [ ] Einstellungen aus Version 1 (Zahlenraum, Antwortmodus, Sound …) sind erhalten
- [ ] Optisch weiterhin Funki-Stil (Hell), Start, Karte, Welten, Levelpfad wie bisher
- [ ] Danach offline neu starten → funktioniert

## 14. Bereichswechsel
- [ ] Karte zeigt oben „Plus & Minus“ und „Mal & Geteilt“, aktiver Bereich farbig
- [ ] Wechsel funktioniert per Antippen, Wahl bleibt nach Neustart erhalten
- [ ] Plus & Minus: Welten, Level, Truhen unverändert

## 15. Einmaleins: Aufgaben-Runde
- [ ] Zauberturm → „Aufgaben-Runde“ → Aufgaben wie `8 × 7` und `56 ÷ 8`
- [ ] Integrierte Zahlentastatur; Multiple Choice funktioniert ebenfalls
- [ ] Nie Division mit Rest, nie durch 0, Ergebnis höchstens 100
- [ ] Falsche Antwort → Ermutigung, dann Tipp (z. B. „Nimm 5 × 8 …“), dann Erklärung
- [ ] Punkte, Serie, Funki-Freude, Töne wie bei Plus/Minus
- [ ] Rundenende: Sterne, „Nochmal“, „Zum Zauberturm“
- [ ] Elternbereich: nur 7er-Reihe gewählt → nur 7er-Aufgaben; mehrere Reihen → nur diese; „alle“; „gemischt“
- [ ] Multiplikation aus → nur Geteilt (und umgekehrt); beide aus nicht möglich

## 16. Reihentraining (auf dem echten iPad prüfen!)
- [ ] Reihenkarte (z. B. 8er) → „Mal üben“: zehn Zeilen `1 × 8 =` … `10 × 8 =`
- [ ] Das erste Feld hat den Fokus, die **iPad-Zahlentastatur** erscheint
- [ ] Ergebnis + „Weiter“/Return → grüner Haken, Fokus springt ins nächste Feld, Tastatur bleibt offen
- [ ] Falsche Eingabe → Feld leert sich, Fokus bleibt, nach 2 Fehlern Tipp, nach 3 Erklärung
- [ ] Antippen eines beliebigen Feldes erlaubt Springen
- [ ] Kein Hineinzoomen beim Antippen der Felder
- [ ] „Geteilt üben“: `8 ÷ 8 =` … `80 ÷ 8 =`
- [ ] Ende: Sterne; beide Rechenarten mit 3 Sternen → Medaille in der Sammlung
- [ ] Hoch- und Querformat, auch mit eingeblendeter Tastatur bedienbar

## 17. Tempo
- [ ] Tempo „aus“: keine Tempo-Karte
- [ ] Countdown 1 Minute: Uhr läuft rückwärts, letzte 10 Sekunden hervorgehoben, leises Ticken in den letzten 5 Sekunden
- [ ] Nach Ablauf: „Zeit ist um!“ mit Aufgaben, auf Anhieb richtig, Trefferquote, bester Serie, Rekord
- [ ] Pause (Pfeil oben links) hält die Uhr an; App-Wechsel pausiert ebenfalls
- [ ] Eigene Dauer (z. B. 3 Minuten) einstellbar
- [ ] Stoppuhr: Zeit läuft aufwärts, Ende nach Rundenlänge, „benötigte Zeit“ und Bestzeit
- [ ] Reihentraining mit Stoppuhr: Zeit oben rechts, Bestzeit je Reihe
- [ ] Rekorde getrennt nach Modus/Dauer/Bereich, sichtbar in der Statistik

## 18. Dark Mode
- [ ] Elternbereich → Darstellung „Dunkel“: sofortige Umschaltung ohne Neuladen
- [ ] Start, Karte, Welten, Level, Zauberturm, Reihentraining, Sammlung, Dialoge, Elternbereich gut lesbar
- [ ] Funki, Truhen, Sterne, Konfetti unverändert
- [ ] „System“ folgt der iPad-Einstellung (Kontrollzentrum → Dunkelmodus umschalten)
- [ ] Einstellung bleibt nach Neustart erhalten, kein helles Aufblitzen beim Start

## 19. Export / Import
- [ ] Export → Teilen-Menü → „In Dateien sichern“ → Datei `funki-spielstand-….json` vorhanden
- [ ] Import derselben Datei → Zusammenfassung → „Importieren“ → Stand identisch
- [ ] Import einer beliebigen anderen Datei (z. B. Foto, Text) → „Import nicht möglich“, Stand unverändert
- [ ] Reset ist unabhängig von Import/Export (eigener Knopf, doppelte Bestätigung)

## 20. Update-Verhalten (für spätere Versionen)
- [ ] Neue Version veröffentlicht, App online offen in einem Level → **keine** Unterbrechung
- [ ] Zurück zum Startbildschirm → einmaliges Neuladen, danach neue Version, Spielstand erhalten
- [ ] Im Elternbereich erscheint „Neue Version bereit – Jetzt aktualisieren“, Tippen lädt einmal neu
