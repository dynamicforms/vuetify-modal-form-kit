import { responsiveBreakpoints } from '@dynamicforms/vuetify-inputs';
import { isArray, isNumber, isObjectLike, isString } from 'lodash-es';

/**
 * The keys a per-breakpoint Vuetify prop is written under: the plain name and one `<name>-<breakpoint>` per
 * breakpoint, which camelize onto the component's `offsetMd` / `alignSm` props.
 */
export function withBreakpointVariants(...keys: string[]): string[] {
  return [...keys, ...responsiveBreakpoints.flatMap((bp) => keys.map((key) => `${key}-${bp}`))];
}

/** A class binding is a string, a list of strings or a class-to-flag object. */
export function isValidClass(v: unknown): boolean {
  return isString(v) || (isArray(v) && v.every((i) => isString(i))) || (isObjectLike(v) && !isArray(v));
}

/**
 * A style binding is a string, a property-to-value object, or a list of either; a property holds a string or a
 * number.
 */
export function isValidStyle(v: unknown): boolean {
  if (isString(v)) return true;
  if (isArray(v)) return v.every(isValidStyle);
  if (isObjectLike(v)) {
    return Object.entries(<object>v).every(([key, val]) => isString(key) && (isString(val) || isNumber(val)));
  }
  return false;
}
