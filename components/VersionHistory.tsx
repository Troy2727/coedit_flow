'use client';

import { useHistoryVersions } from '@liveblocks/react';
import { HistoryVersionPreview } from '@liveblocks/react-lexical';
import { HistoryVersionSummary, HistoryVersionSummaryList } from '@liveblocks/react-ui';
import { useMemo, useState } from 'react';

import { createVersionSnapshot } from '@/lib/actions/room.actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

type VersionHistoryProps = {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Must render inside <LiveblocksPlugin>, which HistoryVersionPreview depends on.
const VersionHistory = ({ roomId, open, onOpenChange }: VersionHistoryProps) => {
  const { versions, isLoading, error } = useHistoryVersions();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const selectedVersion = useMemo(
    () => versions?.find((version) => version.id === selectedVersionId) ?? versions?.[0],
    [selectedVersionId, versions],
  );

  const saveVersionHandler = async () => {
    setSaving(true);
    setSaveFailed(false);

    const snapshot = await createVersionSnapshot(roomId);
    if (!snapshot) setSaveFailed(true);

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
        {saveFailed && <p className="text-sm text-red-400">Couldn&apos;t save a version. Please try again.</p>}

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
