import { NextRequest, NextResponse } from 'next/server';
import { workspaceVaultService, type VaultProjectType } from '@/services/workspaceVaultService';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (projectId) {
      const record = workspaceVaultService.getProject(projectId);
      if (!record) {
        return NextResponse.json(
          { success: false, error: `Project "${projectId}" not found in vault` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: record });
    }

    const projects = workspaceVaultService.listProjects();
    return NextResponse.json({ success: true, total: projects.length, data: projects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read workspace vault';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: 'SAVE_PROJECT' | 'CREATE_SNAPSHOT';
      projectId?: string;
      projectName?: string;
      targetUrl?: string;
      projectType?: VaultProjectType;
      compiledState?: CompiledSdlcState;
      createSnapshot?: boolean;
      versionLabel?: string;
    };

    if (!body?.compiledState) {
      return NextResponse.json(
        { success: false, error: 'compiledState payload is required' },
        { status: 400 }
      );
    }

    const saved = workspaceVaultService.saveProjectState({
      projectId: body.projectId,
      projectName: body.projectName,
      targetUrl: body.targetUrl,
      projectType: body.projectType,
      compiledState: body.compiledState,
      createSnapshot: body.action === 'CREATE_SNAPSHOT' ? true : body.createSnapshot ?? true,
      versionLabel: body.versionLabel,
    });

    return NextResponse.json({
      success: true,
      data: saved,
      projects: workspaceVaultService.listProjects(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save workspace vault';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let projectId = req.nextUrl.searchParams.get('projectId') || '';
    if (!projectId) {
      try {
        const body = (await req.json()) as { projectId?: string };
        projectId = body?.projectId || '';
      } catch {}
    }

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }

    const deleted = workspaceVaultService.deleteProject(projectId);
    return NextResponse.json({
      success: deleted,
      projects: workspaceVaultService.listProjects(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete project from vault';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
