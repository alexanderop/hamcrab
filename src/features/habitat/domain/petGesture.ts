export type PetGesture = Readonly<{
  pointer: number
  x: number
  y: number
  cancelled: boolean
}>
export function beginPetGesture(
  current: PetGesture | null,
  input: {
    pointer: number
    x: number
    y: number
    primary: boolean
    hit: boolean
  },
): PetGesture {
  return {
    pointer: input.pointer,
    x: input.x,
    y: input.y,
    cancelled: current !== null || !input.primary || !input.hit,
  }
}
export function movePetGesture(
  gesture: PetGesture,
  pointer: number,
  x: number,
  y: number,
): PetGesture {
  return {
    ...gesture,
    cancelled:
      gesture.cancelled ||
      pointer !== gesture.pointer ||
      Math.hypot(x - gesture.x, y - gesture.y) > 6,
  }
}
export function completesPetGesture(
  gesture: PetGesture | null,
  pointer: number,
  hit: boolean,
): boolean {
  return (
    gesture !== null && !gesture.cancelled && gesture.pointer === pointer && hit
  )
}
