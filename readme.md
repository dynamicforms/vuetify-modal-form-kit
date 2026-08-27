# @dynamicforms/vuetify-modal-form-kit

A Vue 3 + Vuetify 3 library built around four design goals:

1. **Programmatic & template-based dialog API** — open dialogs from code with a promise-based API
   (`await modal.message()`, `await modal.yesNo()`, `await modal.custom()`) and get the result back directly, without
   events or callbacks. Dialogs can also be declared directly in Vue templates using `<DfModal>`.
2. **One dialog on screen at a time** — the library maintains an internal stack; opening a second dialog suspends the
   first (hidden, not closed) until the second is closed, at which point it reappears. Mount `<ModalView />` once to
   draw it.
3. **Programmatic form builder** — define responsive Vuetify grid layouts (rows → columns → components) entirely in
   TypeScript using a fluent `FormBuilder` API, without writing any template markup.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog. A keystroke an overlay above
   the dialog answers - a select menu, a date picker - is that overlay's alone.

The dialog manager and form builder are designed to work together: a `FormBuilder` layout can be passed directly into a
dialog for inline validation and submission.

---

## Documentation

Full documentation, the API reference and runnable examples are available at
**https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/**.

Upgrading from 0.6.x? The
[migration guide](https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/guide/migration) lists every breaking
change with before/after code.

---

## Installation

```bash
npm install @dynamicforms/vuetify-modal-form-kit
```

**Peer dependencies** (must be installed separately):

```bash
npm install vue@^3.5.32 vuetify@^3.9 @dynamicforms/vue-forms@^0.17.1 @dynamicforms/vuetify-inputs@^0.9.2 \
  lodash-es vue-markdown-render @mdi/font
```

The package is ESM only, and `engines.node` is `>=22.12` - the release where Node supports `require()` of an ES
module, which is how a CommonJS consumer reaches it. That path runs through a bundler: the peers it loads import
their own stylesheets, which plain node has no loader for.

```typescript
import { createApp } from 'vue'
import { DynamicFormsModalFormKit } from '@dynamicforms/vuetify-modal-form-kit'
// this library ships no stylesheet of its own; the inputs it renders bring theirs
import '@dynamicforms/vuetify-inputs/styles.css'

const app = createApp(App)
app.use(vuetify)
app.use(DynamicFormsModalFormKit, { registerComponents: true })
app.mount('#app')
```

---

## Quick start

Add `<ModalView />` somewhere in your root template to enable the modal system, then call dialogs from anywhere:

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit'

await modal.message('Done', 'Your changes have been saved.')

const answer = await modal.yesNo('Delete item', 'This cannot be undone. Continue?')
if (answer === 'yes') {
  await deleteItem()
}
```

Build a form layout in code and render it with `<FormRender>`:

```typescript
import { FormBuilder } from '@dynamicforms/vuetify-modal-form-kit'

const form = new FormBuilder()

form.simple(2)
  .dfInput({ label: 'First name' })
  .dfInput({ label: 'Last name' })
  .simple()
  .dfTextArea({ label: 'Notes', rows: 3 })
```

```html
<FormRender :layout="form" />
```

See the [Getting Started guide](https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/guide/getting-started) for
full setup instructions and plugin options.

---

## License

MIT © Jure Erznožnik
