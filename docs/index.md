---
layout: home
hero:
  name: DynamicForms Vuetify Modal Form Kit
  text: Modal dialogs and programmatic form layouts for Vue 3 + Vuetify 3
  tagline: One dialog on screen at a time, keyboard-friendly, and form layouts defined entirely in code
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/dynamicforms/vuetify-modal-form-kit
features:
  - title: Programmatic & Template Dialog API
    details: Open dialogs from code with a promise-based API (e.g. await modal.message()) and get the result back 
             directly — no events, no callbacks. Or declare dialogs in Vue templates using df-modal component.
  - title: One Dialog at a Time
    details: The library maintains an internal stack — if code tries to open a second dialog while one is already 
             visible, it will suspend the first dialog while the second is on-screen.
  - title: Programmatic Form Builder
    details: Define responsive Vuetify grid layouts (rows → columns → components) entirely in TypeScript using a fluent
             FormBuilder API, without writing any template markup.
  - title: Keyboard Shortcuts
    details: Press Enter to confirm or Esc to cancel the active dialog — no extra wiring needed.
---

# @dynamicforms/vuetify-modal-form-kit

## Introduction

`@dynamicforms/vuetify-modal-form-kit` is a Vue 3 + Vuetify 3 library built around four design goals:

1. **Programmatic & template-based dialog API** — open dialogs from code with a promise-based API
   (`await modal.message()`, `await modal.yesNo()`) and get the result back directly, without events or callbacks.
   Or declare dialogs in Vue templates with `<df-modal>`.
2. **One dialog on screen at a time** — an internal stack ensures only one dialog is ever visible: opening a second
   dialog suspends the first (kept open but hidden) and shows the second on top; the first reappears once the
   second closes. The stack is module state, so there is one per page and every Vue app on it shares that one,
   and one view draws it: mount `<modal-view>` once — a second mounted view warns on the console and renders
   nothing.
3. **Programmatic form builder** — a fluent `FormBuilder` API lets you define responsive Vuetify grid layouts
   entirely in TypeScript, with no template markup required.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog. A keystroke an overlay above
   the dialog answers - a select menu, a date picker - is that overlay's alone.

## Next steps

Ready to get started? Check out the [Getting Started](/guide/getting-started) guide or dive into the
[Examples](/examples/) for more detailed usage patterns. Coming from 0.6.x? The
[migration guide](/guide/migration) lists the breaking changes with before/after code.
