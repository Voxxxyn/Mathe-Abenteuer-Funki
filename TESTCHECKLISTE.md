# Manuelle Testcheckliste – Mathe-Abenteuer

Vor jeder Veröffentlichung einer neuen Version durchgehen. Abhaken mit `[x]`.
Empfohlen auf einem echten iPad (Safari + installierte App), zusätzlich kurz am Computer.

## 0. Automatische Tests
- [ ] `tests/index.html` öffnen → „21 von 21 Tests bestanden“

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
