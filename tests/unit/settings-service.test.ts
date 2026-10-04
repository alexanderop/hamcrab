import { expect, it } from 'vitest'
import { createSettingsService } from '../../src/features/settings/application/settings-service'
import {
  defaults,
  type Preferences,
} from '../../src/features/settings/domain/preferences'
import type { PreferencesStore } from '../../src/features/settings/application/ports'

it('merges a change with the latest stored settings, not stale view data', () => {
  let saved: Preferences = { ...defaults, caseColor: 'ocean' }
  const store: PreferencesStore = {
    read: () => saved,
    write: (value) => {
      saved = value
    },
    subscribe: () => () => {},
  }
  const result = createSettingsService(store).update(defaults, {
    language: 'de',
  })
  expect(result).toEqual({
    preferences: { ...defaults, caseColor: 'ocean', language: 'de' },
    storageUnavailable: false,
  })
  expect(saved).toEqual(result.preferences)
})
it.each(['read', 'write'] as const)(
  'keeps an unsaved selection usable when %s fails',
  (failure) => {
    const store: PreferencesStore = {
      read: () => {
        if (failure === 'read') throw new Error('blocked')
        return defaults
      },
      write: () => {
        if (failure === 'write') throw new Error('quota')
      },
      subscribe: () => () => {},
    }
    const service = createSettingsService(store)
    expect(service.load().storageUnavailable).toBe(failure === 'read')
    expect(
      service.update({ ...defaults, costumeColor: 'mint' }, { language: 'de' }),
    ).toEqual({
      preferences: { ...defaults, costumeColor: 'mint', language: 'de' },
      storageUnavailable: true,
    })
  },
)
