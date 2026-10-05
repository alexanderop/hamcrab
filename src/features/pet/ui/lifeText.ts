export function lifeText(language: 'en' | 'de', name: string) {
  const de = language === 'de'
  return {
    title: de ? 'Dein Hamcrab' : 'Your Hamcrab',
    close: de ? 'Schließen' : 'Close',
    sections: de
      ? {
          care: 'Pflege',
          things: 'Meine Sachen',
          family: 'Familie',
          routine: 'Tagesablauf',
        }
      : {
          care: 'Care',
          things: 'My things',
          family: 'Family',
          routine: 'Routine',
        },
    attention: de
      ? {
          unwell: 'Dein Freund braucht Medizin.',
          toilet: 'Zeit für die Toilette!',
          dirty: 'Das Zuhause braucht eine Reinigung.',
          sleeping: 'Schläft gemütlich.',
          hungry: 'Zeit für einen Snack.',
          tired: 'Zeit für eine Pause.',
          morning: `Guten Morgen, ${name}!`,
          content: 'Zufrieden und bereit für dich.',
        }
      : {
          unwell: 'Your friend needs medicine.',
          toilet: 'Time for the toilet!',
          dirty: 'Home needs a clean.',
          sleeping: 'Sleeping peacefully.',
          hungry: 'Time for a snack.',
          tired: 'Time for a rest.',
          morning: `Good morning, ${name}!`,
          content: 'Content and ready for you.',
        },
    personalities: de
      ? { curious: 'Neugierig', playful: 'Verspielt', gentle: 'Sanft' }
      : { curious: 'Curious', playful: 'Playful', gentle: 'Gentle' },
    favorite: de ? 'Lieblingsessen und Spielzeug' : 'Favourite food and toy',
    food: {
      franzbroetchen: 'Franzbrötchen',
      doener: de ? 'Döner' : 'Döner kebab',
      augustiner: 'Augustiner',
      strawberry: de ? 'Erdbeere' : 'Strawberry',
    },
    clean: de ? 'Sauber machen' : 'Clean home',
    toilet: de ? 'Zur Toilette' : 'Use toilet',
    medicine: de ? 'Medizin geben' : 'Give medicine',
    healthy: de ? 'Gesund' : 'Feeling well',
    waste: de ? 'Häufchen' : 'Messes',
    slots: de
      ? { outfit: 'Kleidung', toy: 'Spielzeug', decoration: 'Dekoration' }
      : { outfit: 'Outfit', toy: 'Toy', decoration: 'Decoration' },
    items: de
      ? {
          none: 'Keine',
          cap: 'Mütze',
          ribbon: 'Schleife',
          shell: 'Muschel',
          ball: 'Ball',
          pebble: 'Kiesel',
          flower: 'Blume',
        }
      : {
          none: 'None',
          cap: 'Cap',
          ribbon: 'Ribbon',
          shell: 'Shell',
          ball: 'Ball',
          pebble: 'Pebble',
          flower: 'Flower',
        },
    locked: de
      ? 'Durch Freundschaft freischalten'
      : 'Unlock through friendship',
    variants: de
      ? {
          gourmet: 'Genießer',
          whirlwind: 'Wirbelwind',
          cuddly: 'Kuschelfreund',
        }
      : { gourmet: 'Gourmet', whirlwind: 'Whirlwind', cuddly: 'Cuddle friend' },
    generation: de ? 'Generation' : 'Generation',
    visit: de ? 'Koralle besuchen' : 'Visit Coral',
    courtship: de
      ? 'Drei Besuche an verschiedenen UTC-Tagen. Erst als Erwachsener mit gewählter Form.'
      : 'Three visits on different UTC days. Available as an adult with a chosen form.',
    newFamily: de ? 'Nächste Generation' : 'Next generation',
    consequence: de
      ? `${name} zieht ins Familienalbum. Ein neues Ei kommt zu dir. Sachen und Tagesablauf bleiben erhalten.`
      : `${name} moves into your family album. A new egg comes home. Your things and routine stay.`,
    confirm: de
      ? 'Ins Album aufnehmen und neues Ei beginnen'
      : 'Archive this adult and start a new egg',
    cancel: de ? 'Abbrechen' : 'Cancel',
    album: de ? 'Familienalbum' : 'Family album',
    empty: de
      ? 'Hier bleiben deine erwachsenen Freunde in Erinnerung.'
      : 'Your grown friends will be remembered here.',
    enabled: de
      ? 'Automatischen Tagesablauf nutzen'
      : 'Use an automatic routine',
    bedtime: de ? 'Schlafenszeit (Stunde)' : 'Bedtime (hour)',
    wake: de ? 'Aufwachzeit (Stunde)' : 'Wake time (hour)',
    offset: de ? 'Fester UTC-Versatz (Minuten)' : 'Fixed UTC offset (minutes)',
    offsetHelp: de
      ? 'Kein automatischer Wechsel bei Reisen oder Sommerzeit.'
      : 'Does not change automatically for travel or daylight saving.',
    deviceOffset: de
      ? 'Aktuellen Geräteversatz übernehmen'
      : 'Use current device offset',
    saveRoutine: de ? 'Tagesablauf speichern' : 'Save routine',
    game: de ? 'Muschelspiel' : 'Shell game',
    instructions: de
      ? 'Merke dir die Perle. Verstecke sie und wähle die richtige Muschel.'
      : 'Remember the pearl. Hide it, then choose its shell.',
    hide: de ? 'Perle verstecken' : 'Hide pearl',
    start: de ? 'Spiel beginnen' : 'Start game',
    again: de ? 'Noch einmal spielen' : 'Play again',
    shell: de ? 'Muschel' : 'Shell',
    pearl: de ? 'Perle' : 'Pearl',
    round: de ? 'Runde' : 'Round',
    score: de ? 'Gefundene Perlen' : 'Pearls found',
    correct: de ? 'Gefunden!' : 'Found it!',
    missed: de
      ? 'Knapp daneben. Weiter geht’s!'
      : 'Not this time. Try the next one!',
    cancelGame: de
      ? 'Spiel abbrechen (ohne Belohnung)'
      : 'Cancel game (no reward)',
    results: de
      ? {
          cleaned: 'Alles sauber!',
          toilet: 'Gut geschafft!',
          noToilet: 'Gerade ist keine Toilette nötig.',
          medicine: 'Dein Freund ist wieder gesund.',
          alreadyWell: 'Dein Freund ist gesund.',
          equipped: 'Ausgewählt.',
          itemLocked: 'Dieses Geschenk ist noch gesperrt.',
          gameStarted: 'Los geht’s!',
          gameCancelled: 'Spiel abgebrochen.',
          roundCorrect: 'Perle gefunden!',
          roundMissed: 'Die Perle war woanders.',
          gameFinished: 'Geschafft! Eure Belohnung ist gespeichert.',
          staleGame:
            'Das Spiel hat sich geändert. Der aktuelle Stand ist geladen.',
          companionVisited: 'Schöner Besuch bei Koralle!',
          alreadyVisited:
            'Heute wart ihr schon zu Besuch. Morgen geht es weiter.',
          adultRequired: 'Werde zuerst erwachsen und wähle eine Form.',
          familyNotReady: 'Besuche Koralle an drei verschiedenen Tagen.',
          newGeneration: 'Ein neues Ei ist angekommen!',
          routineSaved: 'Tagesablauf gespeichert.',
          invalidRoutine:
            'Bitte gültige, unterschiedliche Stunden und einen UTC-Versatz eingeben.',
          egg: 'Hilf deinem Freund zuerst aus dem Ei.',
          sleeping: 'Dein Freund schläft.',
          tired: 'Dein Freund braucht zuerst eine Pause.',
        }
      : {
          cleaned: 'All clean!',
          toilet: 'Well done!',
          noToilet: 'No toilet needed right now.',
          medicine: 'Your friend feels well again.',
          alreadyWell: 'Your friend is healthy.',
          equipped: 'Selected.',
          itemLocked: 'This gift is still locked.',
          gameStarted: 'Let’s play!',
          gameCancelled: 'Game cancelled.',
          roundCorrect: 'Pearl found!',
          roundMissed: 'The pearl was elsewhere.',
          gameFinished: 'Finished! Your reward is saved.',
          staleGame: 'The game changed. The current state is loaded.',
          companionVisited: 'A lovely visit with Coral!',
          alreadyVisited: 'You visited today. Come back tomorrow.',
          adultRequired: 'Grow up and choose a form first.',
          familyNotReady: 'Visit Coral on three different days.',
          newGeneration: 'A new egg has arrived!',
          routineSaved: 'Routine saved.',
          invalidRoutine: 'Enter valid, different hours and a UTC offset.',
          egg: 'Help your friend hatch first.',
          sleeping: 'Your friend is sleeping.',
          tired: 'Your friend needs a rest first.',
        },
  }
}
export type LifeText = ReturnType<typeof lifeText>
