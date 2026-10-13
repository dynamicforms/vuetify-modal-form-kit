# Modal Dialog Component

Dialogs opened from code through the `modal` service. They are kept on a stack, the call returns a promise, and a
dialog can hold a `@dynamicforms/vue-forms` form.

## Basic Usage

A message dialog, a yes/no confirmation, a form dialog with validation and sized dialogs, opened through the
`modal` service. A `<modal-view />` must be mounted once, in the app root - see
[Installation](/guide/getting-started#modal-dialogs).

<modal-basic/>

## Features

- **One dialog at a time** - a `modal.*` call made while a dialog is open hides that dialog without closing it and
  shows the new one. The hidden dialog is shown again when the new one closes.
- **Message dialogs** - `modal.message('Title', 'Text')` shows a dialog with a single `close` action. The demo's
  message is Markdown (`MdString`) with a CSS class added through `RenderableValue`.
- **Confirmations** - `modal.yesNo('Title', 'Text')` shows `yes` / `no` actions and resolves to whichever was
  clicked.
- **Form dialogs** - a [`@dynamicforms/vue-forms`](:vue-forms:) `Group` passed as `options.form` is the dialog
  body. Its `Action` members (e.g. `submit`, `cancel`) are the dialog's buttons, and the promise resolves with the
  name of the one that was clicked; the dialog adds its own `close` only where none of them is drawn. A vue-forms
  `Action` and the [`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) `Action` are both drawn; the latter adds the
  responsive render options. Each `Field` is drawn as the component in `field.extra.component`, or as a
  `<df-input>` where it names none, with the field's label. A nested `Group` or `List` member is not drawn - see
  [`<modal-view>`](/api/modal-view#the-generated-layout).
- **Error messages** - the form dialog's email field has a pattern validator with the code `invalid_email`. The
  documentation app installs vuetify-inputs with an `errorText` that renders that code from a markdown message - see
  [Translating errors](/guide/getting-started#translating-errors).
- **Custom components** - `modal.custom('Title', component, componentProps)` renders a component, or a component
  named in `options.components` or registered globally, as the dialog body.
- **Sizing** - `options.size` is `'small'`, `'medium'`, `'large'` or `'x-large'`; each is fullscreen below its own
  breakpoint. `'default'` sizes the dialog to its content.
- **Changing an open dialog** - the sized dialogs' body holds an input for the title and selects for the icon, the
  title color and the size. The demo writes their values to the dialog's `props.title`, `props.icon`, `props.color`
  and `props.size` - see
  [Changing an open dialog](/api/modal-service#changing-an-open-dialog).

## Changing an open dialog

The sized dialogs write the values of their inputs to the dialog's `props`, the
[`DialogProps`](/api/modal-service#changing-an-open-dialog) of the promise `modal.message()` returns:

<<< ../components/modal-basic.vue#dialog-props{ts}

Full method signatures, `CloseablePromise`, `ModalOptions`, and `DialogSize` are documented in the
[`modal` service API reference](/api/modal-service).

## See also

- [Template Dialog](./dialog-template) - a dialog declared in a template with `<df-modal>`.
- [API Reference](/api/) - the props, methods and options of the `modal` service, `<df-modal>`, `<modal-view>` and
  `DialogSize`.

<script setup>
import ModalBasic from '../components/modal-basic.vue';
</script>
