/**
 * Utilities for detecting and parsing structured project plans from AI responses
 */

export interface StructuredPlan {
  title: string;
  overview: {
    vision?: string;
    targetUsers?: string;
    coreValueProposition?: string;
  };
  requirements: {
    functional?: string[];
    nonFunctional?: string[];
    userExperience?: string[];
  };
  architecture: {
    frontend?: string;
    backend?: string;
    infrastructure?: string;
  };
  roadmap: {
    phase1?: string;
    phase2?: string;
    phase3?: string;
  };
  structure?: string;
  considerations?: string;
  nextSteps?: string;
  rawContent: string;
}

/**
 * Detects if a message content contains a structured project plan
 * @param content The message content to check
 * @returns true if content contains a structured plan marker
 */
export function isStructuredPlan(content: string): boolean {
  return content.includes('## 📋 STRUCTURED PROJECT PLAN');
}

/**
 * Parses a structured plan from message content
 * @param content The message content containing the plan
 * @returns Parsed structured plan object or null if parsing fails
 */
export function parseStructuredPlan(content: string): StructuredPlan | null {
  if (!isStructuredPlan(content)) {
    return null;
  }

  try {
    // Extract the plan content after the marker
    const planStart = content.indexOf('## 📋 STRUCTURED PROJECT PLAN');
    const planContent = content.substring(planStart);

    // Extract title
    const titleMatch = planContent.match(/# Project Plan: (.+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Project';

    // Parse sections using regex
    const sections = {
      overview: extractSection(planContent, '## Project Overview'),
      requirements: extractSection(planContent, '## Requirements'),
      architecture: extractSection(planContent, '## Architecture & Tech Stack'),
      roadmap: extractSection(planContent, '## Implementation Roadmap'),
      structure: extractSection(planContent, '## Project Structure'),
      considerations: extractSection(planContent, '## Considerations & Risks'),
      nextSteps: extractSection(planContent, '## Next Steps'),
    };

    return {
      title,
      overview: parseOverviewSection(sections.overview),
      requirements: parseRequirementsSection(sections.requirements),
      architecture: parseArchitectureSection(sections.architecture),
      roadmap: parseRoadmapSection(sections.roadmap),
      structure: sections.structure,
      considerations: sections.considerations,
      nextSteps: sections.nextSteps,
      rawContent: planContent,
    };
  } catch (error) {
    console.error('Failed to parse structured plan:', error);
    return null;
  }
}

/**
 * Extracts a section from the plan content
 */
function extractSection(content: string, sectionHeader: string): string {
  const sectionStart = content.indexOf(sectionHeader);
  if (sectionStart === -1) return '';

  const nextSectionMatch = content.substring(sectionStart + sectionHeader.length).match(/\n## /);
  const sectionEnd = nextSectionMatch 
    ? sectionStart + sectionHeader.length + nextSectionMatch.index!
    : content.length;

  return content.substring(sectionStart + sectionHeader.length, sectionEnd).trim();
}

/**
 * Parses the overview section
 */
function parseOverviewSection(content: string): StructuredPlan['overview'] {
  const vision = extractBulletPoint(content, 'Vision');
  const targetUsers = extractBulletPoint(content, 'Target Users');
  const coreValueProposition = extractBulletPoint(content, 'Core Value Proposition');

  return { vision, targetUsers, coreValueProposition };
}

/**
 * Parses the requirements section
 */
function parseRequirementsSection(content: string): StructuredPlan['requirements'] {
  const functional = extractSubsectionItems(content, 'Functional Requirements');
  const nonFunctional = extractSubsectionItems(content, 'Non-Functional Requirements');
  const userExperience = extractSubsectionItems(content, 'User Experience Requirements');

  return { functional, nonFunctional, userExperience };
}

/**
 * Parses the architecture section
 */
function parseArchitectureSection(content: string): StructuredPlan['architecture'] {
  const frontend = extractSubsectionText(content, 'Frontend');
  const backend = extractSubsectionText(content, 'Backend');
  const infrastructure = extractSubsectionText(content, 'Infrastructure');

  return { frontend, backend, infrastructure };
}

/**
 * Parses the roadmap section
 */
function parseRoadmapSection(content: string): StructuredPlan['roadmap'] {
  const phase1 = extractSubsectionText(content, 'Phase 1');
  const phase2 = extractSubsectionText(content, 'Phase 2');
  const phase3 = extractSubsectionText(content, 'Phase 3');

  return { phase1, phase2, phase3 };
}

/**
 * Extracts bullet point content for a specific key
 */
function extractBulletPoint(content: string, key: string): string | undefined {
  const regex = new RegExp(`- \\*\\*${key}\\*\\*:?\\s*(.+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

/**
 * Extracts items from a subsection (list items)
 */
function extractSubsectionItems(content: string, subsection: string): string[] | undefined {
  const subsectionStart = content.indexOf(`### ${subsection}`);
  if (subsectionStart === -1) return undefined;

  const nextSubsectionMatch = content.substring(subsectionStart + subsection.length).match(/\n### /);
  const subsectionEnd = nextSubsectionMatch 
    ? subsectionStart + subsection.length + nextSubsectionMatch.index!
    : content.length;

  const subsectionContent = content.substring(subsectionStart + subsection.length, subsectionEnd);
  
  // Extract list items
  const items = subsectionContent.match(/^- (.+)$/gm);
  return items ? items.map(item => item.substring(2).trim()) : undefined;
}

/**
 * Extracts text from a subsection
 */
function extractSubsectionText(content: string, subsection: string): string | undefined {
  const subsectionStart = content.indexOf(`### ${subsection}`);
  if (subsectionStart === -1) return undefined;

  const nextSubsectionMatch = content.substring(subsectionStart + subsection.length).match(/\n### /);
  const subsectionEnd = nextSubsectionMatch 
    ? subsectionStart + subsection.length + nextSubsectionMatch.index!
    : content.length;

  const subsectionContent = content.substring(subsectionStart + subsection.length, subsectionEnd).trim();
  return subsectionContent || undefined;
}