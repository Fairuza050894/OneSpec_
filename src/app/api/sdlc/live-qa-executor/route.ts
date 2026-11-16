import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { workspaceVaultService } from '@/services/workspaceVaultService';
import { liveMultiToolExecutorService } from '@/services/liveMultiToolExecutorService';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';

function resolveActiveState(projectId?: string | null): CompiledSdlcState | null {
  let state: CompiledSdlcState | null = null;
  if (projectId) {
    state = (workspaceVaultService.getProject(projectId)?.latestState as CompiledSdlcState) || null;
  }
  if (!state) {
    const all = workspaceVaultService.listProjects();
    if (all[0]) {
      state = (workspaceVaultService.getProject(all[0].projectId)?.latestState as CompiledSdlcState) || null;
    }
  }
  if (!state) {
    const cacheFile = path.resolve(process.cwd(), '.onespec-workspace-cache.json');
    if (fs.existsSync(cacheFile)) {
      try {
        state = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as CompiledSdlcState;
      } catch {}
    }
  }
  return state;
}

export async function POST(request: Request) {
  try {
    let bodyState: CompiledSdlcState | null = null;
    let projectId: string | null = null;

    let toolId: string | null = null;

    try {
      const body = await request.json();
      if (body) {
        if (body.compiledState) bodyState = body.compiledState as CompiledSdlcState;
        if (body.projectId) projectId = body.projectId;
        if (body.toolId) toolId = body.toolId;
      }
    } catch {}

    const state = bodyState || resolveActiveState(projectId);
    if (!state) {
      return NextResponse.json(
        { error: 'No active project state found in Vault or workspace cache.' },
        { status: 404 }
      );
    }

    if (toolId) {
      const toolProbe = liveMultiToolExecutorService.executeToolProbe(toolId, state);
      return NextResponse.json(
        { toolProbe },
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    const report = await liveMultiToolExecutorService.executeInAppMultiToolSuite(state);

    return NextResponse.json(report, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Live QA Execution failed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const lastReport = liveMultiToolExecutorService.getLastExecutionReport();
    if (lastReport) {
      return NextResponse.json(lastReport, { status: 200 });
    }

    const state = resolveActiveState(projectId);
    if (!state) {
      return NextResponse.json(
        { error: 'No active project state available for live evaluation.' },
        { status: 404 }
      );
    }

    const report = await liveMultiToolExecutorService.executeInAppMultiToolSuite(state);
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve live QA report.' },
      { status: 500 }
    );
  }
}
