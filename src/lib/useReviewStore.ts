import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReviewDocument, PhotoData, BackupFile } from './models.ts';
import {
  loadDocument,
  commitDocument,
  watchChanges,
  snapshots,
  restoreSnapshot,
  importBackup,
  type Snapshot,
} from './storage.ts';

export function useReviewStore() {
  const [document, setDocument] = useState<ReviewDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [backups, setBackups] = useState<Snapshot[]>([]);
  const inFlight = useRef(false);
  const reload = useCallback(async () => {
    try {
      const d = await loadDocument();
      setDocument(d);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setBackups(await snapshots().catch(() => []));
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    return watchChanges(() => {
      void reload();
    });
  }, [reload]);
  const run = useCallback(async (task: () => Promise<ReviewDocument>) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try {
      const next = await task();
      setDocument(next);
      setError(null);
      setBackups(await snapshots().catch(() => []));
      return true;
    } catch (e) {
      setError(e as Error);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
      setLoading(false);
    }
  }, []);
  const update = useCallback(
    (fn: (d: ReviewDocument) => ReviewDocument, reason: string, photos: PhotoData[] = []) =>
      run(() => commitDocument(fn, reason, photos)),
    [run],
  );
  return {
    document,
    loading,
    error,
    busy,
    backups,
    reload,
    clearError: () => setError(null),
    update,
    restore: (id: string) => run(() => restoreSnapshot(id)),
    importFile: (file: BackupFile, mode: 'merge' | 'replace') =>
      run(() => importBackup(file, mode)),
  };
}
