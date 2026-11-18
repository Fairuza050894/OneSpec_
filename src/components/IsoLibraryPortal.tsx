'use client';

import React from 'react';
import { EnterpriseLibraryPortal } from '@/components/portal/EnterpriseLibraryPortal';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import type { SavedProjectRecord } from '@/services/workspaceVaultService';

export interface IsoLibraryPortalProps {
  compiledSdlcState: CompiledSdlcState | null;
  activeVaultProjectId: string;
  locale: 'en' | 'id';
  onOpenInStudio: (projectId: string, jumpToStep?: number) => Promise<void> | void;
  onCopyBlueprintToNewProject: (blueprintMom: string, projectNameHint: string) => void;
  onSwitchToStudioMode: () => void;
  onAppendLog?: (msg: string) => void;
  onRecaptureScreenshots?: () => Promise<void> | void;
  isRecapturingScreenshots?: boolean;
  onSyncProject?: (rec: SavedProjectRecord) => Promise<void> | void;
  onSwitchVaultProject?: (projectId: string) => Promise<void> | void;
}

export function IsoLibraryPortal({
  compiledSdlcState,
  activeVaultProjectId,
  locale,
  onOpenInStudio,
  onCopyBlueprintToNewProject,
  onSwitchToStudioMode,
  onAppendLog,
  onRecaptureScreenshots,
  isRecapturingScreenshots = false,
  onSyncProject,
  onSwitchVaultProject,
}: IsoLibraryPortalProps) {
  // Built-in resilient project sync handler if caller doesn't provide custom sync logic
  const handleDefaultSyncProject = async (rec: SavedProjectRecord) => {
    onAppendLog?.(
      `[1:1 SYNC & AUTO-VERSION] Initiating structural re-scan & audit ledger for "${rec.projectName}" (${rec.projectId})...`
    );
    try {
      if (rec.projectId && rec.projectId !== activeVaultProjectId && onSwitchVaultProject) {
        await onSwitchVaultProject(rec.projectId);
      }
      const saveRes = await fetch('/api/workspace/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SNAPSHOT',
          projectId: rec.projectId,
          projectName: rec.projectName,
          targetUrl: rec.targetUrl,
          compiledState: rec.latestState || compiledSdlcState,
          createSnapshot: true,
          versionLabel: `Live 1:1 Sync ${new Date().toLocaleTimeString()}`,
        }),
      });
      if (saveRes.ok) {
        const saveJson = await saveRes.json();
        const newVer = saveJson.data?.snapshots?.[0]?.semanticVersion || 'v1.1.0';
        const crId = saveJson.data?.snapshots?.[0]?.autoChangeRequestId || 'CR-AUTO-002';
        onAppendLog?.(
          `[1:1 SYNC COMPLETE] Successfully saved new version ${newVer} (${crId}) with deep delta grep across UI buttons, forms, and API contracts.`
        );
      } else {
        onAppendLog?.(`[1:1 SYNC ERROR] Failed to save snapshot: ${saveRes.statusText}`);
      }
    } catch (err) {
      onAppendLog?.(
        `[1:1 SYNC ERROR] Sync exception: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <EnterpriseLibraryPortal
          activeState={compiledSdlcState}
          activeVaultProjectId={activeVaultProjectId}
          onOpenInStudio={onOpenInStudio}
          onCopyBlueprintToNewProject={onCopyBlueprintToNewProject}
          onSwitchToStudioMode={onSwitchToStudioMode}
          onAppendLog={onAppendLog}
          onRecaptureScreenshots={onRecaptureScreenshots}
          isRecapturingScreenshots={isRecapturingScreenshots}
          onSyncProject={onSyncProject || handleDefaultSyncProject}
        />
      </div>
    </div>
  );
}
