import {
  pendingAdult,
  neutralDay,
} from '../../src/features/pet/domain/lifecycle'
import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import LifecyclePanel from '../../src/features/pet/ui/LifecyclePanel.vue'
import { messages } from '../../src/features/settings/ui/messages'
it('hatches with the keyboard and prevents input while saving', async () => {
  let count = 0
  const screen = await render(LifecyclePanel, {
    props: {
      lifecycle: { stage: 'egg' },
      disabled: false,
      text: messages.en('Pinchy').lifecycle,
      onHatch: () => count++,
    },
  })
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  expect(count).toBe(1)
  await screen.rerender({ disabled: true })
  await expect
    .element(page.getByRole('button', { name: 'Help hatch' }))
    .toBeDisabled()
})
it.each(['en', 'de'] as const)(
  'shows growth and adult state in %s without a canvas',
  async (language) => {
    const text = messages[language]('Pinchy').lifecycle
    const screen = await render(LifecyclePanel, {
      props: {
        lifecycle: { stage: 'baby', days: [1, 3].map(neutralDay) },
        disabled: false,
        text,
      },
    })
    await expect.element(page.getByText(text.days(2))).toBeVisible()
    await expect
      .element(page.getByRole('progressbar', { name: text.progress }))
      .toHaveAttribute('value', '2')
    await screen.rerender({ lifecycle: pendingAdult() })
    await expect
      .element(page.getByText(text.stages.adult, { exact: true }))
      .toBeVisible()
    await expect.element(page.getByRole('progressbar')).not.toBeInTheDocument()
  },
)
it.each(['en', 'de'] as const)(
  'offers only allowed adult choices in %s and disables saving',
  async (language) => {
    const text = messages[language]('Pinchy').lifecycle
    const choices: string[] = []
    const screen = await render(LifecyclePanel, {
      props: {
        lifecycle: {
          stage: 'adult',
          identity: { status: 'pending', options: ['whirlwind', 'cuddly'] },
        },
        disabled: false,
        text,
        onChooseVariant: (variant) => choices.push(variant),
      },
    })
    await page.getByRole('button', { name: text.choose, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: text.title })
    await expect.element(dialog).toBeVisible()
    await expect
      .element(
        dialog.getByRole('button', {
          name: text.variants.gourmet,
          exact: false,
        }),
      )
      .not.toBeInTheDocument()
    await dialog
      .getByRole('button', { name: text.variants.whirlwind, exact: false })
      .click()
    expect(choices).toEqual(['whirlwind'])
    await screen.rerender({ disabled: true })
    await expect
      .element(
        dialog.getByRole('button', {
          name: text.variants.cuddly,
          exact: false,
        }),
      )
      .toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await expect
      .element(page.getByRole('button', { name: text.choose, exact: true }))
      .toHaveFocus()
  },
)
it('keeps keyboard focus in the dialog after choosing and returns it to the permanent trigger', async () => {
  const text = messages.en('Pinchy').lifecycle
  const screen = await render(LifecyclePanel, {
    props: { lifecycle: pendingAdult(), disabled: false, text },
  })
  await page.getByRole('button', { name: text.choose, exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Gourmet/ })
    .click()
  await screen.rerender({
    lifecycle: {
      stage: 'adult',
      identity: { status: 'chosen', variant: 'gourmet' },
    },
  })
  await expect
    .element(page.getByRole('button', { name: text.close, exact: true }))
    .toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await expect
    .element(page.getByRole('button', { name: text.title, exact: true }))
    .toHaveFocus()
})
it('explains a failed form save inside the dialog and retries without losing the choices', async () => {
  const copy = messages.de('Pinchy')
  let retries = 0
  const screen = await render(LifecyclePanel, {
    props: {
      lifecycle: {
        stage: 'adult',
        identity: { status: 'pending', options: ['gourmet', 'cuddly'] },
      },
      disabled: false,
      text: copy.lifecycle,
      onRetry: () => retries++,
    },
  })
  await page
    .getByRole('button', { name: copy.lifecycle.choose, exact: true })
    .click()
  await screen.rerender({
    disabled: true,
    notice: { message: copy.errors.save, retryLabel: copy.retry, busy: false },
  })
  const dialog = page.getByRole('dialog', { name: copy.lifecycle.title })
  await expect
    .element(dialog.getByRole('alert'))
    .toHaveTextContent(copy.errors.save)
  const retry = dialog.getByRole('button', { name: copy.retry, exact: true })
  await expect.element(retry).toHaveFocus()
  await expect
    .element(dialog.getByRole('button', { name: /Genießer/ }))
    .toBeDisabled()
  await expect
    .element(dialog.getByRole('button', { name: /Kuschelfreund/ }))
    .toBeDisabled()
  await expect
    .element(dialog.getByRole('button', { name: /Wirbelwind/ }))
    .not.toBeInTheDocument()
  await userEvent.keyboard('{Enter}')
  expect(retries).toBe(1)
  await screen.rerender({
    notice: { message: copy.errors.save, retryLabel: copy.retry, busy: true },
  })
  await expect.element(retry).toBeDisabled()
  await screen.rerender({ disabled: false, notice: null })
  await expect
    .element(dialog.getByRole('button', { name: /Genießer/ }))
    .toHaveFocus()
  await expect
    .element(dialog.getByRole('button', { name: /Kuschelfreund/ }))
    .toBeEnabled()
})
