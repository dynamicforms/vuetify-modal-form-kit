# gaps

Open items found while migrating to `@dynamicforms/vue-forms` 0.6.0 / `@dynamicforms/vuetify-inputs` 0.8.0. Each
one is reproduced against the working tree; none is fixed, because each needs a decision that is yours to make.

Legend: **[V]** reproduced with an executed test · **[R]** read from the code, not executed.

---

## Blockers for the documented feature set

**[V] `<form-render>` cannot render a plain JSON layout, which is half of what it is documented to take.**

`src/layout/form-render.vue:35` accepts `FormBuilder | FormJSONResponsive` and wraps anything that is not a
`FormBuilder` in `new FormBuilder(json)`. `FormBuilder.cleanBreakpoint` (`src/core/form-layout/form-builder.ts:99`)
assigns `result.rows = bp.rows` and keeps the plain objects, so the first `toJSON()` hits
`TypeError: row.toJSON is not a function`. Reproduced by mounting `<form-render :layout="builder.toJSON()" />`.

Fixing it means hydrating JSON into `Row` / `Column` / `Component` instances, and the decision is where that lives:
a `FormBuilder.fromJSON()` static, a constructor overload on each of the three classes (their constructors take
props only today — `Row(props)`, `Column(props)`), or a hydration pass inside `cleanBreakpoint`. Roughly 40–60
lines plus tests, whichever way it goes.

**[V] Nested forms do not render, and would take the same JSON path once they did.**

`src/layout/component-render.vue:3-9` orders its branches `resolvedComponent` → `isFormBuilder` → string name, but
`form-render.vue:44` injects `[FormBuilderName]: getCurrentInstance()?.type` into the components map, so
`resolvedComponent` is truthy for a nested form and the first branch always wins. `<form-render>` is then rendered
with `v-bind="{rows: [...]}"` and no `layout` prop. Mounting a layout built with `.nestedForm(inner)` throws
`TypeError: Cannot convert undefined or null to object`.

Reordering the branches is three lines, but the nested layout arrives as plain JSON (`Component.toJSON()`
serializes it), so it lands on the item above. The two are one fix.

Until they are fixed, `docs/api/form-builder.md` documents `nestedForm(form)` and a JSON `layout` prop that do not
work.

---

## Behaviour decisions

**[V] `DialogSize.isDefined()` accepts every string.**

`src/modal/dialog-size.ts:27` runs an unknown string through `fromString()`, which falls back to
`defaultDialogSize` (`DEFAULT` = 0), and 0 is a member of the enum. `DialogSize.isDefined('THIS WILL NEVER BE A
SIZE')` is therefore `true`, and `src/modal/dialog-size.spec.ts:47` asserts exactly that — so the current
behaviour is either deliberate or was pinned by accident.

Either the guard should check membership in the identifier lists and the spec assertion flips to `false`, or the
function is doing what you meant and only its name misleads.

**[V] Every `modal.*` call adds an `ExecuteAction` to the caller's actions and nothing removes it.**

`src/modal/api.ts:118-125` registers a resolver on each action in `options.actions` and on each `Action` field of
`options.form`. Open the same dialog N times with the same `Action` instances — a module-level action, or a form
kept across openings — and N handlers accumulate, each capturing a settled promise and a dead dialog id. All of
them run on every click.

vue-forms has no `unregisterAction` (`grep -rn 'unregisterAction' ../vue-forms/src` finds nothing), so the options
are: add one there, clone the caller's actions per dialog, or keep the resolver in a map keyed by dialog id and
register a single dispatching handler once. The first is a change in the peer library, so it is worth deciding
before 1.0.

**[R] A column-level `cols-md` key cannot work, and the types offer it.**

`src/core/form-layout/types.ts:50` declares `cols-${breakpoint}` keys and `column.ts:139-146` whitelists them, but
Vuetify's `VCol` takes per-breakpoint widths as `sm` / `md` / `lg` / `xl` / `xxl` (`offset-*` and `order-*` do
camelize onto real props, so those work). A `cols-md` key is bound as an inert DOM attribute. Either map
`cols-<bp>` onto Vuetify's `<bp>` prop during serialization, or drop it from `ColumnProps` — the documentation now
tells readers to use `breakpoint(name, colCallback)` for per-breakpoint widths instead.

**[R] `modal.*` returns a promise that never settles when no `<modal-view>` is mounted.**

`ModalAPI.messageInternal` pushes onto the stack whether or not anything is rendering it, and `modal.isInstalled()`
is the only way to find out. A `console.warn` when `!installed.value` would turn a silent hang into a diagnosable
one; whether the library should warn, throw, or stay quiet is a taste call.

---

## Pre-existing, not touched

- `src/core/form-layout/component/vuetify-component-builder.ts` and `src/modal/df-api.component.vue` are the two
  files still at 0% statement coverage after this change. The component builder is pure and cheap to cover;
  `<modal-view>` needs a mount with a Vuetify plugin, which `src/modal/df-modal.component.spec.ts` now shows how to
  set up.
- `src/modal/df-modal.component.vue:131` binds `v-model="isShown"` to a computed with no setter. Nothing writes to
  it today because the dialog is `persistent`, but any `update:model-value` Vuetify emits would log a warning.
