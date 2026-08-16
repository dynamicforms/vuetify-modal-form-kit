# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-08-15

### Changed (breaking)

- The peer dependencies move to `@dynamicforms/vue-forms` `^0.6.0`, `@dynamicforms/vuetify-inputs` `^0.8.1` and
  `vuetify` `^3.9`. The three go together: vuetify-inputs 0.8.1 requires the other two, and its 0.7.x line cannot be
  combined with vue-forms 0.6.0. Nothing this library exports was renamed or removed; the work is in the consuming
  application's own use of the peers, where `Field.create()`, `Action.create()`, `reactiveValue` and `IField` are gone.
- `package.json` `exports` declares a `types` condition per branch and the build emits `dist/index.d.cts` beside
  `dist/index.d.ts`. A consumer on `moduleResolution: bundler` / `node16` / `nodenext` resolved this package's types as
  `any` before, and a CommonJS consumer on `node16` reported TS1479.

### Added

- A migration guide at `/guide/migration`.
- `ModalOptions` and `FormActions` are exported as types. They are the parameter types of `modal.message()`,
  `modal.yesNo()` and `modal.custom()`, and could not be named by a consumer.
- `VBtn` to the components `registerVuetifyComponents: true` registers. `<df-modal closable>` renders one for its
  close button.

### Fixed

- A dialog opened while another is on screen is displayed. `<modal-view>` keeps one `<df-modal>` alive and swaps its
  `dialogId`; the component compared the stack against the id it was created with, so every dialog after the first
  stayed invisible and its promise could not settle.
- Row and column breakpoints reach the rendered grid. `<form-render>` resolved the form-level breakpoint only and
  serialized the rest without one, so `Row.breakpoint()` and `Column.breakpoint()` changed nothing. What such a
  breakpoint inherits follows from `@dynamicforms/vuetify-inputs` 0.8.1, which this release requires: props merge
  key by key, and columns or components come from the nearest smaller breakpoint that adds any. A breakpoint that
  adds none used to render an empty row or column; assigning an empty list is now the way to state that.
- A `Column` given no width no longer serializes `cols: false`. `<v-col>` defaults `cols` to `false` on its own,
  while stating it kept the column from inheriting a width at any breakpoint. `toJSON()` output changes
  accordingly: `props` is `{}` where it used to be `{ cols: false }`.
- Row props are bound onto `<v-row>`. `dense`, `align`, `align-content` and `justify` were serialized and dropped.
- `noGutters` survives the row props filter, which whitelisted the key under the spelling `no-gutters` while
  the value was written under `noGutters`.
- `align-content` is validated against the alignments it accepts. `space-between`, `space-around` and `space-evenly`
  were checked against `align`'s values and discarded, both for the base key and its breakpoint variants.
- Enter and Esc reach only the actions a click could reach. A `defaultConfirm` / `defaultReject` action that is
  disabled, or hidden through its `visibility`, is no longer executed from the keyboard.
- `ModalData.resolve` closes the dialog it settles. It held the bare promise resolver, so calling it left the dialog
  on the stack and on screen.
- `modal.isInstalled()` counts mounted `<modal-view>` instances instead of holding a flag that any one of them
  cleared on unmount.
- `vuetify` is external to the bundle. Only its subpaths were, so the library shipped a copy of the display
  composable.
- The `<v-col>` breakpoint demo in the documentation writes `col.props.cols`, which is where a column's Vuetify props
  live; `col.cols` was read by nothing.
- The documented plugin registration passes `{ registerComponents: true }`, without which `<modal-view />` does not
  resolve, and the stylesheet import points at `@dynamicforms/vuetify-inputs/styles.css` — this package emits no CSS
  and exposes no such subpath.
- The repository, issue and documentation links point at `github.com/dynamicforms/vuetify-modal-form-kit`. The
  previous URLs resolved to no repository.
