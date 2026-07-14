# Modal Dialog Component

The Modal Dialog component provides a powerful alternative to standard Vuetify dialogs with additional features like dialog stacking, Promise-based API, and integration with DynamicForms.

## Basic Usage

A message dialog, a yes/no confirmation, a validated form dialog, and sized dialogs, all driven from code via the
`modal` service. Requires a single `<modal-view />` mounted in your app root - see
[Installation](/guide/getting-started#modal-dialogs).

<modal-basic/>

## Features

- **One dialog at a time** - nested `modal.*` calls queue instead of stacking.
- **Message dialogs** - `modal.message('Title', 'Text')` shows an info dialog with a single `close` action. The
  demo's message also shows Markdown content (via `MdString`) with a custom CSS class attached through
  `RenderableValue`.
- **Confirmations** - `modal.yesNo('Title', 'Text')` shows `yes` / `no` actions and resolves to whichever was
  clicked.
- **Form dialogs** - pass a [`@dynamicforms/vue-forms`](:vue-forms:) `Group` (with validation) as `options.form`;
  its `Action` fields (e.g. `submit`, `cancel`) become the dialog's buttons, and the returned promise resolves to
  whichever one was clicked.
- **Custom components** - `modal.custom('Title', componentName, componentProps)` renders any registered component
  as the dialog body instead of a message/form.
- **Sizing** - `options.size` picks `DialogSize.SMALL` / `MEDIUM` / `LARGE` / `X_LARGE`; on small screens the
  dialog always goes fullscreen regardless.

Full method signatures, `ModalOptions`, and `DialogSize` are documented in the
[`modal` service API reference](/api/modal-service).

## See also

- [Template Dialog](./dialog-template) - declaring a dialog directly in an SFC template with `<df-modal>`, instead
  of opening it from code.
- [API Reference](/api/) - full prop/method/option tables for the `modal` service, `<df-modal>`, `<modal-view>` and
  `DialogSize`.

<script setup>
import ModalBasic from '../components/modal-basic.vue';
</script>
