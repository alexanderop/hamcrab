# Teststrategie

Jeder Test soll auf der kleinsten Ebene laufen, die seinen Fehler tatsächlich zeigen kann. Grundlage sind die AOP-Principles **Test at the Right Layer**, **Make Dependencies Explicit** und **Functional Core** aus `aop-mode`.

## Aufteilung

| Ebene                                    | Was sie beweist                                                                                                   | Was sie nicht beweist                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Vitest Node                              | Pflege- und Zeitregeln, Namensvalidierung, Anwendungsfälle mit deterministischen Ports, Importgrenzen             | Browser-Verhalten und reale Speicherung                                  |
| Vitest Browser Mode, Google Chrome       | Formulare, native Dialoge, Fokus, Tastatur, Vue-Service-Anbindung, echte IndexedDB-Transaktionen und localStorage | Verdrahtung des Produktionsbuilds und Offline-Installation               |
| Playwright/Gherkin, Chromium und Firefox | Produktions-App, Wiederherstellung nach Reload, Service Worker, mehrere Tabs, 3D, gesamtes Layout                 | Vollständige Regelkombinationen oder ein umfassendes Accessibility-Audit |

Es gibt keine Modul-Mocks, keine simulierte DOM-Umgebung und keine HTTP-Mock-Infrastruktur. Die App hat keinen HTTP-Backend-Adapter. Die vorhandene Playwright-Uhr kontrolliert Zeit in App-Journeys; Service-Tests erhalten eine explizite Uhr. Node-Service-Tests verwenden einen kleinen Speicher-Port. Der ist kein Nachweis für Dexie: Browser-Tests prüfen zusätzlich echte IndexedDB-Verbindungen, Konkurrenz und Rollback.

## Migration der bisherigen E2E-Abdeckung

Die bisherigen 46 E2E-Szenarien bestanden vor und nach dem Architekturumbau. Die damalige reduzierte Suite enthält 26 Szenarien pro Browser. Die Freundschaftserweiterung ergänzt fünf weitere Journeys. Verschobene Tests wurden durch passende niedrigere Ebenen ersetzt:

| Bisheriges E2E-Thema                                          | Neue Hauptabdeckung                                                     | Verbleibender App-Nachweis                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Effekte der bisherigen Speisen, Grenzwerte, Zeitfortschritt   | `tests/unit/pet.test.ts`                                                | Pflege nach Reload, Schlaf/Wecken und Offline-Futterauswahl                 |
| Leere/getrimmte Namen, Umbenennen im Schlaf                   | Domain-/Service-Tests und echter Speicheradapter                        | Name bleibt offline sichtbar; Umbenennen und Pflege in zwei Tabs            |
| Unfertiger Namensentwurf, Validierungsanzeige, Speicherfehler | `components.test.ts`, `settings.test.ts`, `persistence.test.ts`         | Beschädigter Spielstand wird in der App erklärt und erhalten                |
| Menü schließen ohne Füttern, Fokus zurückgeben                | Browser-Komponententest mit nativem Dialog                              | Futterauswahl, 3D-Vorschau, Animation und kleine Bildschirme                |
| Tastaturbedienung der Einstellungen in vier Größen            | Browser-Komponententests mit realer CSS-Datei und Namenseditor-Slot     | Gesamt-App-Layout, lange Namen und Food-Menü in kleinen Ansichten           |
| Ungültige Präferenzen und nicht verfügbarer Speicher          | Echter localStorage-Adapter, Service-Fehlerpfade und gerenderter Dialog | Sprache/Farben nach Offline-Reload und echte Tab-Synchronisierung           |
| Parallele Pflege                                              | Browser-Test mit zwei echten Dexie-Verbindungen                         | Pflege plus Umbenennen in zwei echten App-Tabs, Schlafkonflikt beim Füttern |
| Zusätzlicher generischer Offline-Besuch                       | Zusammengeführt mit spezifischen Offline-Journeys                       | Snack, Name und Einstellungen mit Produktions-Service-Worker                |

## Freundschaft und Freischaltungen

`tests/unit/friendship.test.ts` prüft Schwellenwerte, Tageslimits, Wünsche bei vollen Bedürfnissen, UTC-Tageswechsel und eine zurückgestellte Uhr nach gespeicherter Belohnung. Dieselbe Suite prüft gesperrte Erdbeeren, den Punktedeckel, exakte alte Speicherobjekte und fehlerhafte neue Daten. Die Zeit ist eine Zahl als Funktionsargument.

`tests/browser/persistence.test.ts` prüft die Migration mit einem handgeschriebenen alten Objekt. Lesen verändert den alten Datensatz nicht, erfolgreiche Pflege speichert den umgerechneten Fortschritt. Zwei echte IndexedDB-Verbindungen erfüllen denselben Wunsch gleichzeitig und erhalten zusammen genau einen Bonus. Ungültige neue Felder werden nicht als alter Spielstand akzeptiert.

`tests/browser/friendship.test.ts` prüft die kompakte Übersicht, den nativen Dialog, Fokus nach Escape, neutrale Ladeanzeige, lokale Belohnungsanzeige und die gesperrte beziehungsweise verfügbare Erdbeere. Die vorhandenen Session-Tests prüfen weiterhin Speicherfehler und erhaltene Spielstände.

`tests/e2e/friendship.feature` prüft eine echte erste Freischaltung mit anschließendem Offline-Reload, die nutzbare Erdbeere mit 3D-Vorschau, Spielball und Blume, einen Tageswunsch in zwei App-Tabs und den Dialog auf einem kleinen Bildschirm. Höhere Freischaltungen beginnen mit gültigen gespeicherten Grenzwerten und überschreiten die Schwelle durch echte Pflege. Screenshots in `test-results/friendship-*.png` zeigen die gerenderten Belohnungen. Die automatischen Attribute allein sind kein Nachweis für deren visuelle Qualität.

`tests/support/pet-repository.ts` ist ausschließlich eine deterministische Testabhängigkeit. Komponenten-Harnesses verbinden echte Komponenten mit explizit übergebenen Services; sie kopieren keine Spielregeln. Datenbanken und Storage-Schlüssel der Adaptertests sind pro Test eindeutig und werden aufgeräumt.

Die Schlaf-Szenarien in `tests/e2e/pet.feature` prüfen die Nachtszene nach dem Einschlafen und Neuladen, die Rückkehr zur Tagszene und ruhende beziehungsweise animierte Z-Zeichen bei geänderter Bewegungseinstellung. `test-results/bedtime-*.png` zeigt die gerenderte Schlafpose mit Kissen, Mond und Sternen.

## Ausführen

```sh
pnpm exec playwright install chrome chromium firefox
pnpm test:unit
pnpm test:browser
pnpm verify
pnpm test:compat
```

`verify` führt Lint/Formatierung, Node-Tests, Browser-Tests, Typecheck/Produktionsbuild und Chromium-E2E aus. `test:compat` prüft den vorhandenen Build in Chromium und Firefox. Beide E2E-Kommandos erzeugen ausführbare Tests aus Gherkin neu. Für Pages müssen Build und Vorschau denselben Basis-Pfad verwenden:

```sh
VITE_BASE_PATH=/hamcrab/ pnpm verify
VITE_BASE_PATH=/hamcrab/ pnpm test:compat
```

CI führt alle Schichten aus, bevor der Build veröffentlicht werden darf. Browser-Fehlerbilder und Traces werden als Artefakte gesichert. Die bestehenden Layout-/Rendering-Prüfungen sind funktionale beziehungsweise gezielte visuelle Nachweise, keine vollständigen Screenshot-Baselines.

Konfigurationsreferenzen: [Vitest Browser Mode](https://vitest.dev/guide/browser/), [Oxlint JS Plugins](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html).

## Persönlichkeit und direkte Berührung

`tests/unit/animation.test.ts` prüft den rein numerischen Animationscontroller: einmalige Begrüßung nach geladenem Spielstand, verzögerte Rückkehr nach mindestens 30 Sekunden Abwesenheit und abgeschlossener Aktualisierung, unterbrechbare Pflege mit anschließender Belohnung, Schlaf, deterministische Varianten und ruhige Pausen. Bewegungsreduktion beendet laufende Bewegungen ohne spätere Wiederholung; statisches Snack-Feedback läuft weiter bis zum ursprünglichen Ablauf. Gestenregeln prüfen Körperkontakt beim Beginn und Ende, maximale Bewegung einschließlich Hin-und-zurück-Ziehen, Abbruch und mehrere Zeiger. Keine Uhr oder Browser-API wird dafür ersetzt.

`tests/e2e/animation.feature` prüft die Verdrahtung mit echter Speicherung und WebGL: direkte Berührung speichert genau eine Pflege, Ziehen speichert keine, Futter geht dem Tanz voraus, Wecken streckt das Tier und der Ball kehrt nach dem Spielen zurück. Die Playwright-Uhr ermöglicht reproduzierbare Phasen; Canvas-Bilder werden verglichen und als `test-results/personality-*.png` gespeichert. Ruhendes Snack-Feedback muss identische Pixel behalten. Begrüßung, Kuscheln, Fressen, Tanz, Aufwachen und Beschäftigung werden zusätzlich visuell geprüft; Attribute allein reichen dafür nicht aus. Die vorhandene Rotationsprüfung erhält den Nachweis der Tastaturbedienung.

Die Rückkehr-Journey speichert Schlaf über einen zweiten echten App-Tab und hält die echte IndexedDB-Lesetransaktion kurz hinter einer Schreibtransaktion zurück. Sie prüft, dass während der Aktualisierung keine Begrüßung mit veraltetem Wachzustand startet. Nur die Sichtbarkeitseigenschaften und das Ereignis werden im Test kontrolliert, weil Headless-Tabs keinen nativen Sichtbarkeitswechsel liefern; Pflege, Speicherung, Vue-Aktualisierung und Rendering bleiben echt.

## PWA-Installation und Updates

`tests/unit/pwa-service.test.ts` prüft Installationsaufschub über sieben Tage, Update-Aufschub über eine Stunde, explizite Aktivierung und wiederholbare Fehlerpfade mit injizierter Uhr und Browser-Port. `tests/browser/pwa.test.ts` prüft Plattformanleitungen, den nativen Hilfedialog und Fokus, Installationsannahme sowie übersetzte Status- und Fehlertexte. Der Installations-Port ist dort deterministisch; dies beweist keinen echten Betriebssystem-Installationsdialog.

`tests/e2e/pwa.feature` prüft die Einstellungen nach einem Reload und einen echten wartenden Produktions-Service-Worker. Der lokale Preview-Test ergänzt vorübergehend den gebauten Worker um eine Versionsmarkierung, prüft Aufschub ohne Controllerwechsel und die explizite Aktivierung mit Reload. Der Original-Worker wird im `finally` wiederhergestellt. Pflegefortschritt bleibt nach Update und Offline-Reload erhalten. Dieser Test benötigt den lokalen Preview-Server; er verändert keine veröffentlichte Website. Die bestehende Manifest-Prüfung deckt weiterhin den konfigurierbaren Basispfad ab.

## Lebensphasen

`tests/unit/lifecycle.test.ts` prüft Ei-Schutz, einmaliges Schlüpfen, sinnvolle Pflege an zehn verschiedenen UTC-Tagen, Pausen, gleiche Tage, zurückgestellte Uhren und Wachstum bei maximaler Freundschaft. Bestehende reine Pflege-Tests verwenden ausdrücklich erwachsene Tiere.

`tests/browser/persistence.test.ts` prüft beide alten Speicherformen als Erwachsene ohne Schreibzugriff beim Lesen. Ungültige Lebensphasen bleiben erhalten. Zwei echte IndexedDB-Verbindungen schlüpfen genau einmal und vergeben am selben Tag zusammen genau einen Pflegetag. `lifecycle.test.ts` prüft Tastatur, gesperrten Schlüpfknopf sowie deutsche und englische Fortschrittsanzeigen. Session-Tests erhalten das Ei nach fehlgeschlagenem Speichern und erlauben einen erneuten Versuch.

`tests/e2e/lifecycle.feature` prüft Ei, Schlüpfen und Baby nach Offline-Reload, den zehnten Pflegetag mit anschließendem Reload sowie Schlüpfen in zwei App-Tabs. Ein weiterer Test verliert den echten WebGL-Kontext über `WEBGL_lose_context` und schlüpft danach über dieselbe Oberfläche. Der zehnte Tag beginnt mit neun gültigen früheren Pflegetagen im echten Speicher. Die letzte Pflege erfolgt durch die Oberfläche. Die Szenarien speichern Bilder von Ei, Baby und Erwachsenem unter `.audit/lifecycle/`. Die vorhandenen Layoutprüfungen laufen mit einem frisch geschlüpften Baby.

## Erwachsene Formen

Die Entwicklung speichert höchstens neun Baby-Tage mit nötigen Mahlzeiten, Spiel und Kuscheln. Der zehnte Tag entscheidet einschließlich seiner ersten sinnvollen Pflege. Pro Kategorie und Tag zählt höchstens ein Erlebnis; beim Futter zählt nur ein Wechsel gegenüber der zuletzt gewerteten Mahlzeit. Der höchste Wert bestimmt Genießer, Wirbelwind oder Kuschelfreund. Ein Gleichstand erlaubt eine einmalige Auswahl der gleichauf liegenden Formen. Alle Formen haben dieselben Pflegewerte und Freischaltungen. Alte Babys behalten ihre Tage ohne erfundene Vorlieben; alte Erwachsene dürfen frei wählen.

Node-Tests prüfen Tagesgrenzen, Futterrotation, den zehnten Tag, Gleichstand und unveränderliche Auswahl sowie die Bewegungen und Ruhebedingungen. Browser-Tests prüfen strikte Migration, echte konkurrierende IndexedDB-Auswahl, Speicherung aller Formen und zugängliche Auswahl in beiden Sprachen. Ein injizierter fehlgeschlagener Speicherzugriff prüft, dass die Oberfläche die ausstehende Auswahl behält.

`tests/e2e/variants.feature` wählt jede Form über die Oberfläche eines alten erwachsenen Spielstands, führt die jeweilige Pflege aus und lädt die gespeicherte Form offline neu. Zwei echte Tabs prüfen eine veraltete konkurrierende Auswahl. Die Playwright-Uhr hält Bewegungsphasen für Canvas-Bilder unter `.audit/variants/` fest; deren Unterschiede beweisen Bewegung, die zusätzliche Sichtprüfung beurteilt Wangen, Jonglierbogen und Anschmiegen. Der Wirbelwind nutzt seinen eigenen sichtbaren Ball, ohne die Freundschaftsfreischaltung zu verändern. Kurze, schmale und hohe Ansichten behalten erreichbare Pflegeknöpfe und mindestens 90 Pixel für die Szene.
