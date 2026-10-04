# Architektur

Hamcrab ist eine lokale Vue-PWA mit Feature Based Architecture und Ports und Adapters. Pinchy ist der Standardname des Haustiers.

## Struktur und Abhängigkeiten

```text
src/
  app/
    bootstrap.ts        Konkrete Adapter erzeugen und verbinden
    services.ts         Typisierte Übergabe an die Vue-App
    App.vue             Features und sichtbare Oberfläche komponieren
  features/
    pet/
      index.ts          Öffentliche API
      domain/           Pflege, Zeit, Namen, Futter
      application/      Anwendungsfälle, PetRepository und Clock
      adapters/         Dexie und Validierung gespeicherter Daten
      ui/               Sitzung, Futtermenü und Namensformular
    settings/
      index.ts
      domain/           Präferenzen und Standardwerte
      application/      SettingsService und PreferencesStore
      adapters/         localStorage, Zod und Storage-Ereignisse
      ui/               Vue-Anbindung, Dialog, Texte und Paletten
    habitat/
      index.ts
      scene-types.ts    Einfache Darstellungsdaten ohne Three.js-Typen
      three/            Geometrie, Materialien und Ressourcenfreigabe
      ui/               Szene und Vorschau mit Vue-Lifecycle
```

Domain kennt nur eigene fachliche Daten und Funktionen. Application kennt Domain und ihre eigenen Ports. Adapter implementieren diese Ports. Die UI erhält Anwendungsfälle als Parameter; sie erzeugt keine Speicheradapter. Nur `app/bootstrap.ts` verbindet konkrete Infrastruktur mit den Anwendungsfällen. `main.ts` stellt die Dienste der Vue-App bereit und schließt die Datenbank beim Unmount beziehungsweise HMR-Abbau.

Andere Features und die App greifen über `index.ts` zu. Die gezielte Ausnahme ist der Import konkreter Adapter in `app/bootstrap.ts`. Die Oxlint-Regel in `tooling/architecture.mjs` prüft auch Re-Exports, dynamische Imports, Require, Import-Typen und Vue-Skripte. Kernschichten dürfen keine externen Pakete oder globalen Browser-/Zeitquellen verwenden. Tests prüfen erlaubte und verbotene Verbindungen sowie die echte Linter-Ausführung.

## Haustier und atomare Speicherung

`createPet`, `advancePet`, `careForPet` und `parsePetName` sind reine Funktionen. Zustand und Uhrzeit sind Eingaben. Abgelehnte Pflege liefert ein fachliches Ergebnis mit Meldungsschlüssel, ohne einen Fehler zu werfen. Spielstände sind readonly. Die Zod-Validierung gespeicherter Daten liegt im Adapter; fachliche Namensregeln bleiben in der Domain.

`createPetService(repository, clock)` bietet Laden, Pflege und Umbenennen an. Die Uhr ist explizit injiziert. Die Vue-Sitzung verwaltet Lade-/Speicheranzeige, Fehler, Wiederholung und Aktualisierung bei Sichtbarkeit. Sie kennt weder Dexie noch die konkrete Speicherstruktur.

Der Port `PetRepository.transact` erhält eine synchrone Änderungsfunktion und liefert deren Ergebnis zurück. Der Adapter liest den neuesten Stand, validiert ihn, führt die Entscheidung aus und speichert eine optionale Änderung innerhalb einer einzigen Dexie-Transaktion. So überschreiben parallele Pflege und Umbenennung keine fremden Änderungen. Eine getrennte Folge von `load` und `save` erfüllt diesen Vertrag nicht.

Laden rechnet vergangene Zeit für die Ansicht an, speichert einen vorhandenen Stand aber nicht erneut. Abgelehnte Pflege schreibt keinen vorhandenen Stand um. Umbenennen verändert im gespeicherten Stand ausschließlich den Namen. Beschädigte Daten werden weder ersetzt noch repariert. Speicherfehler werden weitergereicht; `InvalidPetDataError` gehört zum Anwendungsvertrag und ist keine Dexie-spezifische Klasse.

Die Datenbank heißt weiterhin `pinchy`, mit Version 1, Tabelle `pets` und Schlüssel `pinchy`. Bestehende Spielstände benötigen keine Migration.

## Einstellungen und Darstellung

`PreferencesStore` kapselt Lesen, Schreiben und Abonnieren fremder Änderungen. Der localStorage-Adapter validiert Daten mit Zod. Ungültige Präferenzen ergeben Standardwerte, ohne den Haustierstand anzufassen. Kann nicht gespeichert werden, bleibt die Auswahl vorübergehend sichtbar und die UI zeigt einen Hinweis.

Jede Änderung wird mit den zuletzt gespeicherten Präferenzen zusammengeführt. Storage-Ereignisse aktualisieren andere Tabs. localStorage bietet keine atomare Transaktion über Lesen und Schreiben; exakt gleichzeitige Änderungen können weiterhin konkurrieren. Die strenge Transaktionsgarantie des Haustiers gilt hier nicht.

`habitat` ist ein Darstellungsfeature und braucht keine künstliche Domain-/Repository-Schicht. Es erhält Schlafstatus, Reaktionen, Snack-Art und Palette als einfache Werte. Three.js-Typen, Geometrien, Animationen und GPU-Lifecycle bleiben intern. Es verändert keine Spielwerte.

`App.vue` übersetzt Meldungsschlüssel, ordnet Futter den Snack-Modellen zu und verbindet Komponenten über Props, Events und Slots. Der Namenseditor bleibt Eigentum von `pet`, auch wenn er im Einstellungsdialog erscheint. Vite PWA bündelt weiterhin lokale Ressourcen für Offline-Nutzung unter dem konfigurierten Basis-Pfad.

## Prüfung

Die Testaufteilung und die aus E2E verschobenen Verantwortlichkeiten stehen in [Teststrategie](testing.md). Der Umbau wurde zunächst gegen alle 46 bestehenden E2E-Szenarien geprüft, bevor überlappende Szenarien in kleinere Testschichten verschoben wurden.
