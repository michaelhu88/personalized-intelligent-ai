import React, { useState } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogDescription, DialogClose } from '~/components/ui/Dialog';
import { classNames } from '~/utils/classNames';
import type { StructuredPlan } from '~/lib/utils/planDetection';

interface PlanModalProps {
  plan: StructuredPlan;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onRevise?: () => void;
  userId?: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function ModalSection({ title, children, defaultExpanded = true }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-black hover:bg-gray-900 rounded-t-lg transition-colors"
      >
        <h3 className="text-xl font-black text-white">{title}</h3>
        <div className={classNames(
          'transition-transform duration-200',
          isExpanded ? 'rotate-90' : 'rotate-0'
        )}>
          <div className="i-ph:caret-right text-white text-2xl" />
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 bg-bolt-elements-bg-depth-1 rounded-b-lg border-t border-bolt-elements-borderColor">
          {children}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <span className="font-semibold text-white text-sm">{label}: </span>
      <span className="text-white text-sm leading-relaxed">{value}</span>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="mb-3">
      <h4 className="font-semibold text-white mb-2 text-base">{title}</h4>
      <ul className="space-y-1 ml-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-3 mr-4 flex-shrink-0" />
            <span className="text-white text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhaseItem({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  
  return (
    <div className="mb-3 p-3 bg-bolt-elements-bg-depth-2 rounded-lg">
      <h4 className="font-semibold text-white mb-2 text-base">{title}</h4>
      <p className="text-white text-sm leading-relaxed">{content}</p>
    </div>
  );
}

async function storePlanInMemory(plan: StructuredPlan, userId?: string) {
  if (!userId) return;
  
  const planSummary = `
# Approved Project Plan: ${plan.title}

## Project Overview
${plan.overview.vision ? `**Vision**: ${plan.overview.vision}` : ''}
${plan.overview.targetUsers ? `**Target Users**: ${plan.overview.targetUsers}` : ''}
${plan.overview.coreValueProposition ? `**Value Proposition**: ${plan.overview.coreValueProposition}` : ''}

## Key Requirements
${plan.requirements.functional ? `**Functional**: ${plan.requirements.functional.join(', ')}` : ''}
${plan.requirements.nonFunctional ? `**Non-Functional**: ${plan.requirements.nonFunctional.join(', ')}` : ''}

## Architecture
${plan.architecture.frontend ? `**Frontend**: ${plan.architecture.frontend}` : ''}
${plan.architecture.backend ? `**Backend**: ${plan.architecture.backend}` : ''}

## Implementation Phases
${plan.roadmap.phase1 ? `**Phase 1**: ${plan.roadmap.phase1}` : ''}
${plan.roadmap.phase2 ? `**Phase 2**: ${plan.roadmap.phase2}` : ''}
${plan.roadmap.phase3 ? `**Phase 3**: ${plan.roadmap.phase3}` : ''}

---
*This plan was approved and should be referenced for all implementation decisions.*
`.trim();

  try {
    await fetch('/api/memory/persistent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        content: planSummary,
        action: 'append'
      }),
    });
  } catch (error) {
    console.error('Failed to store plan in memory:', error);
  }
}

export function PlanModal({ plan, isOpen, onClose, onApprove, onRevise, userId }: PlanModalProps) {
  const handleApprove = async () => {
    await storePlanInMemory(plan, userId);
    onApprove?.();
    onClose();
  };

  const handleRevise = () => {
    onRevise?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <Dialog 
        className="!w-[95vw] !h-[90vh] !max-w-none !max-h-none !flex !flex-col !overflow-hidden"
        onClose={onClose}
        showCloseButton={true}
        style={{ 
          width: '95vw', 
          height: '90vh', 
          maxWidth: 'none', 
          maxHeight: 'none' 
        }}
      >
        {/* Height Bridge Wrapper */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="i-ph:clipboard-text-bold text-white text-xl" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-bolt-elements-textPrimary">
                {plan.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                Complete Project Plan Overview
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-scroll overflow-x-hidden p-4">
          <div className="max-w-none space-y-3">
            {/* Project Overview */}
            <ModalSection title="Project Overview">
              <InfoItem label="Vision" value={plan.overview.vision} />
              <InfoItem label="Target Users" value={plan.overview.targetUsers} />
              <InfoItem label="Core Value Proposition" value={plan.overview.coreValueProposition} />
            </ModalSection>

            {/* Requirements */}
            <ModalSection title="Requirements">
              <ListSection title="Functional Requirements" items={plan.requirements.functional} />
              <ListSection title="Non-Functional Requirements" items={plan.requirements.nonFunctional} />
              <ListSection title="User Experience Requirements" items={plan.requirements.userExperience} />
            </ModalSection>

            {/* Architecture */}
            <ModalSection title="Architecture & Tech Stack">
              <InfoItem label="Frontend" value={plan.architecture.frontend} />
              <InfoItem label="Backend" value={plan.architecture.backend} />
              <InfoItem label="Infrastructure" value={plan.architecture.infrastructure} />
            </ModalSection>

            {/* Implementation Roadmap */}
            <ModalSection title="Implementation Roadmap">
              <PhaseItem title="Phase 1: Foundation" content={plan.roadmap.phase1} />
              <PhaseItem title="Phase 2: Core Features" content={plan.roadmap.phase2} />
              <PhaseItem title="Phase 3: Enhancement" content={plan.roadmap.phase3} />
            </ModalSection>

            {/* Additional sections */}
            {plan.structure && (
              <ModalSection title="Project Structure">
                <pre className="text-sm text-white whitespace-pre-wrap font-mono bg-bolt-elements-bg-depth-2 p-4 rounded-lg leading-relaxed">
                  {plan.structure}
                </pre>
              </ModalSection>
            )}

            {plan.considerations && (
              <ModalSection title="Considerations & Risks">
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {plan.considerations}
                </p>
              </ModalSection>
            )}

            {plan.nextSteps && (
              <ModalSection title="Next Steps">
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {plan.nextSteps}
                </p>
              </ModalSection>
            )}
          </div>
        </div>

        {/* Sticky Footer with Action Buttons */}
        {(onApprove || onRevise) && (
          <div className="flex items-center justify-center space-x-4 p-4 border-t border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 flex-shrink-0">
            {onRevise && (
              <button
                onClick={handleRevise}
                className="px-8 py-3 bg-bolt-elements-bg-depth-2 hover:bg-bolt-elements-bg-depth-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <div className="i-ph:pencil-simple-bold text-xl" />
                <span>Request Revisions</span>
              </button>
            )}
            {onApprove && (
              <button
                onClick={handleApprove}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <div className="i-ph:check-bold text-xl" />
                <span>Approve & Start Building</span>
              </button>
            )}
          </div>
        )}
        </div>
      </Dialog>
    </DialogRoot>
  );
}