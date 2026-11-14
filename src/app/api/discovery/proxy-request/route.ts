import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      targetUrl?: string;
      method?: string;
      endpointPath?: string;
      queryString?: string;
      requestBody?: string;
      customHeaders?: Record<string, string>;
      useSavedAuth?: boolean;
      expectedResponseKeys?: string[];
    };

    const baseUrl = (body.targetUrl || 'http://127.0.0.1:3000').trim().replace(/\/$/, '');
    const epPath = (body.endpointPath || '/').trim();
    const method = (body.method || 'GET').toUpperCase();
    const qs = (body.queryString || '').trim().replace(/^\?/, '');

    let fullUrl = epPath.startsWith('http://') || epPath.startsWith('https://')
      ? epPath
      : `${baseUrl}${epPath.startsWith('/') ? epPath : `/${epPath}`}`;
    if (qs) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
    }

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'OneSpec-ApiSandbox/1.0',
      ...(body.customHeaders || {}),
    };

    let authApplied = false;
    if (body.useSavedAuth !== false) {
      try {
        const authPath = path.resolve(process.cwd(), '.onespec-auth-state.json');
        if (fs.existsSync(authPath)) {
          const parsed = JSON.parse(fs.readFileSync(authPath, 'utf8'));
          if (Array.isArray(parsed.cookies) && parsed.cookies.length > 0) {
            headers['Cookie'] = parsed.cookies.map((c: { name: string; value: string }) => `${c.name}=${c.value}`).join('; ');
            authApplied = true;
          }
        }
      } catch {}
    }

    const fetchInit: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(10000),
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body.requestBody && body.requestBody.trim()) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      fetchInit.body = body.requestBody;
    }

    const t0 = performance.now();
    const res = await fetch(fullUrl, fetchInit);
    const latencyMs = Math.max(1, Math.round(performance.now() - t0));
    const rawText = await res.text().catch(() => '');

    let parsedJson: unknown = null;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      parsedJson = null;
    }

    // Check schema drift against expectedResponseKeys if JSON object
    const expectedKeys = body.expectedResponseKeys || [];
    const missingKeys: string[] = [];
    if (expectedKeys.length > 0 && parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
      const actualKeys = new Set(Object.keys(parsedJson as Record<string, unknown>));
      for (const k of expectedKeys) {
        if (!actualKeys.has(k)) missingKeys.push(k);
      }
    }

    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      respHeaders[k] = v;
    });

    return NextResponse.json({
      success: true,
      requestUrl: fullUrl,
      method,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      authApplied,
      headers: respHeaders,
      responseBody: parsedJson ? JSON.stringify(parsedJson, null, 2) : rawText.slice(0, 12000),
      isJson: Boolean(parsedJson),
      schemaDrift: {
        hasDrift: missingKeys.length > 0,
        missingKeys,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      status: 502,
      statusText: 'Bad Gateway / Connection Error',
      latencyMs: 0,
      error: message,
      responseBody: `Request failed: ${message}`,
      schemaDrift: { hasDrift: false, missingKeys: [] },
    });
  }
}
