# gaps

Open items. Each one is reproduced against the working tree; none is fixed, because each needs a decision that is
yours to make.

---

## Behaviour decisions

**[V] Every `modal.*` call adds an `ExecuteAction` to the caller's actions and nothing removes it.**

`src/modal/api.ts:135-142` registers a resolver on each action in `options.actions` and on each `Action` field of
`options.form`. Open the same dialog N times with the same `Action` instances — a module-level action, or a form
kept across openings — and N handlers accumulate, each capturing a settled promise and a dead dialog id. All of
them run on every click.

vue-forms has no `unregisterAction` (`grep -rn 'unregisterAction' ../vue-forms/src` finds nothing), so the options
are: add one there, clone the caller's actions per dialog, or keep the resolver in a map keyed by dialog id and
register a single dispatching handler once. The first is a change in the peer library, so it is worth deciding
before 1.0.
