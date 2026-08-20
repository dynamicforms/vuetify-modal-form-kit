# @dynamicforms/vuetify-modal-form-kit

A Vue 3 + Vuetify 3 library built around four design goals:

1. **Programmatic & template-based dialog API** — open dialogs from code with a promise-based API
   (`await modal.message()`, `await modal.yesNo()`, `await modal.custom()`) and get the result back directly, without
   events or callbacks. Dialogs can also be declared directly in Vue templates using `<DfModal>`.
2. **One dialog on screen at a time** — the library maintains an internal stack; if code tries to open a second dialog
   while one is already open, the first is suspended (hidden, not closed) until the second is closed, at which point
   it reappears.
3. **Programmatic form builder** — define responsive Vuetify grid layouts (rows → columns → components) entirely in
   TypeScript using a fluent `FormBuilder` API, without writing any template markup.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog.

The dialog manager and form builder are designed to work together: a `FormBuilder` layout can be passed directly into a
dialog for inline validation and submission.

---

## Documentation

Full documentation is available at **https://docs.velis.si/dynamicforms/vuetify-modal-form-kit/**.

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
npm install vue@^3.5.2 vuetify@^3.9 @dynamicforms/vue-forms@^0.17.0 @dynamicforms/vuetify-inputs@^0.9.0 \
  lodash-es vue-markdown-render @mdi/font
```

The package is ESM only, and Node 22 or newer is what runs it. A CommonJS consumer reaches it through
`require()` of an ES module, which Node supports from 22.12.

### Register the plugin

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

`registerComponents` (default `false`) registers `<modal-view>`, `<df-modal>`, `<form-render>` and
`<component-render>` globally; `registerVuetifyComponents` (also `false`) registers the Vuetify components the
library renders, for projects that do not install Vuetify globally. Without the first, import the components
where you use them.

Add `<ModalView />` somewhere in your root template to enable the modal system:

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
internally, you never have to worry about two dialogs trying to appear at the same time — opening a second dialog
suspends the first (it stays open but hidden) and shows the second on top; the first reappears once the second is
closed.

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
import { Field, Group, Validators } from '@dynamicforms/vue-forms'
// buttons are rendered through <df-actions>, so they are vuetify-inputs' Action
import { Action } from '@dynamicforms/vuetify-inputs'

const form = new Group({
  email: new Field({ value: '', validators: [new Validators.Required(), new Validators.Pattern(/^[^@]+@[^@]+$/)] }),
  submit: new Action({ value: { label: 'Send', defaultConfirm: true } }),
})

// resolves with 'submit' - the key the action is registered under
await modal.message('Subscribe', 'Enter your email address:', { form })
```

Each non-`Action` `Field` on the group is rendered as a `<df-input>`. Its label is the one the field carries -
`new Field({ value: '', label: 'Email address' })` - and the field name, read as Title Case, is what is left when
it carries none. A field at `DisplayMode.SUPPRESS` is skipped, so it costs no empty row. A nested `Group` or
`List` member is not laid out at all: it still validates and still counts towards `form.valid`, and the dialog
warns once, naming it. Build the layout yourself with `FormBuilder` to render one.

The dialog's buttons are `@dynamicforms/vuetify-inputs`' `Action`, because `<df-actions>` draws from the
breakpoint-resolved options only that class carries. A bare `@dynamicforms/vue-forms` `Action` on the form is
warned about and left out of the buttons; executing it still settles the dialog.

An action keeps answering for its own executor: `await action.execute()` resolves with what the action's own
`ExecuteAction` chain returned, and the dialog settles alongside it. An `AbortEventHandlingException` is an
answer rather than a rejection - `execute()` resolves with the exception, and the dialog stays open.

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
  actions?: Record<string, Action>  // override or extend action buttons; Action is vuetify-inputs'
  color?: string           // header background color
  icon?: string            // header icon (MDI name)
}
```

### Dialog sizes

```typescript
import { DialogSize } from '@dynamicforms/vuetify-modal-form-kit'

await modal.message('Title', 'Content', { size: DialogSize.LARGE })
```

Each of the four explicit sizes switches to fullscreen below its own breakpoint; `DEFAULT` sizes itself to its
content and never does.

---

## Programmatic Form Layout Builder

`FormBuilder` lets you define a Vuetify grid layout (rows → columns → components) entirely in TypeScript, without
writing any template markup. This is especially useful for backend-driven or dynamically generated forms.

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
// the callback receives a bare layout for that breakpoint and has to return it
form
  .breakpoint('sm', (f) => { f.simple(1).dfInput({ label: 'Name' }); return f; })
  .breakpoint('md', (f) => { f.simple(2).dfInput({ label: 'Name' }).dfInput({ label: 'Surname' }); return f; })
```

Rows and columns take breakpoints of their own, through the same method.

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

A nested layout is part of the serialized form, and `<FormRender>` renders it as a form of its own: it resolves the
nested layout's breakpoints itself and inherits the outer `:components` map.

### Serialisation

`toJSON()` serializes a layout, including its breakpoints:

```typescript
const json = form.toJSON()
```

`<FormRender>` takes either the builder or that JSON on `:layout` - `FormBuilder.fromJSON()` hydrates it back into
rows, columns and components, so the two render the same thing. A `symbol` component name survives an in-memory copy
of the JSON but not a `JSON.stringify()` / `JSON.parse()` round trip.

---

## Exports

```typescript
import {
  // Modal system
  modal,
  ModalView,
  DfModal,
  DialogSize,
  defaultDialogSize,

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

// types
import type {
  CloseablePromise,
  DynamicFormsModalFormKitOptions,
  FormActions,
  ModalOptions,
} from '@dynamicforms/vuetify-modal-form-kit'
```

That is the whole top-level surface. The rest of the layout tree - `Row`, `Column`, `Component`,
`ComponentBuilderBase`, `ComponentBuilderInterface`, `VuetifyInputsComponentBuilder`, `FormBuilderName`,
`SimpleProxy`, `TwelveDivisible` and the props and JSON types of rows, columns and components - is exported through
the `FormLayout` namespace alone, which is what a custom component builder or renderer reaches for:

```typescript
import { FormLayout } from '@dynamicforms/vuetify-modal-form-kit'

class MyBuilder extends FormLayout.VuetifyInputsComponentBuilder {}
```

---

## Requirements

| Dependency | Version |
|---|---|
| Node | >=22 |
| Vue | ^3.5.2 |
| Vuetify | ^3.9 |
| @dynamicforms/vue-forms | ^0.17.0 |
| @dynamicforms/vuetify-inputs | ^0.9.0 |

---

## License

MIT © Jure Erznožnik