# Hamcrab

Ein kleiner Hamster im Hummerkostüm als lokale Vue-PWA im Stil eines 90er-Taschenhaustiers. Das Gehäuse füllt die gesamte App-Fläche ohne Außenrand. Das Display nutzt den verbleibenden Platz; die Knöpfe liegen im Hochformat unten und im flachen Querformat rechts. Das Kunststoffgehäuse, der LCD-Rahmen und die Knöpfe sind CSS. Die Figur im Bildschirm bleibt echtes, drehbares 3D. Die originale Three.js-Figur ist aus editierbarer Geometrie aufgebaut und lässt sich mit Maus, Touch oder Pfeiltasten drehen.

## Starten

Voraussetzung ist Node.js 22.13+ oder 24+ und pnpm 10.

```sh
pnpm install
pnpm dev
```

Die Entwicklungsadresse erscheint im Terminal. Für die Offline-Funktion starte den Produktionsbuild.

```sh
pnpm build
pnpm preview
```

## Spielen

Füttern erhöht die Sättigung. Spielen verbessert die Freude und verbraucht Energie. Streicheln verbessert die Freude. Schlafen stellt Energie wieder her, während aktive Pflege pausiert. Wecken beendet den Schlaf. Fünf Pflegeaktionen erhöhen das Freundschaftslevel.

Beim Füttern öffnet sich eine Auswahl mit drehbaren Three.js-Modellen. Franzbrötchen gibt 20 Sättigung, Döner gibt 30 Sättigung und 5 Freude, Augustiner-Bier gibt 5 Sättigung und 10 Freude und verbraucht 5 Energie. Erst „Pinchy geben“ speichert die Pflegeaktion und lässt Pinchy das gewählte Modell halten. Abbrechen verändert den Spielstand nicht. Auswahl und Modelle funktionieren offline und auf Deutsch oder Englisch.

Die Bedürfnisse verändern sich mit vergangener Zeit. Pro Berechnung zählen höchstens 24 Stunden. Pinchy stirbt nicht bei längerer Abwesenheit. IndexedDB speichert den Spielstand auf diesem Browserprofil. Das Löschen der Browserdaten löscht auch den Spielstand.

Das Zahnrad im Display öffnet die Einstellungen. Englisch ist die Standardsprache; Deutsch lässt sich jederzeit auswählen. Gehäuse und Krabbenkostüm haben jeweils vier unabhängige Farbvarianten. Die Auswahl wird sofort angewendet und lokal gespeichert, auch offline. Gespeicherte Pflegewerte bleiben beim Ändern der Einstellungen erhalten.

Nach einem vollständigen ersten Laden speichert der Service Worker die Anwendung für Offline-Besuche. Die Installation hängt vom Browser ab. Die Installation erfolgt über das Browsermenü. Es gibt keinen Server und keine externen Laufzeitressourcen.

## Prüfen

Die Teststrategie besteht ausschließlich aus Playwright-E2E-Tests mit ausführbaren Gherkin-Szenarien.

```sh
pnpm exec playwright install chromium firefox
pnpm verify
pnpm test:compat
```

`verify` führt Oxlint, strikte TypeScript-Prüfung, Produktionsbuild und Chromium-Szenarien aus. `test:compat` prüft den vorhandenen Produktionsbuild in Chromium und Firefox. Die Szenarien prüfen Pflege, Schlaf, Zeit, Persistenz, Offline-Neuladen, gleichzeitige Tabs, kleine Bildschirme, beschädigte Daten und die 3D-Ansicht.

Für Hosting unter einem Unterpfad setze `VITE_BASE_PATH` beim Build und beim Prüfen identisch. GitHub Actions prüft jeden Push auf `main` und veröffentlicht den erfolgreichen Build auf GitHub Pages. Pull Requests werden nur geprüft.

[Architektur](docs/architecture.md) beschreibt die Feature-Grenzen und den Designvergleich.

## GitHub Pages

Die Anwendung ist für [alexanderop.github.io/hamcrab](https://alexanderop.github.io/hamcrab/) konfiguriert. Der Workflow baut und testet mit `VITE_BASE_PATH=/hamcrab/`. Beide Playwright-Browser müssen bestehen, bevor das Deployment startet.

Das Manifest verwendet denselben Pfad für Startadresse, Identität und Service-Worker-Bereich. Nach dem ersten vollständigen Besuch lässt sich das Spiel aus dem Browsermenü installieren und offline öffnen. Auf iOS verwende in Safari das Teilen-Menü und „Zum Home-Bildschirm“.

Spielstände bleiben im jeweiligen Browserprofil. Die lokale Entwicklung und die veröffentlichte Seite besitzen getrennte Spielstände.
