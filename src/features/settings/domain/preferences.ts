export const languages = ['en', 'de'] as const
export const colors = ['coral', 'mint', 'lavender', 'ocean'] as const
export type ColorName = (typeof colors)[number]
export type Preferences = Readonly<{
  language: (typeof languages)[number]
  caseColor: ColorName
  costumeColor: ColorName
}>
export const defaults: Preferences = {
  language: 'en',
  caseColor: 'coral',
  costumeColor: 'coral',
}
