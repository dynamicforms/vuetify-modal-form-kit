# @dynamicforms/vuetify-modal-form-kit

A Vue 3 + Vuetify 3 library built around four design goals:

1. **Programmatic & template-based dialog API** — open dialogs from code with a promise-based API
   (`await modal.message()`, `await modal.yesNo()`, `await modal.custom()`) and get the result back directly, without
   events or callbacks. Dialogs can also be declared directly in Vue templates using `<DfModal>`.
2. **One dialog on screen at a time** — the library maintains an internal stack; if code tries to open a second dialog
   while one is already open, the first is suspended (hidden, not closed) until the second is closed, at which point
   it reappears. The stack is module state, so there is one per page and every Vue app on it shares that one, and
   one view draws it: mount `<ModalView />` once — a second mounted view warns on the console and renders nothing,
   taking the drawing over only if the first unmounts. The library is browser-side and single-app; under SSR the
   stack lives for the process rather than the request.
3. **Programmatic form builder** — define responsive Vuetify grid layouts (rows → columns → components) entirely in
   TypeScript using a fluent `FormBuilder` API, without writing any template markup.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog. A keystroke an overlay above
   the dialog answers - a select menu, a date picker - is that overlay's alone.

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
npm install vue@^3.5.2 vuetify@^3.9 @dynamicforms/vue-forms@^0.17.1 @dynamicforms/vuetify-inputs@^0.9.2 \
  lodash-es vue-markdown-render @mdi/font
```

The package is ESM only, and `engines.node` is `>=22.12` - the release where Node supports `require()` of an ES
module, which is how a CommonJS consumer reaches it. That path runs through a bundler: the peers it loads import
their own stylesheets, which plain node has no loader for.

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
// vue-forms' own Action is a dialog button too; this one adds the responsive render options
import { Action } from '@dynamicforms/vuetify-inputs'

const form = new Group({
  email: new Field({ value: '', validators: [new Validators.Required(), new Validators.Pattern(/^[^@]+@[^@]+$/)] }),
  submit: new Action({ value: { label: 'Send', defaultConfirm: true } }),
})

// resolves with 'submit' - the key the action is registered under
await modal.message('Subscribe', 'Enter your email address:', { form })
```

Each non-`Action` `Field` on the group is rendered as the component it names - `new Field({ value: false,
component: 'df-checkbox' })` - and as a `<df-input>` where it names none; `component` takes any tag
`@dynamicforms/vuetify-inputs` draws with. Its label is the one the field carries -
`new Field({ value: '', label: 'Email address' })` - and the field name, read as Title Case, is what is left when
it carries none. A field at `DisplayMode.SUPPRESS` is skipped, so it costs no empty row. A nested `Group` or
`List` member is not laid out at all: it still validates and still counts towards `form.valid`, and the dialog
warns once, naming it. Build the layout yourself with `FormBuilder` to render one.

A dialog button is any `@dynamicforms/vue-forms` `Action`. `<df-actions>` draws it from the action's value, so the
`Action` that `@dynamicforms/vuetify-inputs` exports is what an action needs in order to render responsively, as a
text link or in a confirm / reject colour - not what it needs to be drawn at all.

A dialog states its own buttons - `close`, or `yes` / `no` - only where nothing the caller passed is drawn. An
action at `DisplayMode.SUPPRESS` draws no button, so a set that is entirely suppressed opens with the dialog's own
ones rather than with nothing to settle it.

An action keeps answering for its own executor: `await action.execute()` resolves with what the action's own
`ExecuteAction` chain returned, and the dialog settles alongside it. An `AbortEventHandlingException` is an
answer rather than a rejection - `execute()` resolves with the exception, and the dialog stays open - whether the
handler that ended the run was synchronous or not.

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
  actions?: FormActions    // Record<string, Action>: override or extend the dialog's buttons
  color?: string           // header background color
  icon?: string            // header icon (MDI name)
  components?: Record<string | symbol, any>  // components the body may name, over vuetify-inputs' df-* ones
}
```

### Getting data out of a dialog

The promise resolves with the key of the action that settled the dialog. What that action's executor returned is
on the promise beside it:

```typescript
const dialog = modal.message('Edit', 'change what you need', { form, actions: { save } })
if (await dialog === 'save') {
  const record = dialog.payload   // what the save executor answered
}
```

The other route out is the form itself, which the dialog edits in place.

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

The builder has one method per `@dynamicforms/vuetify-inputs` component, each typed to that component's props:

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
| `.dfLabel(props)` | Input label |
| `.dfInputHint(props)` | Input hint text |
| `.dfActions(props)` | Action buttons |
| `.byTag(tag, props)` | The component a tag names, through the method above that owns the tag |
| `.generic(name, props)` | Any component by registered name |

`.byTag()` is what a layout built from data reaches for: it takes the tag as a value and builds exactly what the
hand-written method builds, falling to `.generic(tag, props)` for a tag no method owns.

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
  ComponentRenderProps,
  DfModalProps,
  DfModalSlots,
  DynamicFormsModalFormKitOptions,
  FormActions,
  FormRenderProps,
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
| Node | >=22.12 |
| Vue | ^3.5.2 |
| Vuetify | ^3.9 |
| @dynamicforms/vue-forms | ^0.17.1 |
| @dynamicforms/vuetify-inputs | ^0.9.2 |

---

## License

MIT © Jure Erznožnik