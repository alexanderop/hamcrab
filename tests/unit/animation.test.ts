import { describe, expect, it } from 'vitest'
import {
  acceptCue,
  initialAnimation,
  sampleAnimation,
  updateEnvironment,
} from '../../src/features/habitat/domain/animation'
import {
  beginPetGesture,
  completesPetGesture,
  movePetGesture,
} from '../../src/features/habitat/domain/petGesture'

const awake = {
  loaded: true,
  available: true,
  visible: true,
  sleeping: false,
  reduced: false,
}
const entered = () => updateEnvironment(initialAnimation(), awake, 0)

describe('habitat personality', () => {
  it('waits for a loaded, available visit and greets only once', () => {
    const waiting = updateEnvironment(
      initialAnimation(),
      { ...awake, available: false },
      0,
    )
    expect(sampleAnimation(waiting, 1).motion).toBe('idle')
    const ready = updateEnvironment(waiting, awake, 2)
    expect(sampleAnimation(ready, 3).motion).toBe('greet')
    expect(
      sampleAnimation(updateEnvironment(ready, awake, 10), 10).motion,
    ).toBe('idle')
  })
  it('does not greet a sleeping visit or turn a passive waking refresh into a stretch', () => {
    const asleep = updateEnvironment(
      initialAnimation(),
      { ...awake, sleeping: true },
      0,
    )
    const refreshed = updateEnvironment(asleep, awake, 1)
    expect(sampleAnimation(refreshed, 1.5).motion).toBe('idle')
    expect(
      sampleAnimation(
        acceptCue(refreshed, { id: 1, kind: 'wake', celebrate: false }, 2),
        3,
      ).motion,
    ).toBe('wake')
  })
  it('finishes the captured snack before dancing and ignores duplicate cues', () => {
    const cue = {
      id: 1,
      kind: 'feed',
      snack: 'strawberry',
      celebrate: true,
    } as const
    const state = acceptCue(entered(), cue, 4)
    expect(acceptCue(state, cue, 5)).toBe(state)
    expect(sampleAnimation(state, 5).snack).toBe('strawberry')
    expect(sampleAnimation(state, 7.5).motion).toBe('celebrate')
    expect(sampleAnimation(state, 7.5).snack).toBeNull()
    expect(sampleAnimation(state, 11).motion).toBe('idle')
  })
  it('lets a new accepted care preempt both the action and its queued dance', () => {
    const feed = acceptCue(
      entered(),
      { id: 1, kind: 'feed', snack: 'pastry', celebrate: true },
      4,
    )
    const pet = acceptCue(feed, { id: 2, kind: 'pet', celebrate: false }, 5)
    expect(sampleAnimation(pet, 6).motion).toBe('pet')
    expect(sampleAnimation(pet, 6).eyesClosed).toBe(1)
    expect(sampleAnimation(pet, 8).motion).toBe('idle')
    expect(sampleAnimation(pet, 6).snack).toBeNull()
  })
  it('clears active and queued motion on sleep and rejects stale awake cues', () => {
    const playing = acceptCue(
      entered(),
      { id: 1, kind: 'play', celebrate: true },
      4,
    )
    const asleep = updateEnvironment(playing, { ...awake, sleeping: true }, 5)
    expect(sampleAnimation(asleep, 6).ballTravel).toBe(0)
    const lateWake = acceptCue(
      asleep,
      { id: 2, kind: 'wake', celebrate: false },
      5,
    )
    expect(
      sampleAnimation(updateEnvironment(lateWake, awake, 6), 7).motion,
    ).toBe('idle')
  })
  it('cancels on hide and defers a return greeting through a refresh', () => {
    const feed = acceptCue(
      entered(),
      { id: 1, kind: 'feed', snack: 'bottle', celebrate: true },
      4,
    )
    const hidden = updateEnvironment(feed, { ...awake, visible: false }, 5)
    expect(sampleAnimation(hidden, 6).snack).toBeNull()
    const refreshing = updateEnvironment(
      hidden,
      { ...awake, available: false },
      40,
    )
    expect(sampleAnimation(refreshing, 40).motion).toBe('idle')
    expect(
      sampleAnimation(updateEnvironment(refreshing, awake, 41), 42).motion,
    ).toBe('greet')
    expect(
      sampleAnimation(
        updateEnvironment(refreshing, { ...awake, sleeping: true }, 41),
        42,
      ).motion,
    ).toBe('idle')
    expect(
      sampleAnimation(updateEnvironment(hidden, awake, 10), 11).motion,
    ).toBe('idle')
  })
  it('does not cancel an accepted animation for routine busy refreshes', () => {
    const state = acceptCue(
      entered(),
      { id: 1, kind: 'play', celebrate: false },
      4,
    )
    expect(
      sampleAnimation(
        updateEnvironment(state, { ...awake, available: false }, 5),
        5.5,
      ).motion,
    ).toBe('play')
  })
  it('keeps temporary static snack feedback while reduced motion cancels all moving poses', () => {
    const state = acceptCue(
      entered(),
      { id: 1, kind: 'feed', snack: 'bottle', celebrate: true },
      4,
    )
    const reduced = updateEnvironment(state, { ...awake, reduced: true }, 5)
    expect(sampleAnimation(reduced, 6)).toMatchObject({
      motion: 'idle',
      snack: 'bottle',
      x: 0,
      roll: 0,
    })
    const resumed = updateEnvironment(reduced, awake, 6)
    expect(sampleAnimation(resumed, 6.1).motion).toBe('idle')
    expect(sampleAnimation(resumed, 7.5).snack).toBeNull()
    expect(sampleAnimation(resumed, 8).motion).toBe('idle')
  })
  it('returns the ball and every authored pose channel to neutral after play', () => {
    const state = acceptCue(
      entered(),
      { id: 1, kind: 'play', celebrate: false },
      4,
    )
    expect(sampleAnimation(state, 5).ballTravel).toBeGreaterThan(0.5)
    expect(sampleAnimation(state, 8)).toEqual(sampleAnimation(entered(), 8))
  })
  it('has quiet gaps and repeatable rare antics with two greeting variants', () => {
    const state = entered()
    expect(sampleAnimation(state, 10).motion).toBe('idle')
    expect(sampleAnimation(state, 20)).toEqual(sampleAnimation(state, 20))
    expect(['groom', 'inspect', 'wobble']).toContain(
      sampleAnimation(state, 20).motion,
    )
    const hidden = updateEnvironment(state, { ...awake, visible: false }, 4)
    const returned = updateEnvironment(hidden, awake, 40)
    expect(sampleAnimation(state, 1).leftClaw).toBeGreaterThan(
      sampleAnimation(returned, 41).leftClaw,
    )
  })
})

describe('direct cuddle gesture', () => {
  const down = { pointer: 1, x: 100, y: 100, primary: true, hit: true }
  it('requires a primary press and release on the body', () => {
    expect(completesPetGesture(beginPetGesture(null, down), 1, true)).toBe(true)
    expect(
      completesPetGesture(
        beginPetGesture(null, { ...down, hit: false }),
        1,
        true,
      ),
    ).toBe(false)
    expect(completesPetGesture(beginPetGesture(null, down), 1, false)).toBe(
      false,
    )
    expect(
      completesPetGesture(
        beginPetGesture(null, { ...down, primary: false }),
        1,
        true,
      ),
    ).toBe(false)
  })
  it('rejects out-and-back drags, cancelled gestures and multi-pointer gestures', () => {
    const start = beginPetGesture(null, down)
    const moved = movePetGesture(start, 1, 108, 100)
    expect(
      completesPetGesture(movePetGesture(moved, 1, 100, 100), 1, true),
    ).toBe(false)
    expect(completesPetGesture(null, 1, true)).toBe(false)
    expect(
      completesPetGesture(
        beginPetGesture(start, { ...down, pointer: 2 }),
        2,
        true,
      ),
    ).toBe(false)
  })
})
