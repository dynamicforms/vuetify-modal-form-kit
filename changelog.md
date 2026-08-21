# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.2] - 2026-08-21

### Added

- `ModalOptions.components` states components the dialog body may name, over the nine `df-*` ones `<modal-view>`
  supplies. A component the application wrote reaches `modal.custom()` and a `FormBuilder` layout without being
  registered globally, and a built-in name given here is replaced for that dialog alone.
- `CloseablePromise.payload` carries what the executor of the action that settled the dialog returned. The promise
  goes on resolving with the action's key, which stays a `string` a `switch` reads; the payload is read off the
  promise after awaiting it. A dialog closed through `close(value)`, or settled by an action that produced
  nothing, carries none.
- `<df-modal>` draws the header close button for the action Escape reaches, without being asked: a click on it
  runs that action, so a dialog opened through the `modal` service settles with the action's own key rather than
  leaving the screen under its caller. `closable` states the answer where the caller wants one whatever the
  actions say, and a dialog that states no reject action falls back to emitting `update:model-value(false)` as
  before.

### Changed

- One `<modal-view>` draws the dialog stack. A second mounted view warns, as it did, and now renders nothing
  rather than drawing the same dialog over a second overlay; it takes the drawing over if the view that had it
  unmounts, so a route transition with both briefly mounted shows one dialog throughout.
- `closable` defaults to deriving its answer from the actions rather than to `false`, so a dialog that states a
  `defaultReject` action carries a close button where it did not. Pass `closable: false` for one that must be
  answered through its buttons.

### Fixed

- The `modal` service carries `options.components` onto the dialog it records, so what the caller states reaches
  the view that draws it.

## [0.7.1] - 2026-08-21

### Added

- `DfModalProps`, `DfModalSlots`, `FormRenderProps` and `ComponentRenderProps` are top-level exports. All four were
  declared in `dist/index.d.ts`, where the components' own declarations refer to them, and exported from nothing, so
  a component wrapping `<df-modal>`, `<form-render>` or `<component-render>` had no name for the props it forwards.
- CI type-checks `dist/index.d.ts` against the lowest `vue` the declared peer range admits, and builds the package and
  loads the built artifact on the node floor `engines.node` states. The declarations name Vue's own types, whose
  arity moves between Vue patch releases, so what the tarball ships can need a newer Vue than the range promises
  without a single source file saying so.
- `changelog.md` ships in the tarball, alongside `dist`, the readme and the licence.

### Fixed

- An Escape that a non-persistent overlay above the dialog consumes does not also reject the dialog. Vuetify's
  `VOverlay` closes a `<df-select>` menu or a `<df-date-time>` picker from a `window` keydown listener of its own and
  never calls `preventDefault()`, so the one keystroke closed the menu and rejected the dialog behind it. The dialog's
  overlay root carries a `df-modal` class, and Enter and Escape reach an action only while an overlay of the dialog's
  own holds the highest z-index in `.v-overlay-container` - the reach a click has.
- Unmounting the `<modal-view>` a dialog is drawn in leaves that dialog on the stack, and a `<modal-view>` mounted
  afterwards shows it, still settling the promise its caller holds. `<df-modal>` owns the stack entry of a template
  dialog alone - one it was given no `dialogId` for - which is the rule it already applied when its `model-value`
  changed; on unmount it removed the entry whoever owned it, so an api-owned dialog left the stack while its
  definition and its unsettled promise stayed behind and nothing could reach it again.
- A dialog opens with a button that can settle it where every action the caller states is at `DisplayMode.SUPPRESS`.
  `<df-actions>` draws no button for a suppressed action, so such a dialog reached the screen with nothing on it and
  no keyboard route out of it. The default `close`, or `yes` / `no`, is stated where nothing the caller passed in
  `options.actions` or declared on `options.form` is drawn. The read is the one the actions carry as the dialog
  opens: an action raised to `FULL` or dropped to `SUPPRESS` afterwards neither removes the dialog's own buttons nor
  adds them.
- `FormBuilder.simple()`, `Row.simple()` and `Column.simple()` answer `undefined` for a key a runtime probes a value
  with - every symbol, plus `then`, `toString`, `valueOf` and `toJSON` - where they answered a component-adding
  function for every key. Returning a layout built through `simple()` out of an `async` function awaited it, which
  reads `then`: that opened a row and a column and called `then` on the component builder, which declares no such
  method, so the `await` threw `TypeError: cmpt[prop] is not a function` over builder methods the caller never
  called. `JSON.stringify()` of the proxy and a console inspection of it built the same phantom row.
- `ComponentJSON.props` is `T | null`, which is what `Component.toJSON()` emits for a component carrying no props.
  The serialized output is unchanged; TypeScript code reading a prop off a serialized component narrows the `null`.
- The readme, the getting-started guide and the migration guide state what a CommonJS consumer needs. Node supports
  `require()` of an ES module from 22.12, which `engines.node` states, but this package imports Vuetify's component
  entries - directly and through `@dynamicforms/vuetify-inputs` - and each of those imports its own stylesheet: the
  path runs through a bundler that answers for `.css`, not through plain node.
## [0.7.0] - 2026-08-20

### Changed (breaking)

- The peer dependencies move to `@dynamicforms/vue-forms` `^0.17.0`, `@dynamicforms/vuetify-inputs` `^0.9.1` and `vue`
  `^3.5.2`, and `engines.node` is `>=22.12`. `lodash-es` moves to `^4.17.21`: 4.17.12, which the declared range
  admitted, throws `ReferenceError: root is not defined` out of `_createRound.js` the moment anything imports it.
  The first three go together: vuetify-inputs requires vue-forms 0.17.0, and the vue and node floors are
  what those two libraries themselves demand. Nothing this library exports was renamed or
  removed; the work is in the consuming application's own use of the peers, which
  [the migration guide](/guide/migration) points at.
- The package is ESM-only. The UMD artifact, the `main` field, the `require` export condition and `dist/index.d.cts`
  are gone, and with the UMD the `window` global it defined, for which there is no replacement. Neither entry point it
  named could be loaded. Loaded through `require()` it requires `@dynamicforms/vue-forms`, and that package has shipped
  no CommonJS build since its 0.12.0. The script-tag path put the library at
  `window['dynamicforms-vuetify-modal-form-kit']['[name]']`, because `lib.name` was written with a `[name]` placeholder
  that nothing interpolates, and read every peer off a global none of them defines. A CommonJS consumer reaches the ESM
  build through `require()` of an ES module, which node supports from 22.12. A TypeScript consumer that emits CommonJS
  needs `moduleResolution: nodenext` on TypeScript 5.8 or later, which is where `require()` of an ES module is typed;
  `node16` reports `TS1479`, which is what `dist/index.d.cts` answered. `build.target` is `es2022`.
- `FormActions` and `<df-modal>`'s `actions` prop are `@dynamicforms/vue-forms`' `Action`, where they were the
  subclass `@dynamicforms/vuetify-inputs` exports. Both widen, so nothing that compiled stops compiling. What the
  dialog reads off an action is its value - `defaultConfirm` and `defaultReject` are members of `ActionRenderOptions`,
  which is where `<df-actions>` reads them too - so the subclass is what an action needs in order to render
  responsively, not what it needs to be a dialog button. Code that read `action.defaultConfirm` through the subclass
  accessor reads `(action.value as ActionRenderOptions).defaultConfirm`. This needs
  `@dynamicforms/vuetify-inputs` `^0.9.1`, which is where `<df-actions>` draws an action of either class; against
  0.9.0 it threw `TypeError: action.getBreakpointValue is not a function` as it drew the buttons.

### Added

- `<modal-view>` warns, once per form, about a member of the form it has no layout for. The layout it generates is one
  `<df-input>` per `Field`; a nested `Group` or `List` is not on screen, while still validating and still counted by
  `form.valid`. The warning names the members and points at passing a `FormBuilder` layout of your own.
- `scripts/verify-artifact.mjs`, which CI runs after the build. It imports the built ESM artifact, asserts the export
  list and the members of the `FormLayout` namespace, and exercises the fluent builder, a breakpoint and the JSON round
  trip. The specs import `src/`, so this is the only thing that loads what the package publishes.
- A `prepack` script that builds the package, so `npm pack` and `npm publish` ship what the current source compiles to.

### Fixed

- Executing an action settles the dialog it was opened into and no other. A registration belongs to an element's
  declaration, so one action chain serves every binding of that element and every dialog opened over one: the resolver
  answers only for the element it was registered on, and only while its own dialog is the one on screen. Two dialogs
  opened over two bindings of a single form each settle on their own.
- Nothing accumulates on the caller's actions. The resolver is dropped with `unregisterAction()` when the dialog
  settles. Opening N dialogs over the same `Action` instance - a module-level action, or a form kept across openings -
  used to leave N handlers registered on it, each holding a settled promise and a dead dialog id, and all of them ran
  on every later click.
- `await action.execute()` answers what the action's own chain returned. The resolver awaited the chain and returned
  nothing, so an executor's return value never reached the caller.
- An `AbortEventHandlingException` is an answer. `execute()` resolves with the exception rather than rejecting on it,
  the run ends, and the dialog stays open - an action that refuses to settle the dialog states so by aborting.
- A failing keyboard shortcut reaches `app.config.errorHandler`, with `df-modal keyboard shortcut` as its context.
  `execute()` is asynchronous and the Enter/Esc listener is on the document, so nothing wraps it the way Vue wraps a
  template handler and a rejecting handler surfaced as an unhandled rejection.
- Enter and Esc reach an action that is enabled all the way up, not one that merely carries `enabled` itself.
  Reachability reads `effectiveEnabled`, which is false where the action or any container above it is disabled.
  `<df-actions>` disables the button on the same read from `@dynamicforms/vuetify-inputs` 0.9.1, so a click and a
  keystroke reach the same set.
- A held Enter starts one run. `onKeydown` returns on a repeat event, and an action that is still running is
  unreachable while `busy`, so the second keystroke no longer starts a second run of a handler that has yet to settle.
- The generated layout keeps a label the element carries. `@dynamicforms/vuetify-inputs` 0.9.0 declares `label` on
  vue-forms' `Extras`, and a prop wins over what the element carries, so a generated `label` prop would override the
  one the caller declared on the field. The name-derived label is stated only for a field that carries none.
- A form member at `DisplayMode.SUPPRESS` is left out of the generated layout. It rendered nothing while still taking
  a row and a column of its own, which reached the screen as an empty gutter gap.
- `<component-render>` resolves the nested-form renderer in a `computed`. It read the `components` map once during
  setup, so a map that gains the renderer afterwards left the nested form rendering `undefined`.

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
