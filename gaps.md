# gaps

Decisions that are yours. Each item is reproduced against the working tree and states the options with what each
one costs; the recommendation is a recommendation, and nothing here is implemented - with one exception, noted in
the version item, where the branch had to carry some number to be coherent.

---

## The public surface

**Is `<modal-view>` an implementation detail or an extension point?**

`currentModal` (`src/modal/api.ts:208-211`) and `ModalData` (`:25-31`) are exported from `src/modal/api.ts` and no
further: `src/modal/index.ts` re-exports `modal`, `CloseablePromise`, `FormActions` and `ModalOptions` alone. The
view is the only reader of both. It hard-codes the components it hands `<form-render>`
(`src/modal/df-api.component.vue:120-130`, nine `df-*` names imported from `@dynamicforms/vuetify-inputs`), and
`ModalOptions` (`src/modal/api.ts:17-23`) carries `form`, `size`, `actions`, `color` and `icon` and no
`components`. A component the application wrote, or one the peer adds after this release, reaches
`modal.custom()` only if the application registers it globally, because `<component-render>`'s `v-else` branch is
the one remaining route (`src/layout/component-render.vue:10`).

The decision is not "export more". It is which of the two the view is, because the answers differ in what has to
stay stable afterwards:

- *Implementation detail.* Export nothing further, and say in the readme that a dialog body beyond the nine
  built-in components is reached by registering the component globally. Costs nothing now; the global registry is
  a single namespace shared with the whole application, and a name collision is the consumer's problem.
- *Extension point.* Add `components?: Record<string | symbol, any>` to `ModalOptions`, merged over the view's own
  map. Small, additive, and it answers the common case (`modal.custom()` with an application component) without
  exporting `currentModal` or `ModalData` at all.
- *Replaceable view.* Export `currentModal` and `ModalData` so an application can write its own view. That makes
  the dialog record public API: `ModalData.resolve`, the symbol `dialogId` and the shape of `actions` all become
  things this library cannot change without a major version, and there is then more than one thing that may call
  `installedCount.value += 1`.

Recommended: the second. It is the only one of the three that costs a line of type and answers what callers
actually ask for, and it leaves both other doors open — the third can still be taken later, the first is what the
readme says until it is.

**Should `ModalOptions` carry `closable`, and what would the button resolve with?**

`<df-modal>` renders the header close button from its `closable` prop (`src/modal/df-modal.component.vue:33-42`,
documented in `docs/api/df-modal.md`'s prop table) and `<modal-view>` never passes it, so no `modal.*` dialog can
have one. The button calls `onModelValueUpdate(false)` (`:39`), which for an api-owned dialog — one with a
`dialogId` — takes it off the stack and settles nothing: `modalDefinitions[id]` stays and the caller's promise
never resolves. That is why the prop cannot simply be forwarded.

`CloseablePromise<string>` resolves with the key of the action that settled the dialog, so a button that is not an
action has no key of its own to answer with. The options:

- *Leave it as it is.* `closable` stays a template-dialog prop, `<df-modal>` documents it, and a `modal.*` caller
  who wants a close button passes `Action.closeAction()` in `options.actions`, which already works and already
  resolves with `'close'`.
- *Forward it and resolve with a reserved key.* `ModalOptions.closable` reaches the prop, and the button calls the
  dialog's `resolve`. The key has to be something (`'close'` is the obvious candidate) and it is then a string a
  caller can receive without having named an action, which the `CloseablePromise<string>` contract
  `docs/api/modal-service.md` states — the key of the action that closed the dialog — does not admit.
- *Forward it and reject.* The promise rejects, or resolves with `null` after `CloseablePromise<string | null>`.
  A rejection makes every existing `await modal.yesNo()` a potential throw; widening the type is a breaking change
  to every caller that assigns the result to a `string`.

Recommended: the first, and a sentence in `docs/api/modal-service.md` saying that a dismissable dialog is stated
by passing `Action.closeAction()`. The button is sugar; the reserved key is a hole in a contract that is otherwise
exactly "the key of the action that settled it".

**Can a dialog answer with a payload?**

`CloseablePromise<T> extends Promise<T>` (`src/modal/api.ts:12-15`) is only ever instantiated as
`CloseablePromise<string>`: every one of `yesNo`, `message` and `custom` declares that return type, and
`resolvePromise` is typed `(value: string) => void`. A caller who needs data out of a dialog — the edited record,
the row that was picked — reads it off the `Form.Group` it passed in, or off what its own executor returned from
`action.execute()`.

The options:

- *Leave it.* The form is the payload. A dialog that edits a group hands the group in and reads it back; that
  covers what the library is for, and the type stays a `string` a `switch` can read.
- *`modal.message<T>()` resolving `CloseablePromise<string | T>`.* Cheap in code and expensive to read: every
  caller has to narrow, and the key that settled the dialog is lost the moment a payload takes its place.
- *Resolve with a record.* `{ action: string; payload?: unknown }`. Honest and breaking: every existing caller
  comparing the result to `'yes'` changes.

Recommended: leave it, and state in `docs/api/modal-service.md` that the form is how data leaves a dialog. If a
payload is ever added, the third shape is the one to add, in a major version.

**Which name settles the dialog when an action is reachable under two?**

`src/modal/api.ts:151` resolves with `field.fieldName || name`: the element's own name inside the form wins over
the key the caller wrote in `options.actions`. `docs/api/modal-service.md` states that precedence — the field name
where the action is part of `options.form`, the key otherwise — so it is documented rather than accidental. A
caller who put the action under a key of their own choosing gets the form's name back, and nothing lets them ask
for the other one.

- *Leave it.* One rule, documented. A caller who needs their own key names their action to match.
- *Prefer the options key.* `resolvePromise(name)`. Symmetrically arbitrary, breaks anyone relying on the
  documented rule, and reads worse for the common case where the action is a form member and `options.actions` was
  never given.
- *Let the caller choose.* A `resolveWith?: 'field' | 'key'` on `ModalOptions`, defaulting to `'field'`. Additive
  and small; it is also a knob on a question most callers never meet, because most actions are reachable under one
  name only.

Recommended: leave it. It is the only item in this file where the current behaviour is already written down as a
rule; adding the knob is worth doing only if a real caller asks.

**`Row.simple()` and `Column.simple()` return `T`, `FormBuilder.simple()` returns `SimpleProxy<T>`.**

`src/core/form-layout/form-builder.ts:37` declares `simple<T>(cols: TwelveDivisible = 1): SimpleProxy<T>`, where
`SimpleProxy<T> = T & { simple: (cols?: TwelveDivisible) => SimpleProxy<T> }` (`:14-16`), and the proxy answers a
`simple` key before anything else (`:43-45`), so `form.simple(2).dfInput(...).simple(1).dfInput(...)` restarts the
column count mid-chain. `src/core/form-layout/row.ts:41` declares `simple<T>(cols: TwelveDivisible = 1): T` and
`src/core/form-layout/column.ts:53` declares `simple<T>(): T`: neither chains, and the column's takes no count
because a column holds components rather than columns. All three are public; the readme's builder section shows
the form's alone.

- *Leave it.* The asymmetry is real but not wrong: a row's proxy adding columns has nothing to restart, and a
  column's has no count to take. It costs a reader the surprise of trying `.simple()` on a row's proxy and getting
  a component-adding function named `simple` instead.
- *Give all three `SimpleProxy`.* `Row.simple()` chains to a new column count, `Column.simple()` to nothing
  meaningful. Uniform signature, and `Column`'s `simple` key would have to answer something for a call that means
  nothing.
- *Document the difference.* A sentence in the readme's builder section and on all three docstrings: the form's
  proxy restarts, the row's and the column's do not.

Recommended: the third. The signatures are load-bearing exactly once — when someone tries the chained call on a
row — and the fix for that is a sentence, not a type.

---

## The dialog stack

**Two `<modal-view>` instances both draw the dialog.**

`src/modal/df-api.component.vue:132-137` warns on mounting a second view and mounts it anyway; both render
`currentModal`, so one dialog is on screen twice, over two `<v-dialog>` overlays with two z-indices.
`src/modal/df-api.component.spec.ts` pins that behaviour in `draws the dialog once per mounted view`, so whichever
way this goes, that spec changes with it.

- *Warn and draw once.* The second view renders nothing: `installedCount` decides, and only the first-mounted view
  draws. The application keeps working, which is the point — a stray second `<modal-view>` in a layout component
  is a mistake that costs a doubled dialog, not a crash. Ordering is the cost: "first mounted" is what the count
  makes available, and a view that unmounts hands the drawing to whichever other view is still up.
- *Throw.* `onMounted` throws instead of warning. Unambiguous, found immediately, and it turns a cosmetic bug in
  someone's app into a white screen — including where two views exist only because a route transition is in
  flight and one of them has yet to unmount.
- *Leave the warning.* Nothing changes; the spec stays as written.

Recommended: the first. The doubled dialog is the symptom the warning already announces, and rendering nothing is
what the warning's text implies has happened. The transition case is the reason not to throw.

**`installedCount`, `modalDefinitions` and `dialogTracker` are module state.**

`modalDefinitions` and `installedCount` are module-level in `src/modal/api.ts:33-36`, and `dialogTracker` is a
module-level `new DialogTracker()` in `src/modal/top-modal-tracker.ts:26`. Two Vue apps on one page therefore
share one dialog stack: a dialog opened from app A is drawn by app B's `<modal-view>` if that is the one mounted,
with app A's components resolved against app B's global registry. Under SSR the same three live for the process,
so a dialog opened during one request is on the stack for the next.

- *Leave it.* This is a browser-side dialog library; a second Vue app on one page is rare and SSR of a modal
  system is rarer. It costs nothing today and is a wrong answer that is very hard to debug on the day it happens.
- *Per-app state through `provide`/`inject`.* The plugin's `install()` creates the tracker and the definitions map
  and provides them; `<modal-view>` and `<df-modal>` inject. Correct, and it makes `modal` no longer importable as
  a module singleton — `modal.yesNo()` from a plain `.ts` file with no component context is the API's whole
  ergonomic advantage, and it would need an explicit app handle or a "current app" lookup.
- *Reset hook.* Export something an SSR request handler calls between requests. Cheap, and it addresses the SSR
  half only, by asking the consumer to remember.

Recommended: leave it, and state the constraint in the readme's requirements section — one Vue app, browser only.
The second option costs the API its shape, and there is no evidence anyone is paying for the current one.

---

## The generated layout

**The generated layout renders every `Field` as `<df-input>`.**

`src/modal/df-api.component.vue:100-109` calls `builder.dfInput({ label, control: field })` for every
`Form.Field`, whatever the field holds: a boolean gets a text input, a field with a `choices` list gets no
`<df-select>`, a date gets no picker. Everything else the element carries reaches the component on its own,
through `control`.

- *Leave it, documented.* The generated layout is a convenience for a form of plain scalars, and anything else is
  the documented reason to pass a `FormBuilder` of your own — which is what the unrendered-member warning at
  `:76-85` already points at.
- *Choose the component from the field.* A field with choices becomes `<df-select>`, a boolean `<df-checkbox>`, a
  date `<df-date-time>`. It is what a caller expects, and it makes this library's dialog the place where the
  field-to-component mapping lives — a mapping that belongs to `@dynamicforms/vuetify-inputs`, which will grow
  components this map does not know about.
- *Let the field state it.* Read `field.extra.component` (or the like) and fall back to `dfInput`. The caller
  states the component once, next to the field, and the library holds no mapping table.

Recommended: the third, if anything. It is the only one that does not put a peer's component catalogue into this
repository, and it composes with the first: a form that states nothing still gets `<df-input>` per field.

**A nested `Group` or `List` on `options.form`.**

`src/modal/df-api.component.vue:112` collects any member that is neither an `Action` nor a `Field` into
`unrendered`, and `warnUnrendered` (`:76-85`) says once per form that those members are not on screen while still
validating and still counted by `form.valid`. The warning names the members and points at passing a `FormBuilder`
of your own; it does not answer whether the generated layout ought to lay them out.

- *Leave it, and keep the warning.* A nested group is a layout question — columns, order, whether the group gets
  a card of its own — and a generated answer would be wrong about as often as it was right. The warning already
  states the consequence a caller has to know about (`form.valid` counts what is not on screen).
- *Lay out a `Group` recursively.* One row per member, nested. Answers the easy half; a `List` has no answer at
  all without a row template, so the warning stays for lists and the rule becomes harder to state than it is now.
- *Refuse.* Throw instead of warning. It is a real programming error to hand a dialog a form whose members it will
  not draw — but it also breaks a form that carries a group used elsewhere and irrelevant here.

Recommended: the first. It is the documented state today, and this is the point of the `FormBuilder`.

---

## Release

**There is no release workflow.**

`.github/workflows/` holds `ci.yml` alone, with the jobs `build`, `peer-range`, `vue-floor` and `node-floor`. The
version bump, the tag and `npm publish` are hand-made, and nothing checks that `changelog.md` names the version in
`package.json` — the file is in the tarball (`package.json:8-11`), so a stale changelog ships.

- *A guard in CI.* One step that reads `package.json`'s version and greps `changelog.md` for a `## [x.y.z]`
  heading. A few lines, catches the failure that actually happens, and leaves publishing by hand.
- *A tag-triggered release workflow.* `on: push: tags: v*` → build → the changelog guard → `npm publish` with
  `--provenance`, using an npm token in repository secrets. Removes the hand-made step and the risk of publishing
  an unbuilt tree; costs a token in the repository and a decision about who may push a tag.
- *Leave it.* Nothing changes.

Recommended: both halves of the first two, in that order — add the changelog guard to `ci.yml` now, and the
tag-triggered publish when the token exists. The guard is useful whether or not the publish is ever automated.

**What version does this sweep carry?**

`package.json:4` is `0.7.0`, published 2026-08-20. What is on this branch and unreleased: four fixes — an
api-owned dialog surviving the unmount of `<modal-view>`, an Escape a non-persistent overlay consumes not also
rejecting the dialog, `simple()` answering `undefined` for a runtime probe, `hasOwnAction()` counting only an
action `<df-actions>` draws — a set of new tests, and four added exports, `DfModalProps` and `DfModalSlots` from
`src/modal/index.ts` and `FormRenderProps` and `ComponentRenderProps` from `src/layout/index.ts`. Nothing is
renamed or removed. `ComponentJSON.props` is `T | null`, a declared type widened to what `Component.toJSON()`
emits; a consumer reading `props.foo` off it has to narrow.

Under semver, added exports are a minor. This repository's own 0.6.1 shipped an `### Added` section in a patch
(`changelog.md`, `## [0.6.1] - 2026-08-16`), so the precedent for a patch with additions exists here.

- *0.7.1.* Matches the 0.6.1 precedent. The `ComponentJSON.props` narrowing is the one thing a consumer could
  meet, and only one with `strict` reading a serialized component's props directly.
- *0.8.0.* What semver says: four new exports. Costs nothing, and a consumer's `^0.7.0` admits 0.7.1 and not
  0.8.0, so the added surface is something they opt into rather than receive.

Recommended: 0.8.0. Four added exports are a change to the public surface and should read as one in the version
number; the 0.6.1 precedent makes a patch defensible, not right.

The branch carries `## [0.7.1] - 2026-08-21` in `changelog.md`, because it had to name something to be readable.
Taking 0.8.0 means renaming that heading and setting `package.json`, which is still at the published 0.7.0
either way.
