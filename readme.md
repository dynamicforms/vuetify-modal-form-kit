# @dynamicforms/vuetify-modal-form-kit

A Vue 3 + Vuetify 3 library built around four design goals:

1. **Programmatic & template-based dialog API** — open dialogs from code with a promise-based API
   (`await modal.message()`, `await modal.yesNo()`, `await modal.custom()`) and get the result back directly, without
   events or callbacks. Dialogs can also be declared directly in Vue templates using `<DfModal>`.
2. **One dialog on screen at a time** — the library maintains an internal queue; if code tries to open a second dialog
   while one is already open, it waits until the first is closed.
3. **Programmatic form builder** — define responsive Vuetify grid layouts (rows → columns → components) entirely in
   TypeScript using a fluent `FormBuilder` API, without writing any template markup.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog.

The dialog manager and form builder are designed to work together: a `FormBuilder` layout can be passed directly into a
dialog for inline validation and submission.

---

## Installation

```bash
npm install @dynamicforms/vuetify-modal-form-kit
```

**Peer dependencies** (must be installed separately):

```bash
npm install vue vuetify @dynamicforms/vue-forms @dynamicforms/vuetify-inputs lodash-es vue-markdown-render @mdi/font
```

### Register the plugin

```typescript
import { createApp } from 'vue'
import { DynamicFormsModalFormKit } from '@dynamicforms/vuetify-modal-form-kit'
import '@dynamicforms/vuetify-modal-form-kit/styles.css'

const app = createApp(App)
app.use(vuetify)
app.use(DynamicFormsModalFormKit)
app.mount('#app')
```

Add `<ModalView />` (or `<df-modal />`) somewhere in your root template to enable the modal system:

```html
<template>
  <v-app>
    <router-view />
    <ModalView />
  </v-app>
</template>
```

---

## Modal Dialog Manager

The `modal` object provides a Promise-based API for showing dialogs. Because the library manages a dialog stack
internally, you never have to worry about two dialogs trying to appear at the same time — the second one waits until the
first is closed.

### Simple message

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit'

await modal.message('Done', 'Your changes have been saved.')
```

### Yes / No confirmation

```typescript
const answer = await modal.yesNo('Delete item', 'This cannot be undone. Continue?')
if (answer === 'yes') {
  await deleteItem()
}
```

### Dialog with a form

Pass a `@dynamicforms/vue-forms` form group to add validation and structured input directly inside the dialog:

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit'
import * as Form from '@dynamicforms/vue-forms'

const form = new Form.Group({
  email: new Form.Field({ label: 'Email', rules: [Form.Rules.required(), Form.Rules.email()] }),
  submit: new Form.Action({ label: 'Send' }),
})

await modal.message('Subscribe', 'Enter your email address:', { form })
```

### Custom component dialog

Render any registered component inside the dialog:

```typescript
await modal.custom('Settings', 'MySettingsPanel', { userId: 42 })
```

### Dialog options

All dialog methods accept an optional options object:

```typescript
{
  form?: Form.Group        // form for inline validation
  size?: DialogSize        // SMALL | MEDIUM | LARGE | X_LARGE
  actions?: Record<string, Action>  // override or extend action buttons
  color?: string           // header background color
  icon?: string            // header icon (MDI name)
}
```

### Dialog sizes

```typescript
import { DialogSize } from '@dynamicforms/vuetify-modal-form-kit'

await modal.message('Title', 'Content', { size: DialogSize.LARGE })
```

On small screens the dialog automatically switches to fullscreen regardless of the configured size.

---

## Programmatic Form Layout Builder

`FormBuilder` lets you define a Vuetify grid layout (rows → columns → components) entirely in TypeScript, without writing any template markup. This is especially useful for backend-driven or dynamically generated forms.

### Quick start — simple layouts

```typescript
import { FormBuilder } from '@dynamicforms/vuetify-modal-form-kit'

const form = new FormBuilder()

// Two inputs side-by-side, then a full-width textarea
form.simple(2)
  .dfInput({ label: 'First name' })
  .dfInput({ label: 'Last name' })
  .simple()
  .dfTextArea({ label: 'Notes', rows: 3 })
```

Render the layout in a template:

```html
<FormRender :layout="form" />
```

### Explicit row / column control

For precise control, use the `row` → `col` → `component` chain:

```typescript
form.row({}, (row) =>
  row
    .col({ cols: 8 }, (col) =>
      col.component((c) => c.dfInput({ label: 'Street' }))
    )
    .col({ cols: 4 }, (col) =>
      col.component((c) => c.dfInput({ label: 'Number' }))
    )
)
```

### Responsive breakpoints

Define different layouts per breakpoint:

```typescript
form
  .breakpoint('sm', (f) => f.simple(1).dfInput({ label: 'Name' }))
  .breakpoint('md', (f) => f.simple(2).dfInput({ label: 'Name' }).dfInput({ label: 'Surname' }))
```

### Available component shortcuts

The builder exposes convenience methods for all standard `@dynamicforms/vuetify-inputs` components:

| Method | Component |
|---|---|
| `.dfInput(props)` | Text input |
| `.dfTextArea(props)` | Multi-line text |
| `.dfSelect(props)` | Dropdown select |
| `.dfCheckbox(props)` | Checkbox |
| `.dfDateTime(props)` | Date / time picker |
| `.dfFile(props)` | File upload |
| `.dfColor(props)` | Color picker |
| `.dfRtfEditor(props)` | Rich text editor |
| `.dfActions(props)` | Action buttons |
| `.generic(name, props)` | Any component by registered name |

### Nested forms

Embed a child `FormBuilder` layout inside a parent:

```typescript
const address = new FormBuilder()
address.simple(2).dfInput({ label: 'City' }).dfInput({ label: 'ZIP' })

form.row({}, (row) =>
  row.col({ cols: 12 }, (col) =>
    col.component((c) => c.nestedForm(address))
  )
)
```

### Serialisation

Layouts can be serialised to JSON, which makes it possible to define them on the backend and send them over the wire:

```typescript
const json = form.toJSON()
// Send to server / store / reconstruct later
```

---

## Exports

```typescript
import {
  // Modal system
  modal,
  ModalView,
  DfModal,
  DialogSize,

  // Form layout builder
  FormBuilder,
  FormLayout,
  FormBuilderBodyProp,

  // Rendering components
  FormRender,
  ComponentRender,

  // Plugin
  DynamicFormsModalFormKit,
} from '@dynamicforms/vuetify-modal-form-kit'
```

---

## Requirements

| Dependency | Version |
|---|---|
| Vue | ^3.4 |
| Vuetify | ^3.8 |
| @dynamicforms/vue-forms | ^0.5.0 |
| @dynamicforms/vuetify-inputs | ^0.7.1 |

---

## License

MIT © Jure Erznožnik