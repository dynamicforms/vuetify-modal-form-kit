# Migration guide

Every breaking release has its own section below, newest first. If you are crossing several releases at once,
work from the bottom of the page upwards.

This is the only page that names superseded APIs; everywhere else in this documentation only the current one
exists.

<!-- New releases go directly below this comment, above the previous one, as `## Upgrading to vX.Y.Z (from vA.B.x)`. -->

## Upgrading to v0.7.0 (from v0.6.x)

Both peers move at once — eleven releases of `@dynamicforms/vue-forms`, one of `@dynamicforms/vuetify-inputs` — and
the package becomes ESM-only. Nothing this library exports is renamed or removed, so most projects compile
untouched; the work is in your own use of the two peers, plus six points on this library's own surface, three of
which are about the actions that settle a dialog. There is a [checklist](#checklist-for-0-7-0) at the end of this
section.

### The peer ranges and the node floor

| Peer | Before | Now |
|---|---|---|
| `@dynamicforms/vue-forms` | `^0.6.0` | `^0.17.0` |
| `@dynamicforms/vuetify-inputs` | `^0.8.1` | `^0.9.1` |
| `vue` | `^3.4` | `^3.5.2` |

`lodash-es` moves to `^4.17.21`, and `engines.node` is `>=22.12`, where the package declared none. The old
`lodash-es` floor did not work: 4.17.12 throws `ReferenceError: root is not defined` as it loads. The vue floor is
vue-forms' own, which vuetify-inputs and this release both restate.

The two peers are one upgrade: vuetify-inputs 0.9.x requires vue-forms 0.17.0, and its 0.8.x line cannot be combined
with vue-forms 0.17.0. Installing them one at a time leaves npm reporting unsatisfiable peers.

```json
{
  "dependencies": {
    "@dynamicforms/vue-forms": "^0.17.0",
    "@dynamicforms/vuetify-inputs": "^0.9.1",
    "@dynamicforms/vuetify-modal-form-kit": "^0.7.0",
    "vue": "^3.5.2",
    "vuetify": "^3.9"
  }
}
```

### Your own use of the peers migrates at the same time

This library re-exports none of the peer API your application builds forms out of: every `Field`, `Group`, `List`,
`Action` and validator is vue-forms' or vuetify-inputs', and both cross a breaking range here. Work through
[the vue-forms migration guide](:vue-forms:/guide/migration.html), which is written for exactly this jump, and
[the vuetify-inputs migration guide](:vuetify-inputs:/guide/migration.html). The sections below cover only what
those two cannot know about, which is this package's own surface.

Four vue-forms breaks are worth searching for before you upgrade rather than after. The first three announce
nothing at all — no log, no throw — so the code keeps compiling and stops working; the fourth is a compile error:

- **`watch(element, cb)` no longer fires.** An element is no longer a Vue proxy of itself, so the deep traversal a
  reactive watch source starts stops immediately. Watch a getter over what you read: `watch(() => field.value, cb)`.
- **`readonly(element)` protects nothing.** It hands the element straight back, and a write through the result
  reaches the element. Hand out `element.value`, or a `computed` over it.
- **`isEqual` over two elements no longer compares their data.** It answered `true` for any two elements of the
  same class, and answers `false` now unless they are the same instance. Compare `a.value` with `b.value`.
- **`clone()` is `bind(data, overrides)`.** The data comes first: `f.clone({ value: x, label: 'Name' })` is
  `f.bind(x, { label: 'Name' })`. The type checker finds every call site.

Two changes reach dialog code in particular, both through the `Action` a dialog is handed. `Action.execute()` is
asynchronous from vue-forms 0.9.0 — `await` it or attach a `.catch()` outside a template — and vuetify-inputs 0.9.0
leaves `action.label` / `action.icon` as the peer base class's plain value, so a read that wanted the value filtered
by `showLabel` / `showIcon` is `action.renderedLabel` / `action.renderedIcon`.

### The package is ESM-only

There is one build and one entry point. `main`, the `require` export condition, the UMD artifact and the
`dist/index.d.cts` that went with them are gone, and `build.target` is `es2022`.

```typescript
// unchanged: an import resolves exactly as it did
import { modal, FormBuilder, ModalView } from '@dynamicforms/vuetify-modal-form-kit';
```

A CommonJS file reaches the same build through `require()` of an ES module, which node supports from 22.12 -
the floor `engines.node` states:

```javascript
const { modal } = require('@dynamicforms/vuetify-modal-form-kit');
```

What the `require` condition pointed at could not be loaded in any case. The UMD bundle resolves its peers with
`require()`, and `@dynamicforms/vue-forms` is ESM-only, so the first line of the bundle fails. The `<script>` tag
path was never there either: the build named the browser global `dynamicforms-vuetify-modal-form-kit.[name]`
literally, `[name]` included. Nothing replaces that global — load the ESM build through a bundler or a
`<script type="module">`.

### A dialog settles on the action of the form binding it was opened over

A registration belongs to an element's *declaration* in vue-forms 0.16 and later, so one chain serves every binding
of that element and every dialog opened over one. The resolver this library attaches states that: it settles the
dialog for the element it was registered on and for no sibling binding of it, only while its own dialog is the one
on screen, and it is removed with `unregisterAction()` when the dialog settles.

The visible consequences:

- **Repeated openings leave nothing behind.** A module-level `Action`, or a form kept across openings, ends each
  dialog with exactly the handlers it had before that dialog opened. Where an application built a fresh `Action`
  per opening, or cloned the form, to keep resolvers from stacking up, that work can go.
- **A sibling binding settles nothing.** The resolver answers for the element the dialog holds; executing another
  binding of the same declaration — a row of a `List` built from it, say — passes straight down the chain.
- **`await action.execute()` answers what the caller's own chain returned.** The resolver returns the chain's
  answer instead of ending on `undefined`.

```typescript
const save = new Action({ value: { label: 'Save' } });
save.registerAction(
  new Form.ExecuteAction(async (field, supr, ...params) => {
    await supr(field, ...params);
    return api.save(form.value);   // the record the backend answered with
  }),
);

const closed = modal.message('Edit', 'change what you need', { form, actions: { save } });
const record = await save.execute();   // the record; it was undefined
await closed;                          // 'save'
```

- **An `AbortEventHandlingException` is an answer, not a rejection.** A handler that raises one ends the run and
  leaves the dialog open, and `execute()` resolves with the exception. `execute()` answered `undefined` before,
  whatever the run did: it discarded the chain's answer, and the chain answered `null` for an abort and for a run
  that reached no handler alike, so a handler that refused to close the dialog could not report why.

```typescript
const save = new Action({ value: { label: 'Save' } });
save.registerAction(new Form.ExecuteAction(async (field, supr, ...params) => {
  if (!form.valid) throw new Form.AbortEventHandlingException('Fix the highlighted fields');
  return supr(field, ...params);
}));

const closed = modal.message('Edit', 'change what you need', { form, actions: { save } });
const answer = await save.execute();
if (answer instanceof Form.AbortEventHandlingException) showToast(answer.message);   // the dialog is still open
```

The dialog's own resolver is what answers with the exception, and it stands outside every handler registered before
the dialog opened. Register the aborting handler while the dialog is already open and it stands outside the resolver
instead: its abort reaches nothing that catches it, and `execute()` rejects.

### A dialog button is any vue-forms `Action`

`FormActions` and `<df-modal>`'s `actions` prop are typed `Form.Action`, where they were the `Action` that
`@dynamicforms/vuetify-inputs` exports. Both widen, so every action you already declare goes on compiling; what is
new is that an action of the peer library's base class is a dialog button too. `<df-actions>` draws a button from
the action's value, so the subclass is what an action needs in order to render responsively — as a text link, or
in a confirm / reject colour — not what it needs to be drawn at all.

This is what raises the `@dynamicforms/vuetify-inputs` floor to `^0.9.1`. Against 0.9.0 the button row resolved
every action through `getBreakpointValue()`, which only the subclass declares, and threw
`TypeError: getBreakpointValue is not a function` over anything else.

One read moves with it. `defaultConfirm` and `defaultReject` are members of `ActionRenderOptions` — the shape an
action's value takes — and the subclass exposed them as accessors as well:

```typescript
// before
if (action.defaultConfirm) …

// after: where <df-actions> and <df-modal>'s keyboard read them
import { ActionRenderOptions } from '@dynamicforms/vuetify-inputs';
if ((action.value as ActionRenderOptions).defaultConfirm) …
```

The accessors are still there on the subclass, so this is only needed where the action is held as a
`Form.Action` — which is what `FormActions` now hands you.

### Enter and Esc read `effectiveEnabled` and `busy`

The keyboard reaches an action that is rendered at `DisplayMode.FULL`, that is enabled all the way up, and that is
not already running.

```typescript
const buttons = new Form.Group({ save: new Action({ value: { label: 'Save', defaultConfirm: true } }) });
buttons.enabled = false;

buttons.fields.save.enabled;            // true - what was written to the action
buttons.fields.save.effectiveEnabled;   // false - and what Enter now asks
```

`effectiveEnabled` is `false` where the action or any container above it is disabled, so Enter and Esc no longer
execute an action inside a disabled group. `busy` is `true` from the call to `execute()` until the run settles,
which is what keeps a held-down Enter from starting a second run of a handler that has yet to finish; a repeated
`keydown` is dropped for the same reason.

`<df-actions>` disables its buttons on the same two reads from `@dynamicforms/vuetify-inputs` 0.9.1 — it draws a
button `loading` while its action is busy — so a click and a keystroke reach the same set of actions.

`execute()` is asynchronous, and a document listener gets no Vue wrapper around it. A handler that rejects is
routed to `app.config.errorHandler`, the way a rejection from a template handler is, and to `console.error` where
the application installs none.

### The generated dialog layout reads a field's own label

`modal.message()` and `modal.yesNo()` build a layout for the form they are given, one `<df-input>` per `Field`. The
label on that input is the field's own where it carries one, and is derived from the field name only where it does
not.

```typescript
const form = new Form.Group({
  vatNumber: new Form.Field({ value: '', label: 'VAT ID' }),
  city: new Form.Field({ value: '' }),
});
// 'VAT ID', which used to render as 'Vat Number'; and 'City', from the name as before
```

vuetify-inputs 0.9.0 declares `label` on vue-forms' `Extras`, so every element carries one, and a prop wins over
what the element carries — the generated prop overrode the label the caller had declared. An application that set
`label` through `setExtendedValues()` or in an element's constructor sees it on screen now, wherever a name-derived
label used to be. Where the derived label is what you want, drop the `label` from the field.

Two more things about the generated layout:

- A member at `DisplayMode.SUPPRESS` is skipped entirely. It renders nothing, so a row and a column of its own left
  a gutter-sized gap.
- A `Group` or `List` member gets a `console.warn` naming it, once per form. The generated layout has no row for a
  nested element, and such a member is still validated and still counted by `form.valid` — a dialog that will not
  close over an error nothing on screen shows. Pass a `FormBuilder` layout of your own to render one.

### A `visibility` naming no `DisplayMode` constant throws where the component renders

vuetify-inputs 0.9.0 resolves the `visibility` prop through vue-forms' `DisplayMode.fromAny`, which reads a name
case-insensitively and refuses a value that names no constant — it throws from vue-forms 0.15, where it fell back to
`DisplayMode.FULL`. A misspelling, and a mode a backend knows that this version does not, used to render the element
fully and say nothing.

This reaches layouts rather than application templates: `Component.fromJSON()` passes `props` through by reference
and never inspects it, which is what lets a backend send a whole layout. A `visibility` in that payload arrives at
the component untouched.

```typescript
const mode = Form.DisplayMode.isDefined(payload.visibility)
  ? Form.DisplayMode.fromAny(payload.visibility)
  : Form.DisplayMode.FULL;
```

Sanitise it where the payload is read, on the way into the layout, if an unknown mode has to be survivable.

### Checklist for 0.7.0

1. Upgrade both peers in one step — `@dynamicforms/vue-forms@^0.17.0`, `@dynamicforms/vuetify-inputs@^0.9.1` — with
   `vue@^3.5.2`, and run on node 22.12 or newer.
2. Search for the three silent breaks first: `watch(` with an element as the source, `readonly(` over an element,
   and `isEqual` over two elements. The type checker finds the `clone(` → `bind(` calls for you.
3. Work through [the vue-forms](:vue-forms:/guide/migration.html) and
   [the vuetify-inputs](:vuetify-inputs:/guide/migration.html) migration guides for the rest of your own code.
4. `await` or `.catch()` every `Action.execute()` outside a template, and rename the `action.label` / `action.icon`
   reads that wanted the value filtered by `showLabel` / `showIcon`.
5. Drop any per-opening cloning of actions or forms that was there to keep dialog resolvers from accumulating.
6. Replace `new Form.Action(` with vuetify-inputs' `new Action(` for every action you hand to a dialog through
   `options.form`, and check the console for the warning that names the ones you missed.
7. Re-check the dialogs whose buttons sit in a disabled group: Enter and Esc no longer reach them.
8. Load every dialog that hands `modal.message()` a form: a `label` your elements carry is on screen now, in place
   of the label derived from the field name.
9. Look for the warning about `Group` and `List` members in the forms you pass to `modal.*`, and give those a
   `FormBuilder` layout.
10. Sanitise `visibility` where a layout arrives from a backend: a value naming no `DisplayMode` constant throws
    where the component renders.
11. If anything of yours consumes this package through `require` or a `<script>` tag, move it to an `import`. The
    build is ESM-only.

## Upgrading to v0.6.0 (from v0.5.x)

This release follows `@dynamicforms/vue-forms` 0.6.0 and `@dynamicforms/vuetify-inputs` 0.8.1. Nothing this library
exports was renamed or removed, so the work is in your own use of the two peer libraries — `Field.create()`,
`Action.create()`, `reactiveValue` and `IField` are gone there — plus two lines of application setup that this
documentation used to get wrong. There is a [checklist](#checklist-for-0-6-0) at the end of this section.

### The peer dependencies move together

| Peer | Before | Now |
|---|---|---|
| `@dynamicforms/vue-forms` | `^0.5.0` | `^0.6.0` |
| `@dynamicforms/vuetify-inputs` | `^0.7.13` | `^0.8.1` |
| `vuetify` | `^3.8` | `^3.9` |

The three are one upgrade: vuetify-inputs 0.8.1 requires vue-forms 0.6.0 and Vuetify 3.9, and 0.7.x cannot be
combined with vue-forms 0.6.0. Installing them one at a time leaves npm reporting unsatisfiable peers.

Your own code migrates at the same time. Both peers document their own breaking changes:

```typescript
// before
const submit = Action.create({ value: { label: 'Send' } });
const email = Field.create({ value: '' });

// after
const submit = new Action({ value: { label: 'Send' } });
const email = new Field({ value: '' });
```

Follow [the vue-forms migration guide](:vue-forms:/guide/migration.html) and
[the vuetify-inputs migration guide](:vuetify-inputs:/guide/migration.html) for everything that is not on this
page — `reactiveValue`, `IField` → `FieldBase`, and `DFInputHint` → `DfInputHint` in particular.

### The plugin registers no components unless you ask it to

`registerComponents` and `registerVuetifyComponents` both default to `false`, and always did. Installing the
plugin with no options and then writing `<modal-view />` leaves Vue unable to resolve the tag, which means no
dialog ever renders and every `modal.*` promise waits forever.

```typescript
// before: <modal-view /> does not resolve
app.use(DynamicFormsModalFormKit);

// after
app.use(DynamicFormsModalFormKit, { registerComponents: true });
```

The alternative is to import `ModalView`, `DfModal`, `FormRender` and `ComponentRender` in the components that
use them. `registerVuetifyComponents` is for projects that do not install Vuetify globally; it registers the
handful of Vuetify components this library renders.

### There is no stylesheet to import

```typescript
// before: fails to resolve - the package exports no such subpath and emits no CSS
import '@dynamicforms/vuetify-modal-form-kit/styles.css';

// after: the inputs rendered inside dialogs bring the styles
import '@dynamicforms/vuetify-inputs/styles.css';
```

### Types resolve through the `exports` map

`package.json` now declares a `types` condition for each of the `import` and `require` branches and ships an
`index.d.cts` next to `index.d.ts`. A project on `moduleResolution: bundler`, `node16` or `nodenext` used to fall
back to `any` for everything this library exports, and a CommonJS consumer on `node16` reported TS1479. Both
resolve now. No source change is needed; delete any `declare module` shim you wrote to work around it.

### What newly works

Four things this library documented but did not do:

- **A second dialog opened while one is on screen.** The dialog on top is the one most recently opened, and the
  one underneath reappears when it closes. `<modal-view>` keeps a single `<df-modal>` alive across dialogs, and
  that component now follows the dialog it is given rather than the one it was created with.
- **Row and column breakpoints.** `Row.breakpoint()` and `Column.breakpoint()` reach the rendered grid, and a
  breakpoint states only what changes: props merge key by key rather than replacing what the element was given,
  and its content carries over. Check your responsive layouts against
  [what a breakpoint inherits](/examples/form-builder-responsive#what-a-breakpoint-inherits). A column given no
  width also stops carrying `cols: false`, in `toJSON()` output as well — `<v-col>` defaults it to `false`
  anyway, and stating it kept the column from ever inheriting a width.
- **Row props.** `dense`, `align`, `align-content` and `justify` are bound onto `<v-row>`. `align-content` and
  `noGutters` also survive the props filter, which used to drop them — `align-content: 'space-between'` in
  particular was validated against the values of `align` and thrown away.
- **The Enter / Esc shortcuts respect the action's state.** A `defaultConfirm` action that is disabled, or hidden
  through its `visibility`, is no longer executed from the keyboard: the shortcut reaches exactly the actions a
  click could reach.

If your layout compensated for any of these — a breakpoint that restates every component, a `class` doing what
`justify` should have done, a guard that re-checked `enabled` inside an action executor — the workaround can go.

### Checklist for 0.6.0

1. Upgrade all three peers in one step: `@dynamicforms/vue-forms@^0.6.0`, `@dynamicforms/vuetify-inputs@^0.8.1`,
   `vuetify@^3.9`.
2. Work through the two peer migration guides for your own code: `Field.create(` → `new Field(`, `Action.create(`
   → `new Action(`, delete `reactiveValue` reads, rename `IField` → `FieldBase` and `DFInputHint` → `DfInputHint`.
3. Pass `{ registerComponents: true }` to `app.use(DynamicFormsModalFormKit, ...)`, or import the components you
   use directly.
4. Replace the `@dynamicforms/vuetify-modal-form-kit/styles.css` import with
   `@dynamicforms/vuetify-inputs/styles.css`.
5. Re-check any responsive layout: row and column breakpoints, and row props, now render. What was inert before
   is applied now.
6. Drop the workarounds listed under [What newly works](#what-newly-works).

---

> See also: [Getting Started](/guide/getting-started), [modal service](/api/modal-service),
> [FormBuilder](/api/form-builder)
