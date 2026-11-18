'use client';

import React from 'react';
import { QuickExportToolbar } from '@/components/shared/QuickExportToolbar';
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
}: IsoLibraryPortalProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-[#22262E] bg-[#111317]">
        <QuickExportToolbar
          compiledState={compiledSdlcState}
          activeVaultProjectId={activeVaultProjectId}
          locale={locale}
        />
      </div>
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
          onSyncProject={onSyncProject}
        />
      </div>
    </div>
  );
}
