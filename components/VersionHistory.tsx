'use client';

import type { HistoryVersion } from '@liveblocks/client';
import { HistoryVersionPreview } from '@liveblocks/react-lexical';
import { HistoryVersionSummary, HistoryVersionSummaryList } from '@liveblocks/react-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createVersionSnapshot, getDocumentVersions } from '@/lib/actions/room.actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

type VersionHistoryProps = {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Must render inside <LiveblocksPlugin>, which HistoryVersionPreview depends on.
const VersionHistory = ({ roomId, open, onOpenChange }: VersionHistoryProps) => {
  // Loaded through a server action rather than useHistoryVersions: that hook
  // only re-polls every minute, so a just-saved version wouldn't show up.
  const [versions, setVersions] = useState<HistoryVersion[]>();
  const [error, setError] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const isLoading = versions === undefined && !error;

  const loadVersions = useCallback(async () => {
    const data: HistoryVersion[] | undefined = await getDocumentVersions(roomId);
    if (!data) return setError(true);

    setError(false);
    setVersions(
      data
        .map((version) => ({ ...version, createdAt: new Date(version.createdAt) }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }, [roomId]);

  useEffect(() => {
    if (open) loadVersions();
  }, [open, loadVersions]);

  const selectedVersion = useMemo(
    () => versions?.find((version) => version.id === selectedVersionId) ?? versions?.[0],
    [selectedVersionId, versions],
  );

  const saveVersionHandler = async () => {
    setSaving(true);
    setSaveFailed(false);

    const snapshot = await createVersionSnapshot(roomId);
    if (snapshot) {
      await loadVersions();
      setSelectedVersionId(undefined); // show the newest version
    } else {
      setSaveFailed(true);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="version-history flex h-[85vh] max-w-5xl flex-col border-dark-400 bg-dark-200 text-white">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0 pr-8">
          <div>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription className="text-blue-100">
              Preview any earlier version and restore it for everyone.
            </DialogDescription>
          </div>
          <Button onClick={saveVersionHandler} disabled={saving} className="gradient-blue">
            {saving ? 'Saving...' : 'Save current version'}
          </Button>
        </DialogHeader>
        {saveFailed && (
          <p className="text-sm text-red-400">
            Couldn&apos;t save a version yet. Recent edits may still be syncing, so try again in a few seconds.
          </p>
        )}

        {isLoading ? (
          <p className="text-blue-100">Loading versions...</p>
        ) : error ? (
          <p className="text-red-400">Couldn&apos;t load version history.</p>
        ) : !versions?.length ? (
          <p className="text-blue-100">
            No versions yet. Save one now, or turn on automatic versions in your Liveblocks project settings.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="min-w-0 flex-1 overflow-auto rounded-md border border-dark-400">
              {selectedVersion && (
                <HistoryVersionPreview
                  version={selectedVersion}
                  onVersionRestore={() => onOpenChange(false)}
                  className="h-full"
                />
              )}
            </div>
            <div className="w-[280px] shrink-0 overflow-auto">
              <HistoryVersionSummaryList>
                {versions.map((version) => (
                  <HistoryVersionSummary
                    key={version.id}
                    version={version}
                    selected={version.id === selectedVersion?.id}
                    onClick={() => setSelectedVersionId(version.id)}
                  />
                ))}
              </HistoryVersionSummaryList>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistory;
