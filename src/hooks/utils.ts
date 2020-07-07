export const clamp = (min: number, max: number) => (value: number) => Math.max(min, Math.min(value, max));
export const identity = (x: any) => x;
export const noop = () => {};
export const compose = (...fns: Function[]) => fns.reduce((f, g) => (...args: any[]) => f(g(...args)));
export const maybe = (f: Function, g: Function) => (v: any) => (v === null || v === undefined ? f() : g(v));
export const snd = (g: any) => ([x, y]: any) => [x, g(y)];
export const toPair = (v: any) => [v, v];

export const getOffset = maybe(
  () => ({ left: 0, top: 0 }),
  compose(
    ([el, { left, top }]: any) => ({
      left: left + el.offsetLeft,
      top: top + el.offsetTop,
    }),
    snd((el: any) => getOffset(el.offsetParent)),
    toPair
  )
);

export const getPositionOnElement = compose(
  ({ left, top }: any) => (x: any, y: any) => ({
    x: x - left,
    y: y - top,
  }),
  getOffset
);

export const isChildOf = (child: any, parent: any): any =>
  !!(child && parent) && (child === parent || isChildOf(child.parentElement, parent));
