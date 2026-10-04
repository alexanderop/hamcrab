# Architektur

Hamcrab ist eine eigenständige Vue-PWA. Pinchy ist der Name des Haustiers.

## Zuständigkeiten

`features/pet` besitzt den Spielstand, Pflegeaktionen, Zeitregeln und lokale Speicherung. Reine Übergänge erhalten den Zustand und die Uhrzeit als Eingaben. Die Vue-Anbindung führt IndexedDB-Transaktionen aus und zeigt Lade- oder Speicherfehler an.

`features/habitat` besitzt das prozedurale Three.js-Modell, die Kamera, Animationen und GPU-Ressourcen. Es erhält ausschließlich Darstellungsdaten. Es verändert keine Spielwerte.

Vite PWA erzeugt den Service Worker und speichert die gebaute Anwendung offline. Die Installation erfolgt über das Browsermenü.

`App.vue` verbindet die Features und die sichtbare Oberfläche. Alle Laufzeitressourcen sind lokal gebündelt.

## Designentscheidung

Zwei unabhängige Entwürfe verglichen einen gespeicherten Zustand mit einer Historie aller Aktionen. Der Zustand benötigt weniger Verwaltung und macht Lade- und Zeitregeln direkt sichtbar. Die Historie würde Wiederholung und Mehrbenutzer-Synchronisation erleichtern, wächst aber ohne Begrenzung.

Der gewählte Zustand übernimmt die Transaktionsanforderung des zweiten Entwurfs. Jede Pflege liest und verändert den aktuellen Stand atomar. Die Sitzung aktualisiert andere Tabs aus IndexedDB.

Die Figur entsteht aus editierbarer Geometrie. Sie ist eine stilisierte Interpretation der Referenz, kein identisches importiertes Modell.

## Prüfung

Ausschließlich Playwright mit ausführbaren Gherkin-Szenarien prüft das Verhalten. Es gibt keine Unit- oder Komponententest-Suite. Tests öffnen den Produktionsbuild, bedienen sichtbare Elemente und prüfen Pflege, Schlaf, Zeit, Speicherung und Offline-Neuladen. Bildschirmaufnahmen dienen zusätzlich der visuellen Prüfung.
