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

## Release

**Nothing in the repository checks that a release is coherent before it goes out.**

Publishing is done by a tool of yours outside this repository, so what follows is about what the repository
itself can state, not about replacing that tool.

Two things are true here whatever publishes. `changelog.md` ships inside the tarball (`package.json` `files`),
and nothing compares the version it names at the top with `package.json`'s: a release whose changelog heading was
never bumped ships a file describing the previous one. And `prepack` builds, so `npm publish` cannot ship a stale
`dist/`, but nothing asserts that the tree being published is the tree CI went green on - a local publish from a
dirty working copy is indistinguishable from a clean one.

- *A guard in CI.* One step reading `package.json`'s version and requiring a `## [x.y.z]` heading for it in
  `changelog.md`. A few lines, catches the failure that actually happens, and says nothing about how you publish.
- *The same guard in the publish tool.* Better placed if the tool is where a release is decided, and outside this
  repository's reach.
- *Leave it.* The check is a person's, as it is now.

Recommended: the CI guard, unless the publish tool already makes the comparison - which is the question here. It
is cheap, it runs on the pull request rather than at publish time, and it is useful to anyone who ever publishes
this package by another route.
