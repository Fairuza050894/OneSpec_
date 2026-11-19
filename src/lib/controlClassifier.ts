/**
 * OneSpec SDLC Workbench - Centralized Control Classifier & Sample Value Synthesizer
 * Ticket: T-17 (F-25, F-26)
 *
 * Rules:
 * - type=number | role=spinbutton -> NUMBER_SPINBUTTON (integer, min/max boundary testing)
 * - name/id matching /rows?-?per-?page|page-?size|limit/i -> PAGINATION_LIMIT (numeric enum [10, 25, 50, 100])
 * - select | combobox -> SELECT_COMBOBOX (pick from real options)
 * - placeholder DD/MM/YYYY or date -> DATE_PICKER (valid/invalid date)
 * - role=searchbox | type=search -> SEARCHBOX (only then search/filter scenarios are permitted)
 * - Halaman login: skenario hanya login valid, kredensial salah, field kosong, rate limit; NO search/filter scenarios.
 */

export type ControlKind =
  | 'PAGINATION_LIMIT'
  | 'NUMBER_SPINBUTTON'
  | 'SELECT_COMBOBOX'
  | 'DATE_PICKER'
  | 'SEARCHBOX'
  | 'PASSWORD_INPUT'
  | 'EMAIL_INPUT'
  | 'CHECKBOX_RADIO'
  | 'TEXT_INPUT';

export interface ControlElementAttributes {
  name?: string;
  id?: string;
  type?: string;
  role?: string;
  placeholder?: string;
  labelText?: string;
  ariaLabel?: string;
  optionsCount?: number;
  options?: string[];
  min?: number;
  max?: number;
}

export function determineControlKind(attrs: ControlElementAttributes): ControlKind {
  const nameStr = `${attrs.name || ''} ${attrs.id || ''} ${attrs.ariaLabel || ''} ${attrs.labelText || ''}`.trim();
  const typeStr = (attrs.type || '').toLowerCase();
  const roleStr = (attrs.role || '').toLowerCase();
  const placeholderStr = (attrs.placeholder || '').toLowerCase();

  // 1. Pagination / Page size / Rows per page (MUST be checked before generic number/select)
  if (
    /rows?-?per-?page|page-?size|pagination|table-?limit/i.test(nameStr) ||
    /rows?-?per-?page|page-?size/i.test(placeholderStr)
  ) {
    return 'PAGINATION_LIMIT';
  }

  // 2. Searchbox (role=searchbox or type=search or explicit search inputs)
  if (roleStr === 'searchbox' || typeStr === 'search' || /searchbox/i.test(roleStr)) {
    return 'SEARCHBOX';
  }

  // 3. Password
  if (typeStr === 'password' || /sandi|password|passcode/i.test(nameStr)) {
    return 'PASSWORD_INPUT';
  }

  // 4. Date Picker
  if (
    typeStr === 'date' ||
    /dd[/-]mm[/-]yyyy|yyyy[/-]mm[/-]dd/i.test(placeholderStr) ||
    /tanggal|date/i.test(nameStr)
  ) {
    return 'DATE_PICKER';
  }

  // 5. Number / Spinbutton
  if (typeStr === 'number' || roleStr === 'spinbutton') {
    return 'NUMBER_SPINBUTTON';
  }

  // 6. Select / Combobox
  if (
    typeStr === 'select' ||
    roleStr === 'combobox' ||
    roleStr === 'listbox' ||
    (attrs.optionsCount !== undefined && attrs.optionsCount > 0)
  ) {
    return 'SELECT_COMBOBOX';
  }

  // 7. Email
  if (typeStr === 'email' || /email/i.test(nameStr)) {
    return 'EMAIL_INPUT';
  }

  // 8. Checkbox / Radio
  if (typeStr === 'checkbox' || typeStr === 'radio' || roleStr === 'checkbox' || roleStr === 'radio') {
    return 'CHECKBOX_RADIO';
  }

  // Default text
  return 'TEXT_INPUT';
}

export interface ControlSampleValues {
  valid: string | number;
  invalid: string | number;
  boundary?: {
    belowMin: number | string;
    exactN: number | string;
    overLimit: number | string;
  };
}

export function getSampleValueForControl(attrs: ControlElementAttributes): ControlSampleValues {
  const kind = determineControlKind(attrs);

  switch (kind) {
    case 'PAGINATION_LIMIT': {
      // Numerical enum [10, 25, 50, 100] or real option. NEVER arbitrary string like JKT-SUB-001!
      let validVal = 25;
      if (attrs.options && attrs.options.length > 0) {
        const parsed = Number(attrs.options[0]);
        if (!isNaN(parsed) && parsed > 0) {
          validVal = parsed;
        }
      }
      return {
        valid: validVal,
        invalid: -1,
        boundary: {
          belowMin: 0,
          exactN: 100,
          overLimit: 101,
        },
      };
    }
    case 'NUMBER_SPINBUTTON': {
      const min = attrs.min !== undefined ? attrs.min : 1;
      const max = attrs.max !== undefined ? attrs.max : 1000;
      const validVal = Math.round((min + max) / 2);
      return {
        valid: validVal,
        invalid: min - 1,
        boundary: {
          belowMin: min - 1,
          exactN: max,
          overLimit: max + 1,
        },
      };
    }
    case 'SELECT_COMBOBOX': {
      const validVal =
        attrs.options && attrs.options.length > 0
          ? attrs.options[0]
          : attrs.placeholder || 'OPTION_1';
      return {
        valid: validVal,
        invalid: '__UNAUTHORIZED_OPTION_999__',
      };
    }
    case 'DATE_PICKER': {
      const isDmy = /dd[/-]mm[/-]yyyy/i.test(attrs.placeholder || '');
      return {
        valid: isDmy ? '20/11/2026' : '2026-11-20',
        invalid: isDmy ? '31/02/2026' : '2026-02-31',
      };
    }
    case 'SEARCHBOX': {
      return {
        valid: 'Query Data',
        invalid: '__INVALID_QUERY_999__',
      };
    }
    case 'PASSWORD_INPUT': {
      return {
        valid: 'P@ssw0rd_Valid2026!',
        invalid: '',
      };
    }
    case 'EMAIL_INPUT': {
      return {
        valid: 'operator@enterprise.co.id',
        invalid: 'invalid-email-format@@',
      };
    }
    case 'CHECKBOX_RADIO': {
      return {
        valid: 'true',
        invalid: 'false',
      };
    }
    case 'TEXT_INPUT':
    default: {
      return {
        valid: attrs.placeholder || 'Sample Text',
        invalid: '',
      };
    }
  }
}
