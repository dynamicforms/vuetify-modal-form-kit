# Migration guide

Every breaking release has its own section below, newest first. If you are crossing several releases at once,
work from the bottom of the page upwards.

This is the only page that names superseded APIs; everywhere else in this documentation only the current one
exists.

<!-- New releases go directly below this comment, above the previous one, as `## Upgrading to vX.Y.Z (from vA.B.x)`. -->

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
