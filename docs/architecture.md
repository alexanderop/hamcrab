# Architektur

Hamcrab ist eine eigenständige Vue-PWA. Pinchy ist der Name des Haustiers.

## Zuständigkeiten

`features/pet` besitzt den Spielstand, Pflegeaktionen, Zeitregeln und lokale Speicherung. Reine Übergänge erhalten den Zustand und die Uhrzeit als Eingaben. Die Vue-Anbindung führt IndexedDB-Transaktionen aus und zeigt Lade- oder Speicherfehler an.

`features/habitat` besitzt das prozedurale Three.js-Modell, die Kamera, Animationen und GPU-Ressourcen. Es erhält ausschließlich Darstellungsdaten. Es verändert keine Spielwerte.

Die Nahrungsmitteltabelle in `features/pet/foods.ts` definiert die Effekte. Pflegeaktionen sind eine Union, in der Füttern immer eine konkrete Auswahl enthält. Das Futtermenü zeigt eine von `App.vue` eingesetzte 3D-Vorschau. `features/habitat/snacks.ts` erzeugt die drei Geometrien und das Flaschenetikett lokal. Die Vorschau rendert bei Änderungen; beim Schließen gibt sie Geometrien, Materialien, Texturen und ihren WebGL-Kontext frei. Die Fütterungsanimation nutzt dieselben Modelle im Lebensraum. Das Schema bestehender Spielstände bleibt unverändert.

`features/settings` besitzt Sprache, Farbpaletten, Übersetzungen und den Einstellungsdialog. Die kleinen Präferenzen liegen getrennt vom Spielstand im lokalen Browserspeicher und werden mit Zod validiert. Neue Besuche starten auf Englisch. Nicht lesbare Präferenzen verwenden Standardwerte, ohne den Spielstand zu verändern. Speicherfehler werden als vorübergehende Auswahl angezeigt. Andere Tabs übernehmen Änderungen über das Storage-Ereignis.

Pflegeergebnisse liefern sprachunabhängige Meldungsschlüssel. `App.vue` übersetzt diese und reicht die ausgewählte Palette und Beschreibung an die 3D-Ansicht weiter. Die Ansicht ändert vorhandene Materialien, ohne Geometrie oder Kamera neu anzulegen.

Der Name gehört zum Haustier. `PetNameForm` wird über einen Slot in die Einstellungen eingesetzt; Validierung und Speicherung bleiben in `features/pet`. Die separate Umbenennung liest den neuesten Spielstand innerhalb einer Dexie-Transaktion und ändert ausschließlich den Namen. Dadurch bleiben parallele Pflegeaktionen erhalten. Bestehende Spielstände mit dem Standardnamen sind weiterhin gültig. Die Übersetzungsfunktionen erhalten den aktuellen Namen von `App.vue`.

Vite PWA erzeugt den Service Worker und speichert die gebaute Anwendung offline. Die Installation erfolgt über das Browsermenü.

`App.vue` verbindet die Features und die sichtbare Oberfläche. Alle Laufzeitressourcen sind lokal gebündelt.

## Designentscheidung

Zwei unabhängige Entwürfe verglichen einen gespeicherten Zustand mit einer Historie aller Aktionen. Der Zustand benötigt weniger Verwaltung und macht Lade- und Zeitregeln direkt sichtbar. Die Historie würde Wiederholung und Mehrbenutzer-Synchronisation erleichtern, wächst aber ohne Begrenzung.

Der gewählte Zustand übernimmt die Transaktionsanforderung des zweiten Entwurfs. Jede Pflege liest und verändert den aktuellen Stand atomar. Die Sitzung aktualisiert andere Tabs aus IndexedDB.

Die Figur entsteht aus editierbarer Geometrie. Sie ist eine stilisierte Interpretation der Referenz, kein identisches importiertes Modell.

## Prüfung

Ausschließlich Playwright mit ausführbaren Gherkin-Szenarien prüft das Verhalten. Es gibt keine Unit- oder Komponententest-Suite. Tests öffnen den Produktionsbuild, bedienen sichtbare Elemente und prüfen Pflege, Schlaf, Zeit, Speicherung und Offline-Neuladen. Weitere Szenarien prüfen Sprache, tatsächliche Farbänderungen im 3D-Bild, gespeicherte Einstellungen, Tastaturbedienung, mehrere Tabs und nicht verfügbaren Speicher. Bildschirmaufnahmen dienen zusätzlich der visuellen Prüfung.
