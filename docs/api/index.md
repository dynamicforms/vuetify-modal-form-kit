---
description: 'API reference: df-modal, modal-view, the promise-based modal service (message, yesNo, custom), FormBuilder, form-render and component-render.'
---

# API Reference

The public API of `@dynamicforms/vuetify-modal-form-kit`. Runnable demos are in [Examples](/examples/).

## Modal dialogs

| Topic | Description |
|---|---|
| [`<df-modal>`](./df-modal) | The dialog component. Used directly for a dialog declared in a template, opened and closed through `v-model`. |
| [`<modal-view>`](./modal-view) | Draws the dialogs the `modal` service opens. Mounted once, in the app root; it has no props. |
| [`modal` service](./modal-service) | Promise-based API for opening dialogs from code (`modal.message`, `modal.yesNo`, `modal.custom`), rendered by `<modal-view>`. The [promise](./modal-service#closeablepromise) it returns closes the dialog, carries what settled it, and reads and changes the open dialog. |

Examples: [Modal Dialog](/examples/dialog-basic) (from code) and [Template Dialog](/examples/dialog-template)
(in a template).

## Form layouts

| Topic | Description |
|---|---|
| [FormBuilder](./form-builder) | Programmatic API for building responsive Vuetify grid layouts (`FormBuilder`, `Row`, `Column`, component builder). |
| [`<form-render>`](./form-render) | Renders a layout - the builder or its JSON - as a Vuetify grid, resolving the breakpoints it holds. |
| [`<component-render>`](./component-render) | Renders one component of a layout, resolving its name against the `components` map, the global registrations and the nested-form renderer. Use it to build a renderer of your own. |

Examples: [FormBuilder](/examples/form-builder).
