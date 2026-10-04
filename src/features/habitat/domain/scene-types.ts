export type CareCue = Readonly<
  { id: number; celebrate: boolean } & (
    | { kind: 'feed'; snack: SnackKind }
    | { kind: 'play' | 'pet' | 'wake' | 'sleep' }
  )
>
export type CostumePalette = Readonly<{
  base: string
  light: string
  shade: string
}>
export type SnackKind = 'pastry' | 'kebab' | 'bottle' | 'strawberry'
