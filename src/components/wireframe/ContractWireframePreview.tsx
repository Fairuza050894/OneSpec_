'use client';

import React, { useState } from 'react';
import { Tag, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import type { ValidationRuleContract } from '@/types/sdlc';

export type WireframeState = 'IDLE' | 'VALIDATION_ERROR' | 'SUBMITTING' | 'SUCCESS';

interface ContractWireframeProps {
  validationRules?: ValidationRuleContract[];
  onStateChange?: (state: WireframeState) => void;
}

export function ContractWireframePreview({ validationRules, onStateChange }: ContractWireframeProps) {
  const [wireframeState, setWireframeState] = useState<WireframeState>('IDLE');
  const [voucherInput, setVoucherInput] = useState<string>('DISC20');
  const [cartSubtotal, setCartSubtotal] = useState<number>(45000); // 45.000 triggers VR-01 boundary error

  // Mobospace states
  const [moboTenant, setMoboTenant] = useState<'PANCARAN' | 'EXTERNAL'>('PANCARAN');
  const [moboUserId, setMoboUserId] = useState<string>('dispatcher_01');
  const [moboPassword, setMoboPassword] = useState<string>('ValidPass123!');

  const isMobospace = validationRules?.some(
    (r) => r.fieldName === 'username' || r.fieldName === 'operatorTenant' || r.fieldName === 'password'
  );

  const changeState = (nextState: WireframeState) => {
    setWireframeState(nextState);
    if (onStateChange) onStateChange(nextState);
  };

  const vr01 = validationRules?.find((r) => r.ruleId === 'VR-01') || {
    ruleId: 'VR-01',
    userStoryId: 'REQ-US-01',
    fieldName: isMobospace ? 'username' : 'cartTotal',
    dataType: isMobospace ? 'string' : 'number',
    constraintExpression: isMobospace ? '^[A-Za-z0-9_.-]{3,30}$' : 'cartTotal >= 50000',
    errorCode: isMobospace ? 'ERR_AUTH_USER_REQUIRED' : 'CART_BELOW_MINIMUM_THRESHOLD',
    httpStatus: isMobospace ? 401 : 422,
    exactUiErrorString: isMobospace
      ? 'Masukkan User ID Anda yang terdaftar pada sistem Mobospace'
      : 'Total belanja minimum Rp 50.000 untuk menggunakan voucher ini',
  };

  const discountAmount = 20000;
  const finalTotal = Math.max(0, cartSubtotal - (wireframeState === 'SUCCESS' ? discountAmount : 0));

  if (isMobospace) {
    return (
      <div className="w-full bg-[#111317] border border-[#22262E] rounded-[2px] p-4 flex flex-col space-y-4">
        {/* State Switcher Segmented Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#22262E]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#707070] uppercase font-bold">State Simulator:</span>
            <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[4px] text-[11px] font-mono">
              {(['IDLE', 'VALIDATION_ERROR', 'SUBMITTING', 'SUCCESS'] as WireframeState[]).map((state) => (
                <button
                  key={state}
                  onClick={() => changeState(state)}
                  className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    wireframeState === state
                      ? state === 'VALIDATION_ERROR'
                        ? 'bg-[#DC2626] text-white font-bold'
                        : state === 'SUCCESS'
                        ? 'bg-[#059669] text-white font-bold'
                        : 'bg-[#2563EB] text-white font-bold'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-[#707070]">Active Contract:</span>
            <span className="badge-tag px-2 py-0.5 bg-[#16191F] border border-[#22262E] text-[#3B82F6] font-bold">
              {wireframeState === 'VALIDATION_ERROR'
                ? `${vr01.ruleId} (HTTP ${vr01.httpStatus})`
                : wireframeState === 'SUCCESS'
                ? 'HTTP 200 OK (REQ-US-01)'
                : 'IDLE (Awaiting Dispatch)'}
            </span>
          </div>
        </div>

        {/* Mobospace Technical Wireframe Screen Preview */}
        <div className="border border-[#22262E] rounded-[2px] bg-[#0B0C0E] p-6 max-w-md mx-auto w-full">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#707070] mb-4 pb-2 border-b border-[#22262E] flex justify-between">
            <span>Mobospace Transportation Control Tower · UI Contract Simulator</span>
            <span>Target: 10.10.15.75:3100</span>
          </div>

          {/* Tenant Switcher Tabs */}
          <div className="flex bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] mb-4">
            <button
              type="button"
              onClick={() => setMoboTenant('PANCARAN')}
              className={`flex-1 py-1 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                moboTenant === 'PANCARAN' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
              }`}
            >
              Pancaran
            </button>
            <button
              type="button"
              onClick={() => setMoboTenant('EXTERNAL')}
              className={`flex-1 py-1 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                moboTenant === 'EXTERNAL' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
              }`}
            >
              External
            </button>
          </div>

          <div className="space-y-3 font-mono text-[12px]">
            {/* User ID Field */}
            <div>
              <label className="text-[11px] text-[#A1A1A1] block mb-1 flex justify-between">
                <span>User ID</span>
                <span className="text-[9.5px] text-[#707070]">VR-01: string [3..30]</span>
              </label>
              <input
                type="text"
                value={wireframeState === 'VALIDATION_ERROR' ? '' : moboUserId}
                onChange={(e) => setMoboUserId(e.target.value)}
                placeholder="Masukkan User ID Anda"
                className={`w-full bg-[#111317] border px-3 py-1.5 text-[12px] font-mono text-[#EDEDED] rounded-[2px] outline-none ${
                  wireframeState === 'VALIDATION_ERROR' ? 'border-[#DC2626]' : 'border-[#22262E] focus:border-[#3B82F6]'
                }`}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] text-[#A1A1A1] block mb-1 flex justify-between">
                <span>Kata Sandi</span>
                <span className="text-[9.5px] text-[#707070]">VR-02: min 6 chars</span>
              </label>
              <input
                type="password"
                value={moboPassword}
                onChange={(e) => setMoboPassword(e.target.value)}
                placeholder="Masukkan sandi"
                className="w-full bg-[#111317] border border-[#22262E] px-3 py-1.5 text-[12px] font-mono text-[#EDEDED] rounded-[2px] outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Error Banner */}
            {wireframeState === 'VALIDATION_ERROR' && (
              <div className="p-2 bg-[#DC2626]/10 border border-[#DC2626] text-[#DC2626] text-[11px] font-mono rounded-[2px] flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{vr01.exactUiErrorString}</div>
                  <div className="text-[10px] text-[#A1A1A1] mt-0.5">
                    Violation: <code>{vr01.constraintExpression}</code> · HTTP {vr01.httpStatus} <code>{vr01.errorCode}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {wireframeState === 'SUCCESS' && (
              <div className="p-2 bg-[#059669]/10 border border-[#059669] text-[#059669] text-[11px] font-mono rounded-[2px] flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Autentikasi Berhasil · Operator: {moboUserId} ({moboTenant})</div>
                  <div className="text-[10px] text-[#A1A1A1] mt-0.5">
                    Session Dispatched: POST /api/_auth/session · Token Issued (HTTP 200 OK)
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={wireframeState === 'SUBMITTING'}
              onClick={() => {
                if (!moboUserId || wireframeState === 'VALIDATION_ERROR') {
                  changeState('VALIDATION_ERROR');
                } else {
                  changeState('SUBMITTING');
                  setTimeout(() => changeState('SUCCESS'), 400);
                }
              }}
              className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[2px] text-[12px] font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors mt-2"
            >
              {wireframeState === 'SUBMITTING' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </div>
        </div>

        {/* Design System & Token Telemetry */}
        <div className="grid grid-cols-3 gap-3 text-[10px] font-mono p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[#707070]">
          <div>
            <span className="text-[#A1A1A1]">Border Radius: </span>
            <code>2px (inputs), 0px (container)</code>
          </div>
          <div>
            <span className="text-[#A1A1A1]">Discovered Inputs: </span>
            <code>username, password, tenant</code>
          </div>
          <div>
            <span className="text-[#A1A1A1]">Primary Action: </span>
            <code>button:has-text(&quot;Masuk&quot;)</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#111317] border border-[#22262E] rounded-[2px] p-4 flex flex-col space-y-4">
      {/* State Switcher Segmented Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#22262E]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#707070] uppercase font-bold">State Simulator:</span>
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[4px] text-[11px] font-mono">
            {(['IDLE', 'VALIDATION_ERROR', 'SUBMITTING', 'SUCCESS'] as WireframeState[]).map((state) => (
              <button
                key={state}
                onClick={() => changeState(state)}
                className={`px-2.5 py-1 rounded-[2px] transition-colors ${
                  wireframeState === state
                    ? state === 'VALIDATION_ERROR'
                      ? 'bg-[#DC2626] text-white font-bold'
                      : state === 'SUCCESS'
                      ? 'bg-[#059669] text-white font-bold'
                      : 'bg-[#2563EB] text-white font-bold'
                    : 'text-[#707070] hover:text-[#EDEDED]'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Contract Reference Tag */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#707070]">Active Contract:</span>
          <span className="badge-tag px-2 py-0.5 bg-[#16191F] border border-[#22262E] text-[#3B82F6] font-bold">
            {wireframeState === 'VALIDATION_ERROR'
              ? `${vr01.ruleId} (HTTP ${vr01.httpStatus})`
              : wireframeState === 'SUCCESS'
              ? 'HTTP 200 OK (REQ-US-01)'
              : 'IDLE (Awaiting Dispatch)'}
          </span>
        </div>
      </div>

      {/* Monochrome Technical Wireframe Screen Preview */}
      <div className="border border-[#22262E] rounded-[2px] bg-[#0B0C0E] p-6 max-w-xl mx-auto w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#707070] mb-3 pb-2 border-b border-[#22262E] flex justify-between">
          <span>Checkout Cart Summary · UI Contract Simulator</span>
          <span>DOM: [data-testid=&quot;voucher-container&quot;]</span>
        </div>

        <div className="space-y-4 font-mono text-[12px]">
          {/* Cart Item Row */}
          <div className="flex justify-between items-center py-1 text-[#A1A1A1]">
            <span>Order Subtotal (Items x2)</span>
            <span className="text-[#EDEDED] font-bold tabular-nums">
              IDR {cartSubtotal.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Subtotal Adjuster */}
          <div className="flex items-center gap-2 text-[10px] text-[#707070] bg-[#111317] p-2 rounded-[2px] border border-[#22262E]">
            <span>Test Cart Value:</span>
            <button
              onClick={() => {
                setCartSubtotal(45000);
                changeState('VALIDATION_ERROR');
              }}
              className={`px-2 py-0.5 rounded-[2px] border ${
                cartSubtotal === 45000 ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-[#22262E] text-[#707070]'
              }`}
            >
              45.000 (Below 50K Bound)
            </button>
            <button
              onClick={() => {
                setCartSubtotal(80000);
                changeState('SUCCESS');
              }}
              className={`px-2 py-0.5 rounded-[2px] border ${
                cartSubtotal === 80000 ? 'border-[#059669] text-[#059669] font-bold' : 'border-[#22262E] text-[#707070]'
              }`}
            >
              80.000 (Above 50K Bound)
            </button>
          </div>

          {/* Voucher Input Group */}
          <div className="space-y-1.5 pt-2 border-t border-[#22262E]">
            <label className="text-[11px] text-[#A1A1A1] flex justify-between">
              <span>Promotional Voucher Code</span>
              <span className="text-[10px] text-[#707070]">data-testid=&quot;voucher-input&quot;</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                disabled={wireframeState === 'SUBMITTING'}
                placeholder="e.g. DISC20"
                className={`flex-1 bg-[#111317] border px-3 py-1.5 text-[12px] font-mono text-[#EDEDED] rounded-[2px] outline-none transition-colors ${
                  wireframeState === 'VALIDATION_ERROR'
                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                    : wireframeState === 'SUCCESS'
                    ? 'border-[#059669]'
                    : 'border-[#22262E] focus:border-[#3B82F6]'
                }`}
              />

              <button
                disabled={wireframeState === 'SUBMITTING'}
                onClick={() => {
                  if (cartSubtotal < 50000) {
                    changeState('VALIDATION_ERROR');
                  } else {
                    changeState('SUBMITTING');
                    setTimeout(() => changeState('SUCCESS'), 400);
                  }
                }}
                className={`px-4 py-1.5 text-[11px] font-mono font-bold rounded-[2px] flex items-center gap-1.5 transition-colors ${
                  wireframeState === 'SUBMITTING'
                    ? 'bg-[#16191F] text-[#707070] cursor-not-allowed'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                }`}
              >
                {wireframeState === 'SUBMITTING' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Apply Code</span>
                )}
              </button>
            </div>

            {/* Error String Banner Rendering Exact VR-xx */}
            {wireframeState === 'VALIDATION_ERROR' && (
              <div
                data-testid="voucher-error-banner"
                className="mt-2 p-2 bg-[#DC2626]/10 border border-[#DC2626] text-[#DC2626] text-[11px] font-mono rounded-[2px] flex items-start gap-1.5"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{vr01.exactUiErrorString}</div>
                  <div className="text-[10px] text-[#A1A1A1] mt-0.5">
                    Violation: <code>{vr01.constraintExpression}</code> · HTTP 422 <code>{vr01.errorCode}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Success Applied Banner */}
            {wireframeState === 'SUCCESS' && (
              <div
                data-testid="voucher-success-banner"
                className="mt-2 p-2 bg-[#059669]/10 border border-[#059669] text-[#059669] text-[11px] font-mono rounded-[2px] flex items-start gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Voucher DISC20 berhasil diterapkan (-IDR 20.000)</div>
                  <div className="text-[10px] text-[#A1A1A1] mt-0.5">
                    Contract Verified: HTTP 200 OK · Round-trip latency: <span className="text-[#059669] font-bold">94ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Final Payable */}
          <div className="pt-3 border-t border-[#22262E] flex justify-between items-center text-[13px] font-bold">
            <span className="text-[#EDEDED]">Total Net Payable:</span>
            <span className="text-[#3B82F6] tabular-nums text-[14px]">
              IDR {finalTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Design System & Token Telemetry */}
      <div className="grid grid-cols-3 gap-3 text-[10px] font-mono p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[#707070]">
        <div>
          <span className="text-[#A1A1A1]">Border Radius: </span>
          <code>2px (inputs), 0px (container)</code>
        </div>
        <div>
          <span className="text-[#A1A1A1]">Type Scale: </span>
          <code>11px / 12px (tabular-nums)</code>
        </div>
        <div>
          <span className="text-[#A1A1A1]">Error Token: </span>
          <code className="text-[#DC2626]">#DC2626 (--status-defect)</code>
        </div>
      </div>
    </div>
  );
}
