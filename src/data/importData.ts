import { normalizeActivities, resolveReferenceDate } from '../analytics';
import type { DemoData } from '../types';

const SUPPORTED_FIELDS = new Set(['activities']);
const LEGACY_FIELDS = new Set(['timelineEvents', 'interests', 'skills']);

export interface ImportValidationReport {
  totalActivityRecords: number;
  validActivityRecords: number;
  invalidActivityRecords: number;
  malformedOptionalValues: number;
  unsupportedFields: string[];
}

export interface ImportIssue {
  severity: 'error' | 'warning';
  code: 'invalid-payload' | 'missing-activities' | 'empty-import' | 'unsupported-field' | 'activity-warning' | 'activity-rejected' | 'missing-reference-date';
  message: string;
  field?: string;
  activityIndex?: number;
}

export interface PreparedImport {
  data: DemoData;
  referenceDate: Date;
  warnings: ImportIssue[];
  report: ImportValidationReport;
}

export type ImportValidationResult =
  | { ok: true; value: PreparedImport }
  | {
      ok: false;
      errors: ImportIssue[];
      warnings: ImportIssue[];
      report: ImportValidationReport;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeUnsupportedField(field: string, value: unknown): ImportIssue {
  const base = {
    severity: 'warning' as const,
    code: 'unsupported-field' as const,
    field,
  };

  if (!LEGACY_FIELDS.has(field)) {
    return { ...base, message: `Unsupported field "${field}" was ignored.` };
  }

  if (!Array.isArray(value)) {
    return { ...base, message: `Legacy field "${field}" has a malformed value and was ignored.` };
  }

  const malformedEntries = value.filter(entry => !isRecord(entry)).length;
  if (malformedEntries > 0) {
    return { ...base, message: `Legacy field "${field}" was ignored; it also contains ${malformedEntries} malformed ${malformedEntries === 1 ? 'entry' : 'entries'}.` };
  }

  return { ...base, message: `Legacy field "${field}" is not used by Signal V2 and was ignored (${value.length} ${value.length === 1 ? 'entry' : 'entries'}).` };
}

function emptyReport(): ImportValidationReport {
  return {
    totalActivityRecords: 0,
    validActivityRecords: 0,
    invalidActivityRecords: 0,
    malformedOptionalValues: 0,
    unsupportedFields: [],
  };
}

/**
 * Validates the complete import payload before it can replace active data.
 * Signal V2 accepts only normalized activities; legacy V1 collections are
 * reported and deliberately kept out of the runtime dataset.
 */
export function validateImportedData(payload: unknown): ImportValidationResult {
  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: [{
        severity: 'error',
        code: 'invalid-payload',
        message: 'The JSON root must be an object containing an "activities" array.',
      }],
      warnings: [],
      report: emptyReport(),
    };
  }

  const unsupportedFields = Object.keys(payload).filter(field => !SUPPORTED_FIELDS.has(field));
  const warnings = unsupportedFields.map(field => describeUnsupportedField(field, payload[field]));

  if (!Array.isArray(payload.activities)) {
    return {
      ok: false,
      errors: [{
        severity: 'error',
        code: 'missing-activities',
        field: 'activities',
        message: 'Missing or invalid "activities" array.',
      }],
      warnings,
      report: {
        ...emptyReport(),
        unsupportedFields,
      },
    };
  }

  const normalization = normalizeActivities(payload.activities);
  const report: ImportValidationReport = {
    totalActivityRecords: payload.activities.length,
    validActivityRecords: normalization.activities.length,
    invalidActivityRecords: normalization.rejected.length,
    malformedOptionalValues: normalization.warnings.filter(issue => issue.code === 'malformed-optional-value').length,
    unsupportedFields,
  };

  warnings.push(...normalization.warnings.map(issue => ({
    severity: 'warning' as const,
    code: 'activity-warning' as const,
    activityIndex: issue.index,
    field: issue.field,
    message: issue.message,
  })));
  warnings.push(
    ...normalization.rejected.map(({ index, issues }) => {
      const detail = issues.map(issue => issue.message).join(' ');
      return {
        severity: 'warning' as const,
        code: 'activity-rejected' as const,
        activityIndex: index,
        message: `Activity ${index + 1} was quarantined. ${detail}`,
      };
    })
  );

  if (normalization.activities.length === 0) {
    const message = payload.activities.length === 0
      ? 'The activities array is empty. Import at least one valid activity.'
      : `No usable activities were found. ${normalization.rejected.length} ${normalization.rejected.length === 1 ? 'record was' : 'records were'} rejected.`;

    return {
      ok: false,
      errors: [{ severity: 'error', code: 'empty-import', field: 'activities', message }],
      warnings,
      report,
    };
  }

  const referenceDate = resolveReferenceDate(normalization.activities);
  if (!referenceDate) {
    return {
      ok: false,
      errors: [{
        severity: 'error',
        code: 'missing-reference-date',
        message: 'A reference date could not be resolved from the valid activities.',
      }],
      warnings,
      report,
    };
  }

  return {
    ok: true,
    value: {
      data: {
        activities: normalization.activities.map(activity => ({ ...activity, source: 'json' as const })),
        timelineEvents: [],
        interests: [],
        skills: [],
      },
      referenceDate,
      warnings,
      report,
    },
  };
}
