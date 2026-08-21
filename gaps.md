# gaps

Decisions that are yours. Each item is reproduced against the working tree and states the options with what each
one costs; the recommendation is a recommendation, and nothing here is implemented.

---

## The public surface

**Which name settles the dialog when one action is reachable under two of them?**

An action can be reached by two names at once: the field name it has inside `options.form`, and the key the
caller wrote for it in `options.actions`. It happens whenever the same instance is passed both ways, which is
how a caller states "this form member is also one of the dialog's buttons":

```typescript
const submit = new Action({ value: { label: 'Send', defaultConfirm: true } });
const form = new Form.Group({ submit });                  // field name: 'submit'

await modal.message('Subscribe', 'your address', { form, actions: { send: submit } });
// resolves with 'submit' - the field name - and never with 'send', the key just written
```

`src/modal/api.ts:151` resolves with `field.fieldName || name`, so the field name wins.
`docs/api/modal-service.md` states that precedence, so it is a documented rule rather than an accident. The cost
is only that a caller who deliberately chose the key gets the other name back, and has no way to ask for theirs.

- *Leave it.* One rule, documented. A caller who wants their own key names the form member to match.
- *Prefer the options key.* `resolvePromise(name)`. Symmetrically arbitrary, breaks anyone relying on the
  documented rule, and reads worse for the common case, where the action is a form member and `options.actions`
  was never given at all.
- *Let the caller choose.* A `resolveWith?: 'field' | 'key'` on `ModalOptions`, defaulting to `'field'`. Additive
  and small; it is also a knob on a question most callers never meet, because most actions are reachable under
  one name only.

Recommended: leave it. It is the only item left in this file where the current behaviour is already written down
as a rule; adding the knob is worth doing if a real caller asks and not before.

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
