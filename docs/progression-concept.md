# Freundschaft und Entwicklung

Hamcrab soll bei kurzen Besuchen Freude machen. Pinchy reagiert auf Pflege, bekommt neue Spielsachen und entwickelt mit der Zeit eine eigene Geschichte. Ein verpasster Tag nimmt keine Belohnung weg.

## Zwei Formen von Fortschritt

Freundschaft misst gemeinsame Erlebnisse. Freundschaftspunkte schalten Futter, Accessoires und Gegenstände frei. Sie bleiben nach einer Pause erhalten.

Entwicklung beschreibt Pinchys Lebensphase. Neue Spielstände beginnen als Ei, schlüpfen auf Knopfdruck und wachsen nach zehn Pflegetagen vom Baby zum Erwachsenen. Freundschaftspunkte und Pflegetage sind unabhängig. Kind ab drei und Jugendlicher ab sechs Pflegetagen ergänzen das Wachstum. Drei erwachsene Formen entstehen aus den gemeinsamen Erlebnissen.

Die Bildreferenz zeigt die Idee einer Entwicklung durch Lebensraum und Nahrung. Hamcrab verwendet dafür eigene Figuren und Animationen. Pinchy bleibt als Hamster im Krabbenkostüm erkennbar.

## Erste Ausbaustufe

Die erste Ausbaustufe umfasst fünf Freundschaftslevel mit vier neuen Belohnungen. Alle bisher verfügbaren Lebensmittel und Farben bleiben verfügbar.

| Level | Inhalt            | Sichtbares Ergebnis                                  |
| ----- | ----------------- | ---------------------------------------------------- |
| 1     | Bestehende Pflege | Füttern, Spielen, Streicheln und Schlafen            |
| 2     | Schleife          | Pinchy trägt eine neue Schleife                      |
| 3     | Erdbeere          | Neues Futter mit eigenem Modell und eigener Reaktion |
| 4     | Ball              | Beim Spielen bewegt sich ein Ball mit Pinchy         |
| 5     | Blume             | Eine neue Dekoration steht in seinem Zuhause         |

Die nächste Belohnung ist vor dem Freischalten sichtbar. Eine kompakte Vorschau zeigt die fehlenden Freundschaftspunkte. Eine Detailansicht erklärt die Belohnungen und den Tageswunsch.

Ein Tageswunsch bittet um eine kurze Aktivität. Die passende Pflege erfüllt ihn automatisch und vergibt einmalig Punkte. Wünsche erfordern keine gesperrten Gegenstände. Ein neuer Tag ersetzt einen unerfüllten Wunsch ohne Strafe.

Sinnvolle Pflege gibt Punkte. Wiederholungen haben eine Grenze. Füttern bei vollem Bauch sowie wiederholtes Schlafen und Wecken beschleunigen den Fortschritt nicht. Streicheln bleibt auch ohne weitere Punkte möglich.

## Entwicklung vom Ei zum erwachsenen Hamcrab

Ei, Baby, Kind, Jugendlicher und Erwachsener sind implementiert. Die aktuellen Schwellen und Alltagsregeln stehen in [Pinchys Alltag](companion-life.md).

| Stufe     | Auslöser                               | Sichtbares Ergebnis                                                                            |
| --------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Ei        | Neuer Spielstand                       | Gesprenkeltes Ei mit Riss und kleinen Scheren. **Beim Schlüpfen helfen** öffnet es.            |
| Baby      | Einmaliges Schlüpfen                   | Kleinere Figur mit größerem Kopf und kleinen Scheren. Die Anzeige zählt gemeinsame Pflegetage. |
| Erwachsen | Zehn verschiedene sinnvolle Pflegetage | Die bisherige erwachsene Figur. Freundschaft und Freischaltungen gehen weiter.                 |

Ein Pflegetag zählt durch Streicheln, Füttern unter 85 Sättigung oder Spielen unter 90 Zufriedenheit. Die Prüfung verwendet die Bedürfnisse unmittelbar vor der Pflege. Abgelehnte Aktionen, Schlafen und Wecken zählen nicht. Ein Tag zählt höchstens einmal. Der Wechsel erfolgt um 00:00 UTC, auch bei anderer lokaler Zeitzone.

Die Tage müssen nicht aufeinanderfolgen. Abwesenheit erzeugt keine Pflegetage und nimmt keinen Fortschritt weg. Eier verlieren keine Bedürfnisse. Schlüpfen vergibt weder Freundschaftspunkte noch Pflegetage oder Pflegegesten. Wiederholtes Schlüpfen, auch in zwei Tabs, verändert ein bereits geschlüpftes Tier nicht.

Das wachsende Tier speichert höchstens neun sortierte, verschiedene UTC-Tage. Beim zehnten Tag wird es erwachsen. Eine zurückgestellte Uhr dupliziert keinen Pflegetag. Der Freundschaftsdeckel von 100 Punkten stoppt das Wachstum nicht.

Schlüpfen und Erwachsenwerden zeigen eine kurze Größenanimation und eine Textmeldung. Reduzierte Bewegung zeigt die neue Form sofort. Ohne WebGL bleiben Lebensphase, Pflegetage und Schlüpfen zugänglich.

Bestehende Spielstände ohne Lebensphase werden beim Lesen als erwachsen verstanden. Bedürfnisse, Name und Freundschaft bleiben erhalten. Lesen schreibt alte Datensätze nicht um. Fehlerhafte vorhandene Lebensphasen lösen einen Speicherfehler aus und bleiben unverändert. Datenbankname, Schlüssel und Schemaversion bleiben gleich.

## Erlebnisse prägen die spätere Form

Die drei gleichwertigen erwachsenen Formen sind Genießer, Wirbelwind und Kuschelfreund. Die frühere Entdecker-Idee wurde durch Kuscheln als dritte alltägliche Erfahrung ersetzt.

| Richtung      | Prägende Erlebnisse                   | Eigene Hamcrab-Merkmale                   |
| ------------- | ------------------------------------- | ----------------------------------------- |
| Genießer      | Unterschiedliche Speisen ausprobieren | Runde Wangen, zufriedene Essensanimation  |
| Spieler       | Gemeinsam mit Spielzeug spielen       | Sportliche Pose, lebhafte Scherenbewegung |
| Kuschelfreund | Regelmäßiges Streicheln               | Sanftes Anschmiegen                       |

Nur begrenzt gewertete Erlebnisse beeinflussen die Richtung. Eine letzte Mahlzeit überschreibt keine mehrtägige Geschichte. Bei Gleichstand wählen Spielende zwischen den passenden Formen. Vor der erwachsenen Entwicklung zeigt das Spiel Hinweise wie "Pinchy spielt besonders gern".

Jede Form ist vollständig und erwünscht. Vernachlässigung erzeugt keine schlechte oder hässliche Form. Freigeschaltete Accessoires funktionieren mit allen Formen. Ein Wechsel der Kostümfarbe verändert nicht die Entwicklung.

## Gründe für spätere Besuche

Ein Besuch beginnt mit Pinchys Reaktion und dem Tageswunsch. Danach folgt eine kurze Pflegeaktivität. Die Belohnung oder die Vorschau macht den Fortschritt sichtbar.

Nach der ersten Ausbaustufe ergänzen Ausflüge diesen Ablauf. Ein Strandausflug liefert beim nächsten Besuch eine Muschel mit einer kurzen Geschichte. Das Ergebnis wartet ohne Ablaufdatum. Ein Album zeigt entdeckte Muscheln und garantiert nach mehreren Duplikaten einen neuen Fund.

Ausflüge und ein Muschelalbum bleiben spätere Ideen. Kind, Jugendlicher, erwachsene Formen sowie ein Familienalbum sind inzwischen implementiert. Pflege, Minispiel, Vorlieben, auswählbare Gegenstände und Tagesrhythmus beschreibt [Pinchys Alltag](companion-life.md). Es gibt keine verlorenen Serien, keinen Tod durch Abwesenheit und keine kostenpflichtigen Beschleuniger in diesem Konzept.

## Spieltests vor weiteren Inhalten

Die erste Belohnung soll in einem kurzen ersten Besuch erreichbar sein. Weitere Belohnungen sollen mehrere Besuche interessant machen. Nach den ersten Spieltests passen wir Punkteschwellen und Häufigkeiten an.

Wir beobachten, ob Spielende die nächste Belohnung verstehen, neue Gegenstände tatsächlich benutzen und aus Neugier zurückkommen. Wenn hauptsächlich dieselbe Aktion wiederholt wird, ändern wir die Belohnungsregeln statt zusätzliche Level hinzuzufügen.
