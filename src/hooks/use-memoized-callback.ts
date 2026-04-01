import { DependencyList, useCallback, useRef } from "react";

/**
 * A custom hook that returns a memoized callback function.
 * This is similar to `useCallback`, but it guarantees that the callback
 * identity is stable across renders, as long as the dependencies don't change.
 * This can be useful for passing callbacks to child components that
 * rely on referential equality to prevent unnecessary re-renders.
 *
 * @param callback The function to memoize.
 * @param deps An array of dependencies for the callback.
 * @returns The memoized callback function.
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
): T {
  const callbackRef = useRef(callback);

  // Update the ref whenever the callback changes (i.e., when parent re-renders)
  callbackRef.current = callback;

  // Memoize a stable function that calls the latest callback from the ref
  // This function itself is stable as long as `deps` don't change
  return useCallback(callbackRef.current, [...deps]);
}
