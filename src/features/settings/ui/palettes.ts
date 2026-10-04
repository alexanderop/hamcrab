import type { ColorName } from '../domain/preferences'

export const palettes = {
  coral: { hue: 12, base: '#ef5943', light: '#ff7860', shade: '#b83129' },
  mint: { hue: 158, base: '#41b995', light: '#77d8b5', shade: '#23765f' },
  lavender: { hue: 267, base: '#a17cda', light: '#c3a2f2', shade: '#654696' },
  ocean: { hue: 207, base: '#449fda', light: '#7bc6f2', shade: '#285d99' },
} as const

export const colorNames = Object.keys(palettes) as ColorName[]
