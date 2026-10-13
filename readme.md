# @dynamicforms/vuetify-modal-form-kit

A Vue 3 + Vuetify 3 library for dialogs and form layouts:

1. **Dialogs from code or from a template** — `await modal.message()`, `await modal.yesNo()` and
   `await modal.custom()` open a dialog and resolve with the name of the action that closed it. `<DfModal>` declares
   a dialog in a template.
2. **One dialog on screen** — dialogs are kept on a stack. Opening a second dialog hides the first without closing
   it; the first is shown again when the second closes. `<ModalView />` draws the stack and is mounted once.
3. **Form layouts in code** — `FormBuilder` defines responsive Vuetify grid layouts (rows → columns → components) in
   TypeScript.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog. While an overlay above the
   dialog is open, such as a select menu or a date picker, the key goes to that overlay.

A `FormBuilder` layout renders in the body of a `<DfModal>`, so a dialog can hold a form laid out in code.

---

## Documentation

Full documentation, the API reference and runnable examples are available at
**https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/**.

The [migration guide](https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/guide/migration) lists every
breaking change with before/after code.

---

## Installation

```bash
npm install @dynamicforms/vuetify-modal-form-kit
```

The package is ESM only. `engines.node` is `>=22.12`, the first Node release that supports `require()` of an ES
module, which a CommonJS consumer uses. A CommonJS consumer still needs a bundler: the peers import their own
stylesheets, which Node cannot load.

```typescript
import { createApp } from 'vue'
import { DynamicFormsModalFormKit } from '@dynamicforms/vuetify-modal-form-kit'
// this library has no stylesheet; the inputs it renders use the vuetify-inputs one
import '@dynamicforms/vuetify-inputs/styles.css'

const app = createApp(App)
app.use(vuetify)
app.use(DynamicFormsModalFormKit, { registerComponents: true })
app.mount('#app')
```

---

## Quick start

Mount `<ModalView />` once in the root template. Dialogs can then be opened from any code:

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

The [Getting Started guide](https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/guide/getting-started) covers
the setup and the plugin options.

---

## License

MIT © Jure Erznožnik
