# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.1] - 2026-08-16

### Fixed

- `<form-render>` renders a plain JSON layout, which its `layout` prop has always declared it takes. The prop
  wrapped anything that was not a `FormBuilder` in `new FormBuilder(json)`, which kept the plain objects, so the
  first `row.toJSON()` threw `TypeError: row.toJSON is not a function`. A `FormBuilder` and the JSON its
  `toJSON()` produces now render the same thing, breakpoints and all.
- `.nestedForm(inner)` renders. `<component-render>` consulted the component map before the nested-form branch,
  and the renderer registers itself in that map under `FormBuilderName`, so the map always won and the nested
  layout was spread onto `<form-render>` as attrs instead of reaching its `layout` prop. Nested forms inherit the
  `components` map and resolve their own breakpoints, at any depth.
- `<df-modal>` binds its `<v-dialog>` one way. `v-model` wrote to a computed that has no setter; the update now
  travels through `onModelValueUpdate`.
- `FormBuilder.toJSON()` on a form with no rows produces a layout `<form-render>` renders.
- A breakpoint that states nothing about its children serializes without the key. `Row.toJSON()` omits `columns`
  and `Column.toJSON()` omits `components` for such a breakpoint, and `FormBuilder.toJSON()` leaves the
  breakpoint out entirely. An empty list is how a breakpoint states that it has none, so emitting one where the
  breakpoint said nothing erased what the breakpoint inherits the moment the JSON was read back.
- `DialogSize.isDefined(size)` reports whether the value names a size. It was `true` for every string, because
  the check routed through `fromString()`, whose fallback `DEFAULT` is itself a member of the enum. `fromString()`
  is unchanged and still returns `defaultDialogSize` for anything it does not recognise: a size handed to a dialog
  that is about to render ignores invalid values, while a caller asking whether a string names a size gets the
  truth. `DEFAULT` has no string identifier, so `isDefined('default')` is `false`.
- `cols-<breakpoint>` is gone from `ColumnProps`, and `Column.toJSON()` drops the key. `<v-col>` names
  per-breakpoint widths `sm` / `md` / `lg` / `xl` / `xxl`, so `cols-md` only ever reached the DOM as an inert
  attribute; naming one is now a type error rather than a layout that silently ignores it. Per-breakpoint widths
  go through `Column.breakpoint(name, colCallback)`. `offset-<bp>` and `order-<bp>` camelize onto real `<v-col>`
  props and are untouched.

### Added

- `FormBuilder.fromJSON()`, `Row.fromJSON()`, `Column.fromJSON()` and `Component.fromJSON()` lift a serialized
  layout into instances, and leave one that is already an instance alone. `Row` and `Column` constructors take
  either their props or their JSON.
- `modal.yesNo()`, `modal.message()` and `modal.custom()` warn when no `<modal-view>` is mounted by the end of
  the tick. The dialog goes onto the stack with nothing rendering it, so no action can resolve it and the
  returned promise settles only through its own `.close(value)`. A dialog opened before a sibling `<modal-view>`
  mounts is supported and does not warn.

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
