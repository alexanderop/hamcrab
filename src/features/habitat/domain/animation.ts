import type { CareCue, SnackKind } from './scene-types'

export type Motion =
  | 'idle'
  | 'greet'
  | 'feed'
  | 'play'
  | 'pet'
  | 'wake'
  | 'celebrate'
  | 'groom'
  | 'inspect'
  | 'wobble'
type Clip = Readonly<{
  kind: Exclude<Motion, 'idle'>
  at: number
  variant: number
}>
export type AnimationEnvironment = Readonly<{
  loaded: boolean
  available: boolean
  visible: boolean
  sleeping: boolean
  reduced: boolean
}>
export type AnimationState = Readonly<{
  environment: AnimationEnvironment
  entered: boolean
  pendingReturn: boolean
  hiddenAt: number | null
  lastCue: number
  sequence: number
  clips: readonly Clip[]
  idleAt: number
  snack: Readonly<{ kind: SnackKind; until: number }> | null
}>
const durations = {
  greet: 2.8,
  feed: 3.4,
  play: 2.8,
  pet: 2.5,
  wake: 3,
  celebrate: 3.2,
  groom: 2.8,
  inspect: 3,
  wobble: 2.6,
} as const
export function initialAnimation(): AnimationState {
  return {
    environment: {
      loaded: false,
      available: false,
      visible: true,
      sleeping: false,
      reduced: false,
    },
    entered: false,
    pendingReturn: false,
    hiddenAt: null,
    lastCue: 0,
    sequence: 0,
    clips: [],
    idleAt: 0,
    snack: null,
  }
}
export function updateEnvironment(
  state: AnimationState,
  environment: AnimationEnvironment,
  at: number,
): AnimationState {
  const firstVisit =
    environment.loaded &&
    environment.available &&
    environment.visible &&
    !state.entered
  const returning =
    environment.visible &&
    !state.environment.visible &&
    state.hiddenAt !== null &&
    at - state.hiddenAt >= 30
  const interrupted =
    !environment.loaded ||
    !environment.visible ||
    environment.sleeping ||
    environment.reduced !== state.environment.reduced
  const pendingReturn =
    (state.pendingReturn || returning) && environment.visible
  const greet =
    (firstVisit || pendingReturn) &&
    !environment.sleeping &&
    !environment.reduced &&
    environment.loaded &&
    environment.available
  const clips: readonly Clip[] = greet
    ? [{ kind: 'greet', at, variant: state.sequence % 2 }]
    : interrupted
      ? []
      : state.clips
  return {
    ...state,
    environment,
    pendingReturn:
      pendingReturn && (!environment.loaded || !environment.available),
    entered: state.entered || firstVisit,
    hiddenAt:
      !environment.visible && state.environment.visible
        ? at
        : environment.visible
          ? null
          : state.hiddenAt,
    clips,
    sequence: state.sequence + Number(greet),
    idleAt: greet ? at + durations.greet : interrupted ? at : state.idleAt,
    snack:
      !environment.loaded || !environment.visible || environment.sleeping
        ? null
        : state.snack,
  }
}
export function acceptCue(
  state: AnimationState,
  cue: CareCue,
  at: number,
): AnimationState {
  if (cue.id <= state.lastCue) return state
  const next = { ...state, lastCue: cue.id, clips: [], snack: null, idleAt: at }
  const env = state.environment
  if (
    !env.loaded ||
    !env.available ||
    !env.visible ||
    env.sleeping ||
    cue.kind === 'sleep'
  )
    return next
  const snack =
    cue.kind === 'feed' ? { kind: cue.snack, until: at + durations.feed } : null
  if (env.reduced) return { ...next, snack }
  const clip: Clip = { kind: cue.kind, at, variant: state.sequence % 2 }
  const end = at + durations[clip.kind]
  const clips: readonly Clip[] = cue.celebrate
    ? [clip, { kind: 'celebrate', at: end, variant: clip.variant }]
    : [clip]
  return {
    ...next,
    clips,
    snack,
    sequence: state.sequence + 1,
    idleAt: end + (cue.celebrate ? durations.celebrate : 0),
  }
}
export type AnimationPose = {
  motion: Motion
  age: number
  energy: number
  snack: SnackKind | null
  x: number
  y: number
  roll: number
  headRoll: number
  headPitch: number
  headTurn: number
  eyesClosed: number
  gaze: number
  leftClaw: number
  rightClaw: number
  pawReach: number
  ballTravel: number
  ballLift: number
}
export function sampleAnimation(
  state: AnimationState,
  at: number,
): AnimationPose {
  const pose: AnimationPose = {
    motion: 'idle',
    age: 0,
    energy: 0,
    snack: state.snack && at < state.snack.until ? state.snack.kind : null,
    x: 0,
    y: 0,
    roll: 0,
    headRoll: 0,
    headPitch: 0,
    headTurn: 0,
    eyesClosed: 0,
    gaze: 0,
    leftClaw: 0,
    rightClaw: 0,
    pawReach: 0,
    ballTravel: 0,
    ballLift: 0,
  }
  const env = state.environment
  if (!env.loaded || !env.visible || env.sleeping || env.reduced) return pose
  let clip = state.clips.find(
    (candidate) =>
      at >= candidate.at && at < candidate.at + durations[candidate.kind],
  )
  if (!clip && at >= state.idleAt + 16) {
    const slot = Math.floor((at - state.idleAt - 16) / 23)
    const kind = (['groom', 'inspect', 'wobble'] as const)[
      (slot + state.sequence) % 3
    ]!
    const start = state.idleAt + 16 + slot * 23
    if (at < start + durations[kind])
      clip = { kind, at: start, variant: slot % 2 }
  }
  if (!clip) return pose
  const age = at - clip.at
  const phase = age / durations[clip.kind]
  const energy = Math.sin(phase * Math.PI)
  const direction = clip.variant === 0 ? 1 : -1
  Object.assign(pose, { motion: clip.kind, age, energy })
  switch (clip.kind) {
    case 'greet':
      pose.y = energy * 0.07
      pose.headRoll = direction * energy * 0.12
      pose.leftClaw =
        direction === 1
          ? energy * (0.85 + Math.sin(age * 13) * 0.27)
          : energy * 0.15
      pose.rightClaw =
        direction === -1
          ? -energy * (0.85 + Math.sin(age * 13) * 0.27)
          : -energy * 0.15
      break
    case 'pet':
      pose.roll = direction * energy * 0.09
      pose.headRoll = direction * energy * 0.16
      pose.eyesClosed = Math.min(1, energy * 2)
      pose.headPitch = energy * -0.08
      break
    case 'feed':
      pose.pawReach = energy * 0.58
      pose.headPitch = Math.sin(age * 15) * 0.04 * energy
      pose.gaze = -energy * 0.02
      pose.leftClaw = energy * 0.18
      pose.rightClaw = -energy * 0.18
      break
    case 'wake':
      pose.y = energy * 0.08
      pose.leftClaw = energy * 0.95
      pose.rightClaw = -energy * 0.95
      pose.headPitch = -energy * 0.15
      pose.headRoll = age > 1.5 ? Math.sin(age * 17) * energy * 0.1 : 0
      pose.eyesClosed = age < 0.9 ? Math.max(0, Math.cos(age * 6)) : 0
      break
    case 'celebrate':
      pose.x = Math.sin(age * 5.4) * energy * 0.24
      pose.y = Math.abs(Math.sin(age * 5.4)) * energy * 0.12
      pose.roll = -Math.sin(age * 5.4) * energy * 0.1
      pose.leftClaw = energy * 0.85
      pose.rightClaw = -energy * 0.85
      break
    case 'play': {
      const travel = Math.max(
        0,
        Math.sin(Math.max(0, (age - 0.4) / 2.4) * Math.PI),
      )
      pose.ballTravel = travel
      pose.ballLift = Math.abs(Math.sin(age * 9)) * travel * 0.18
      pose.rightClaw = -Math.sin(Math.min(age / 0.7, 1) * Math.PI) * 0.75
      pose.headTurn = travel * 0.23
      pose.y =
        Math.max(0, Math.sin(((age - 0.15) / 0.8) * Math.PI)) * energy * 0.12
      break
    }
    case 'groom':
      pose.leftClaw = energy * 0.7
      pose.headPitch = energy * 0.1
      pose.headTurn = -energy * 0.16
      pose.pawReach = (0.25 + Math.sin(age * 9) * 0.1) * energy
      break
    case 'inspect':
      pose.headPitch = energy * 0.19
      pose.headTurn = direction * energy * 0.24
      pose.headRoll = direction * energy * 0.08
      break
    case 'wobble':
      pose.roll = Math.sin(age * 7) * energy * 0.1
      pose.leftClaw = energy * 0.32
      pose.rightClaw = -energy * 0.32
      pose.eyesClosed = age > 1.9 ? energy : 0
  }
  return pose
}
