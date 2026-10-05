# Pinchys Alltag

Hamcrab ergänzt die bisherige Pflege um Gesundheit, ein Muschelspiel, persönliche Vorlieben, weitere Lebensphasen, auswählbare Gegenstände und eine freiwillige Familiengeschichte. Alle Inhalte funktionieren lokal und offline. Es gibt keinen Tod durch Abwesenheit.

## Pflege und Gesundheit

Pinchy kündigt den Toilettengang eine halbe Stunde vor dem nächsten Termin an. Rechtzeitige Hilfe verhindert einen Haufen. Verpasste Termine hinterlassen höchstens drei Haufen. Ein voller, schmutziger Lebensraum macht Pinchy krank. Aufräumen entfernt den Schmutz; Medizin macht Pinchy wieder gesund. Medizin stabilisiert auch das Zuhause, damit die Krankheit nicht sofort zurückkehrt. Beides bleibt im Schlaf möglich.

Die kompakte Alltagsanzeige zeigt den wichtigsten aktuellen Bedarf. Im Dialog „Your Hamcrab“ beziehungsweise „Dein Hamcrab“ liegen Pflege, persönliche Gegenstände, Familie und Tagesrhythmus. Die drei großen Knöpfe bleiben Füttern, Spielen und Schlafen beziehungsweise Wecken.

## Ein echtes Muschelspiel

„Play“ öffnet fünf Gedächtnisrunden. Man merkt sich eine Muschel, verdeckt den Hinweis mit „Ready“ und wählt eine der drei Muscheln. Das Spiel benötigt weder eine schnelle Reaktion noch Bewegung. Tastatur und Berührung bedienen dieselben Knöpfe.

Jede Runde liegt im Spielstand. Nach einem Reload kann dieselbe Partie weitergehen. Ein Abbruch vergibt keine Belohnung. Die letzte Runde vergibt genau einmal Spielpflege, verbraucht zehn Energie und erhöht die Zufriedenheit zusätzlich um die Zahl der Treffer. Das letzte Ergebnis bleibt gespeichert. Zwei Tabs können dieselbe Runde nicht doppelt werten.

## Persönliche Vorlieben und Gegenstände

Jeder Hamcrab hat eine feste Persönlichkeit, ein Lieblingsessen und ein Lieblingsspielzeug. Lieblingsessen gibt einen kleinen zusätzlichen Zufriedenheitsbonus. Das Lieblingsspielzeug wirkt beim Spielen; ein sanfter Hamcrab freut sich besonders über Streicheln. Alle normalen Pflegemöglichkeiten bleiben verfügbar.

Mütze, Muschel und Kiesel sind frei auswählbar. Schleife, Ball und Blume stammen weiterhin aus den Freundschaftsbelohnungen. Eine eigene Auswahl bleibt erhalten, wenn eine neue Belohnung hinzukommt. Ohne eigene Auswahl erscheinen neue Belohnungen wie bisher automatisch. Farbe und ausgewähltes Kleidungsstück sind unabhängig.

## Wachsen und Familie

Wachstum zählt sinnvolle Pflege an verschiedenen UTC-Tagen. Pausen nehmen keine Tage weg.

| Pflegetage | Lebensphase  |
| ---------- | ------------ |
| 0–2        | Baby         |
| 3–5        | Kind         |
| 6–9        | Jugendlicher |
| 10         | Erwachsener  |

Die bisherigen drei erwachsenen Formen bleiben erhalten. Essen, Spielen und Streicheln prägen die Form über alle Wachstumsphasen hinweg. Kind und Jugendlicher haben eigene Körperproportionen.

Ein erwachsener Hamcrab mit gewählter Form kann Coral an drei verschiedenen UTC-Tagen besuchen. Danach ist eine neue Generation möglich. Die Oberfläche erklärt vorher, dass der Erwachsene einen Eintrag im Familienalbum bekommt und ein neues Ei beginnt. Erwachsene dürfen unbegrenzt bleiben.

Der Wechsel behält das ganze Album, Freundschaftspunkte, freigeschaltete und ausgewählte Gegenstände sowie den Tagesrhythmus. Name, Bedürfnisse, Pflegestatistik, tägliche Wünsche, Besuche, Krankheit und laufendes Spiel beginnen für das neue Ei neu. Alte Spielkennungen werden nicht wiederverwendet. Der gespeicherte Generationsvergleich verhindert doppelte Wechsel aus mehreren Tabs.

## Tagesrhythmus

Der automatische Rhythmus ist zunächst ausgeschaltet. Einschlafstunde, Aufwachstunde und ein fester UTC-Versatz lassen sich einstellen. „Use device offset“ übernimmt den aktuellen Versatz des Geräts. Der feste Versatz stellt sich bei einer Reise oder Sommerzeitänderung nicht von selbst um.

Bei eingeschaltetem Rhythmus schläft Pinchy nachts und kann bei Erschöpfung einmal am Tag eine einstündige Pause machen. Die Pause endet automatisch. Manuelles Wecken verhindert erneutes automatisches Einschlafen bis zur nächsten Schlafenszeit. Bei ausgeschaltetem Rhythmus bleibt Schlaf vollständig manuell. Eine morgendliche Begrüßung und aktuelle Bedürfnisse erscheinen ohne zusätzliche Benachrichtigungen.

## Bestehende Spielstände

Datenbank, Schlüssel und Version bleiben unverändert. Alte Spielstände erhalten beim Lesen die fehlenden Alltagsdaten. Das Lesen schreibt keine Migration zurück. Erst eine erfolgreiche Aktion speichert die neue Form. Vorhandene Pflegetage bestimmen die passende neue Lebensphase; Erwachsene werden nicht zurückgestuft. Fehlerhafte neue Daten werden nicht durch Standardwerte ersetzt.

Die Spielregeln erhalten Zeit als Argument. Dexie liest, entscheidet und schreibt weiterhin innerhalb einer Transaktion. Die 3D-Szene zeigt nur den übergebenen Zustand und verändert keine Spielregeln.
