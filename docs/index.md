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
      link: https://github.com/velis74/dynamicforms-vuetify-modal-form-kit
features:
  - title: Programmatic & Template Dialog API
    details: Open dialogs from code with a promise-based API (e.g. await modal.message()) and get the result back 
             directly — no events, no callbacks. Or declare dialogs in Vue templates using DfModal component.
  - title: One Dialog at a Time
    details: The library maintains an internal queue — if code tries to open a second dialog while one is already 
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

1. **Programmatic & template-based dialog API** — open dialogs from code with a promise-based API (`await modal.message()`, `await modal.yesNo()`) and get the result back directly, without events or callbacks. Or declare dialogs in Vue templates with `<DfModal>`.
2. **One dialog on screen at a time** — an internal queue ensures a second dialog never interrupts the first; it simply waits.
3. **Programmatic form builder** — a fluent `FormBuilder` API lets you define responsive Vuetify grid layouts entirely in TypeScript, with no template markup required.
4. **Keyboard shortcuts** — `<Enter>` confirms and `<Esc>` cancels the active dialog.

## Simple Example

Ready to get started? Check out the [Getting Started](/guide/getting-started) guide or dive into the 
[Examples](/examples/) for more detailed usage patterns.

<script setup>
</script>
