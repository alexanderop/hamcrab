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
        lifecycle: { stage: 'baby', careDays: [1, 3] },
        disabled: false,
        text,
      },
    })
    await expect.element(page.getByText(text.days(2))).toBeVisible()
    await expect
      .element(page.getByRole('progressbar', { name: text.progress }))
      .toHaveAttribute('value', '2')
    await screen.rerender({ lifecycle: { stage: 'adult' } })
    await expect
      .element(page.getByText(text.stages.adult, { exact: true }))
      .toBeVisible()
    await expect.element(page.getByRole('progressbar')).not.toBeInTheDocument()
  },
)
