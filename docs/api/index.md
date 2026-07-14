# API Reference

This section documents the complete public API of `@dynamicforms/vuetify-modal-form-kit`. For narrative,
runnable demos see [Examples](/examples/) instead.

## Modal dialogs

| Topic | Description |
|---|---|
| [`<df-modal>`](./df-modal) | The dialog component itself - use it directly when a dialog is declared in a template (SFC), controlled with `v-model`. |
| [`<modal-view>`](./modal-view) | A placeholder, not something you configure - mount one in your app root and dialogs opened via the `modal` service render into it. |
| [`modal` service](./modal-service) | Promise-based API for opening dialogs from code (`modal.message`, `modal.yesNo`, `modal.custom`), rendered by `<modal-view>`. |

See also: [Modal Dialog](/examples/dialog-basic) (programmatic) and [Template Dialog](/examples/dialog-template)
(SFC template) for worked examples.

## Form layouts

| Topic | Description |
|---|---|
| [FormBuilder](./form-builder) | Programmatic API for building responsive Vuetify grid layouts (`FormBuilder`, `Row`, `Column`, component builder). |

See also: [FormBuilder examples](/examples/form-builder).
