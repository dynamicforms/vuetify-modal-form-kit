// the string keys a runtime reaches for on a value it knows nothing about
const probeKeys = new Set<string>(['then', 'toString', 'valueOf', 'toJSON']);

/**
 * States whether a key read off a `simple()` proxy is a runtime probe rather than a component builder method.
 *
 * A component builder names every method with a string, so a symbol key is always a probe: `Symbol.toPrimitive`
 * for string coercion, `Symbol.toStringTag` and `Symbol.for('nodejs.util.inspect.custom')` for inspection,
 * `Symbol.iterator` and `Symbol.asyncIterator` for spread and `for await`. Four string keys are of the same kind.
 * A value returned from an `async` function is awaited by reading `then` and calling what it answers; string
 * coercion calls `valueOf` and then `toString`; `JSON.stringify` calls `toJSON`. A proxy answering a
 * component-adding function there builds a component - and a row and a column with it - out of a call the caller
 * never wrote, then calls the probed name on the component builder, which declares none of the four.
 *
 * A probe is answered with `undefined`, which leaves the layout untouched.
 */
export function isRuntimeProbe(prop: string | symbol): boolean {
  return typeof prop === 'symbol' || probeKeys.has(prop);
}
