import React, { useState } from 'react';
import { classNames } from '~/utils/classNames';
import type { StructuredPlan } from '~/lib/utils/planDetection';
import { PlanModal } from './PlanModal';

interface PlanDisplayProps {
  plan: StructuredPlan;
  onApprove?: () => void;
  onRevise?: () => void;
  className?: string;
  userId?: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({ title, children, defaultExpanded = true }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-bolt-elements-borderColor rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-black flex items-center justify-between hover:bg-gray-900 transition-colors"
      >
        <h3 className="text-lg font-black text-white">{title}</h3>
        <div className={classNames(
          'transition-transform duration-200',
          isExpanded ? 'rotate-90' : 'rotate-0'
        )}>
          <div className="i-ph:caret-right text-white text-xl" />
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 py-3 bg-bolt-elements-bg-depth-1 border-t border-bolt-elements-borderColor">
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
      <span className="font-medium text-white">{label}: </span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="mb-4">
      <h4 className="font-medium text-white mb-2">{title}</h4>
      <ul className="space-y-1 ml-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
            <span className="text-white">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhaseItem({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  
  return (
    <div className="mb-4 p-3 bg-bolt-elements-bg-depth-2 rounded-lg">
      <h4 className="font-medium text-white mb-2">{title}</h4>
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
        action: 'append' // Append to existing memory rather than replace
      }),
    });
  } catch (error) {
    console.error('Failed to store plan in memory:', error);
  }
}

export function PlanDisplay({ plan, onApprove, onRevise, className, userId }: PlanDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApprove = async () => {
    // Store the plan in persistent memory
    await storePlanInMemory(plan, userId);
    
    // Call the original onApprove callback
    onApprove?.();
  };
  return (
    <div className={classNames(
      'bg-bolt-elements-bg-depth-1 border border-bolt-elements-borderColor rounded-xl p-6 space-y-6',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-bolt-elements-borderColor">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <div className="i-ph:clipboard-text-bold text-white text-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">{plan.title}</h2>
            <p className="text-sm text-bolt-elements-textSecondary">Structured Project Plan</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 rounded-full text-xs font-medium transition-colors duration-200 flex items-center space-x-1.5"
          >
            <div className="i-ph:eye-bold text-sm" />
            <span>View Full Plan</span>
          </button>
          <div className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
            Ready for Review
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Project Overview */}
        <CollapsibleSection title="Project Overview">
          <InfoItem label="Vision" value={plan.overview.vision} />
          <InfoItem label="Target Users" value={plan.overview.targetUsers} />
          <InfoItem label="Core Value Proposition" value={plan.overview.coreValueProposition} />
        </CollapsibleSection>

        {/* Requirements */}
        <CollapsibleSection title="Requirements">
          <ListSection title="Functional Requirements" items={plan.requirements.functional} />
          <ListSection title="Non-Functional Requirements" items={plan.requirements.nonFunctional} />
          <ListSection title="User Experience Requirements" items={plan.requirements.userExperience} />
        </CollapsibleSection>

        {/* Architecture */}
        <CollapsibleSection title="Architecture & Tech Stack">
          <InfoItem label="Frontend" value={plan.architecture.frontend} />
          <InfoItem label="Backend" value={plan.architecture.backend} />
          <InfoItem label="Infrastructure" value={plan.architecture.infrastructure} />
        </CollapsibleSection>

        {/* Implementation Roadmap */}
        <CollapsibleSection title="Implementation Roadmap">
          <PhaseItem title="Phase 1: Foundation" content={plan.roadmap.phase1} />
          <PhaseItem title="Phase 2: Core Features" content={plan.roadmap.phase2} />
          <PhaseItem title="Phase 3: Enhancement" content={plan.roadmap.phase3} />
        </CollapsibleSection>

        {/* Additional sections */}
        {plan.structure && (
          <CollapsibleSection title="Project Structure" defaultExpanded={false}>
            <pre className="text-sm text-white whitespace-pre-wrap font-mono bg-bolt-elements-bg-depth-2 p-3 rounded">
              {plan.structure}
            </pre>
          </CollapsibleSection>
        )}

        {plan.considerations && (
          <CollapsibleSection title="Considerations & Risks" defaultExpanded={false}>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {plan.considerations}
            </p>
          </CollapsibleSection>
        )}

        {plan.nextSteps && (
          <CollapsibleSection title="Next Steps">
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {plan.nextSteps}
            </p>
          </CollapsibleSection>
        )}
      </div>

      {/* Action buttons */}
      {(onApprove || onRevise) && (
        <div className="flex items-center justify-center space-x-4 pt-6 border-t border-bolt-elements-borderColor">
          {onRevise && (
            <button
              onClick={onRevise}
              className="px-6 py-2.5 bg-bolt-elements-bg-depth-2 hover:bg-bolt-elements-bg-depth-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <div className="i-ph:pencil-simple-bold text-lg" />
              <span>Request Revisions</span>
            </button>
          )}
          {onApprove && (
            <button
              onClick={handleApprove}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <div className="i-ph:check-bold text-lg" />
              <span>Approve & Start Building</span>
            </button>
          )}
        </div>
      )}

      {/* Plan Modal */}
      <PlanModal 
        plan={plan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApprove}
        onRevise={onRevise}
        userId={userId}
      />
    </div>
  );
}