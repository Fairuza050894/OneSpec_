'use client';

import React, { useState } from 'react';
import { Network, Compass } from 'lucide-react';
import { ProductKnowledgeMonitorHub } from '@/components/portal/ProductKnowledgeMonitorHub';
import {
  UniversalKnowledgeGraphWorkbench,
  type UniversalKnowledgeGraphWorkbenchProps,
} from '@/components/ontology/UniversalKnowledgeGraphWorkbench';

export interface Step12ExecutiveSummaryWorkbenchProps extends UniversalKnowledgeGraphWorkbenchProps {
  locale: 'en' | 'id';
  initialView?: 'KNOWLEDGE_GRAPH' | 'PRODUCT_KNOWLEDGE';
}

export function Step12ExecutiveSummaryWorkbench({
  locale,
  initialView = 'KNOWLEDGE_GRAPH',
  ...graphProps
}: Step12ExecutiveSummaryWorkbenchProps) {
  const [step12View, setStep12View] = useState<'KNOWLEDGE_GRAPH' | 'PRODUCT_KNOWLEDGE'>(initialView);

  return (
    <div className="h-full flex flex-col space-y-2 min-h-0 overflow-hidden">
      <div className="h-[32px] min-h-[32px] px-1 flex items-center gap-1 bg-[#101217] border border-white/[0.07] rounded-[4px] text-[11px]">
        <button
          type="button"
          onClick={() => setStep12View('KNOWLEDGE_GRAPH')}
          className={`h-6 px-2.5 rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors ${
            step12View === 'KNOWLEDGE_GRAPH'
              ? 'bg-[#2563EB] text-white font-bold'
              : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#16191F]'
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          <span>
            {locale === 'id'
              ? 'Knowledge Graph & Ontologi Universal'
              : 'Knowledge Graph & Universal Ontology'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStep12View('PRODUCT_KNOWLEDGE')}
          className={`h-6 px-2.5 rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors ${
            step12View === 'PRODUCT_KNOWLEDGE'
              ? 'bg-[#2563EB] text-white font-bold'
              : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#16191F]'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>
            {locale === 'id'
              ? 'Product Knowledge, Lineage & Bug Monitor'
              : 'Product Knowledge, Lineage & Bug Monitor'}
          </span>
        </button>
        <span className="ml-auto text-[9.5px] text-[#707070] hidden xl:inline">
          {locale === 'id'
            ? 'Alur kerja end-to-end · CRUD Modul × DB · Lineage UI → API → DB · Monitoring bug live'
            : 'End-to-end workflow · Module × DB CRUD · UI → API → DB lineage · Live bug monitoring'}
        </span>
      </div>

      {step12View === 'PRODUCT_KNOWLEDGE' ? (
        <div className="flex-1 min-h-0">
          <ProductKnowledgeMonitorHub
            compiledState={graphProps.compiledState || null}
            regressionDiff={graphProps.regressionDiffSummary}
            locale={locale}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <UniversalKnowledgeGraphWorkbench {...graphProps} />
        </div>
      )}
    </div>
  );
}
