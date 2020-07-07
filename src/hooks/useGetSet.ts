import { useCallback, useRef } from 'react';

const useGetSet = (initialValue: any) => {
  const ref = useRef(initialValue);
  const get: Function = useCallback(() => ref.current, []);
  const set: Function = useCallback((value) => {
    ref.current = typeof value === 'function' ? value(ref.current) : value;

    return ref.current;
  }, []);

  return [get, set];
};

export default useGetSet;
