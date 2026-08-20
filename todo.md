# Todo

## API surface

- `currentModal` and `ModalData` are module-internal, so `<modal-view>` cannot be replaced. It hardcodes the nine
  `df-*` components it hands `<form-render>`, and `ModalOptions` carries no `components` of its own: a component the
  application wrote, or one the peer adds, is unreachable from `modal.custom()` unless it is registered globally.
  Decide whether the view is an implementation detail or an extension point, then export what that answer needs.
- `<df-modal closable>` renders the header close button and `<modal-view>` never passes the prop, so no `modal.*`
  dialog can carry one. The button calls `onModelValueUpdate(false)`, which takes an api-owned dialog off the stack
  without settling its promise; it has to resolve the dialog before `ModalOptions` can carry `closable`.
- `FormRenderProps`, `ComponentRenderProps` and `<df-modal>`'s `Props` and `Slots` are declared in `dist/index.d.ts`
  and exported from nothing. The readme states the export list is the whole surface, and a consumer wrapping any of
  the three components cannot name the props type it forwards.
- Every dialog answers `CloseablePromise<string>` — the key of the action that settled it. A dialog cannot answer
  with a payload; the only route out for data is what the caller's own executor returns from `action.execute()`.
- `resolvePromise(field.fieldName || name)` prefers the element's own name over the key in `options.actions`, so one
  `Action` reachable under two names settles with the form's. `/api/modal-service` states that precedence; nothing
  lets a caller ask for the other name.
- `hasRenderableAction()` counts an `Action` `<df-actions>` can draw, not one it will draw. A caller whose actions
  are all at `DisplayMode.SUPPRESS` suppresses the dialog's default buttons, `<df-actions>` filters those actions
  out, and the dialog opens with no button and no keyboard route to settle it.

## The dialog stack

- `src/modal/df-modal.component.vue:190` removes the dialog from the tracker on unmount. Unmounting `<modal-view>`
  with a dialog on screen drops that dialog off the stack, leaves its `modalDefinitions` entry in place and never
  settles its promise: a `<modal-view>` mounted afterwards shows nothing, and only `promise.close(value)` still
  reaches it. Either settle the open dialogs when the last view unmounts, or refuse the removal for an api-owned
  dialog.
- Two `<modal-view>` instances both render `currentModal`, so one dialog is on screen twice.
  `src/modal/df-api.component.vue:134` warns and mounts anyway. Design goal 2 does not hold for that case — make
  the second view render nothing, or make the warning a throw.
- `installedCount`, `modalDefinitions` and `dialogTracker` are module state. Two Vue apps on one page share one
  dialog stack, and under SSR the state carries between requests.

## Keyboard shortcuts

- Vuetify's `VOverlay` closes on Escape without calling `preventDefault()`, and `onKeydown` skips only an event that
  is already `defaultPrevented`. One Escape while a `<df-select>` menu or a `<df-date-time>` picker is open inside
  the dialog closes the overlay and rejects the dialog underneath it. Enter has the same shape wherever the overlay
  does not consume it.
- `isReachable` requires `DisplayMode.FULL`, while `<df-actions>` renders `HIDDEN` as `d-none` and `INVISIBLE` as
  `visibility: hidden`. The two happen to agree on what a click can reach; nothing states that they must.
  `df-modal.component.spec.ts` asserts the keyboard skips a `HIDDEN` action and `<df-actions>`' own spec asserts the
  classes it renders for `HIDDEN` and `INVISIBLE`; no test asserts the keyboard against `INVISIBLE`, and none ties
  the two halves together.

## Blocked on the peers

- `<df-actions>` disables a button on `action.enabled` (`vuetify-inputs/src/df-actions.vue:15`) where the keyboard
  reads `effectiveEnabled`. An action inside a disabled container is clickable and unreachable by Enter. The peer is
  to follow; until it does, a click and a keystroke disagree.
- `<df-actions>` reads no `busy`, so a second click starts a second run of a handler that has yet to settle, where a
  held Enter starts one. vuetify-inputs' own migration guide states `:disabled="!save.enabled || save.busy"` as the
  pattern its buttons do not use.
- A dialog button has to be vuetify-inputs' `Action`, because `<df-actions>` resolves every button through
  `getBreakpointValue()`, which only that class declares. `api.ts` warns and leaves a bare vue-forms `Action` out of
  the rendered set; `<df-actions>` falling back to the unresolved value would remove the distinction.
- `<modal-view>`'s component map grows with the peer. `df-list` is on vuetify-inputs' own list, and a dialog cannot
  render one until the map names it.

## The layout builder

- `FormBase.simple()` returns a `Proxy` whose `get` answers a mutating function for every key, symbols included.
  Returning one from an `async` function calls `then` on it: the proxy opens a row and a column and calls `then` on
  the component builder, which declares no such method, so the await rejects with `TypeError: cmpt[prop] is not a
  function` and the layout is left holding an empty row. Answer `undefined` for `then` and for the well-known
  symbols.
- `Row.simple()` and `Column.simple()` return `T` where `FormBuilder.simple()` returns `SimpleProxy<T>`, so a second
  `.simple()` is available on the form and not on the row, and `Column.simple()` takes no column count. All three
  are public; only the form's is in the readme.
- The docstrings on all three show `new FormBuilder().simple.generic(...)` and `row.simple.generic(...)`. `simple`
  is a method taking the column count, and the property read they show builds nothing.
- `Component.toJSON()` emits `props: null` for a component that has none, while `ComponentJSON.props` is typed `T`.
  `fromJSON()` turns it back into `undefined`, so the round trip holds and the declared type does not.
- The generated layout renders every `Field` as `<df-input>` whatever it holds: a boolean gets a text input, a field
  with choices gets no `<df-select>`. It reads `field.extra.label`; the rest of what an element carries reaches the
  component on its own.

## Packaging and release

- `package-lock.json` is gitignored while CI runs `npm install`, so no job resolves the tree a developer resolved
  and `npm ci` cannot run at all. Commit the lockfile and switch both matrix legs.
- No job type-checks `dist/index.d.ts` against the declared Vue floor. The floor is real: `<df-modal>`'s own
  component type, `ModalView`, `FormRender` and `ComponentRender` are emitted as `DefineComponent` with 20 type
  arguments, and the type takes 19 through Vue 3.5.1, so a consumer below 3.5.2 with `skipLibCheck: false` gets
  TS2707. `@dynamicforms/vue-forms` has the `vue-floor` job to copy.
- Nothing runs at the declared floor. `engines.node` is `>=22.12` and the readme promises a CommonJS consumer
  `require()` of the ESM build there; the matrix is `lts/*` and `latest`, both far above it, and
  `npm run verify:artifact` imports rather than requires. A matrix leg at 22.12 that `require()`s the artifact is
  what would state the promise.
- There is no release workflow: the version bump, the tag and the publish are hand-made, and nothing checks that
  `changelog.md` names the version being published.
- `files: ["dist/*"]` leaves `changelog.md` out of the tarball.

## Documentation

- `<form-render>` and `<component-render>` are documented inside `/api/form-builder` - a prop table for
  `<FormRender>`, a paragraph for `<ComponentRender>` - and the `/api/` index names neither, so a reader looking for
  a rendering component finds it only by reading the FormBuilder page to its end.
- `<component-render>`'s paragraph states what it is - a single component of a layout, exported for building a
  renderer of your own - and carries no prop table: `name`, `props` and `components` are named nowhere a consumer
  can look them up.

## Tests

- `src/layout/component-render.vue` has no spec; every assertion on it arrives through `form-render.spec.ts`.
  Unasserted: a `symbol` component name falling back to `description` and then to `'SymbolComponent'`; the `v-else`
  branch resolving a name against globally registered components; `FormBuilderBodyProp` reaching the default slot;
  and the reason `FormRenderer` is a `computed` at all — a `components` map that gains the renderer after setup.
- `df-modal.component.vue`: the four explicit widths (400 / 600 / 800 / 1140) are asserted by nothing. No spec
  passes `size`, so every mount runs at `DialogSize.DEFAULT`, where `fullScreen` is false and `width` falls to
  `'unset'` through the default branch, and the `VDialog` stub declares `modelValue` alone, so neither prop reaches
  the DOM. `closable` is never rendered, so the header close button and the `onModelValueUpdate(false)` it calls
  are unexercised.
- `df-api.component.vue:102`: a member at `DisplayMode.SUPPRESS` is left out of the generated layout, and no spec
  covers it, while the `Group` warning beside it has one.
- `row.ts:131-141` and `column.ts:153-163`, plus `alignSelf` at `column.ts:183`: no spec sets `class`, `style` or
  `alignSelf` on a row or a column, at the base or at a breakpoint. All three are declared in `RowProps` /
  `ColumnProps` and validated by code nothing reaches, so a filter that drops a valid value goes unnoticed.
- `df-api.component.spec.ts:26` mounts two `<modal-view>` instances and asserts the warning and the install count,
  never with a dialog on screen, so the doubled rendering is unasserted. Nothing unmounts a view with a dialog open.
  Those are the two cases where design goal 2 does not hold.

## Decisions for the owner

- The `enabled` divergence: `<df-actions>` reads `enabled`, `<df-modal>`'s keyboard reads `effectiveEnabled`. Is it
  settled in `@dynamicforms/vuetify-inputs`, or reverted here until the peer follows?
- A nested `Group` or `List` on `options.form`: laid out by the generated layout, or left as the documented reason
  to write a `FormBuilder` of your own? The warning names the members; it does not answer the question.

## What 1.0 requires

The rest of this file is worth doing. This is the part that has to be true before the version number stops being a
disclaimer.

1. Design goal 2 holds, or the readme states what the code does: the `<modal-view>` unmount leak and the two-view
   duplication.
2. One Escape does one thing. A keystroke that closes an overlay does not also reject the dialog behind it.
3. `simple()` answers `undefined` for `then`, so a layout returned from an `async` function arrives instead of
   rejecting with a `TypeError`.
4. The public surface is closed and its questions answered: whether `<modal-view>` is replaceable, whether
   `closable` reaches the `modal.*` API, and the props types a consumer forwards.
5. The peers agree with the keyboard on `enabled` and `busy`, or the divergence is stated where a reader meets it.
6. CI resolves what a developer resolved — `npm ci` over a committed lockfile — and proves the declared Vue floor.
7. `<form-render>` and `<component-render>` are reachable from `/api/`, and `<component-render>`'s props are stated.
8. The contract tests exist: the row and column prop filters, `<component-render>` on its own, the four dialog
   widths, and the two dialog-stack cases.
