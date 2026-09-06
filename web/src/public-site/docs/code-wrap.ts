import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "docs-code-wrap";

let wrapped = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readStoredWrap() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return wrapped;
}

function getServerSnapshot() {
  return false;
}

function writeDocumentWrap(next: boolean) {
  if (typeof document === "undefined") return;
  if (next) {
    document.documentElement.dataset.codeWrap = "1";
    return;
  }
  delete document.documentElement.dataset.codeWrap;
}

export function setCodeWrap(next: boolean) {
  wrapped = next;
  writeDocumentWrap(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // private mode / blocked storage
  }
  emit();
}

export function useCodeWrap() {
  const isWrapped = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const stored = readStoredWrap();
    writeDocumentWrap(stored);
    if (stored !== wrapped) {
      wrapped = stored;
      emit();
    }
  }, []);

  return [isWrapped, setCodeWrap] as const;
}
