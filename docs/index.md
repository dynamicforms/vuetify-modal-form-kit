---
layout: home
hero:
  name: DynamicForms Vuetify Modal Form Kit
  text: Modal dialogs and programmatic form layouts for Vue 3 + Vuetify 3
  tagline: Dialogs opened from code, one on screen at a time, with keyboard shortcuts; form layouts defined in code
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/dynamicforms/vuetify-modal-form-kit
    - theme: alt
      text: Changelog
      link: /guide/changelog
features:
  - title: Dialogs from code or from a template
    details: await modal.message() opens a dialog and resolves with the name of the action that closed it. The
             df-modal component declares a dialog in a template.
  - title: One dialog on screen
    details: Dialogs are kept on a stack. Opening a second dialog hides the first without closing it; the first is
             shown again when the second closes.
  - title: Form layouts in code
    details: FormBuilder defines responsive Vuetify grid layouts (rows → columns → components) in TypeScript.
  - title: Keyboard shortcuts
    details: Enter confirms and Esc cancels the active dialog.
---

# @dynamicforms/vuetify-modal-form-kit

## Introduction

`@dynamicforms/vuetify-modal-form-kit` is a Vue 3 + Vuetify 3 library for dialogs and form layouts:

1. **Dialogs from code or from a template** — `await modal.message()` and `await modal.yesNo()` open a dialog and
   resolve with the name of the action that closed it. `<df-modal>` declares a dialog in a template.
2. **One dialog on screen** — dialogs are kept on a stack. Opening a second dialog hides the first without closing
   it; the first is shown again when the second closes. The stack is module state: a page has one, shared by every
   Vue app on it. `<modal-view>` draws it and is mounted once; a second mounted `<modal-view>` warns on the console
   and renders nothing.
3. **Form layouts in code** — `FormBuilder` defines responsive Vuetify grid layouts in TypeScript.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog. While an overlay above the
   dialog is open, such as a select menu or a date picker, the key goes to that overlay.

## Next steps

- [Getting Started](/guide/getting-started) - installation and setup.
- [Examples](/examples/) - runnable demos.
- [Migration guide](/guide/migration) - the breaking changes of each release, with before/after code.
