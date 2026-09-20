import { Employee } from '../types';

/**
 * Generate a guaranteed unique employee ID like EMP001, EMP002, etc.
 * Scans all existing IDs to find the first unused integer.
 */
export function generateUniqueEmployeeId(
  existingEmployees: Employee[],
  prefix: string = 'EMP'
): string {
  const existingIdSet = new Set(
    existingEmployees
      .map((e) => (e.id || '').trim().toUpperCase())
      .filter(Boolean)
  );

  let counter = 1;
  while (true) {
    const candidate = `${prefix}${String(counter).padStart(3, '0')}`;
    if (!existingIdSet.has(candidate)) {
      return candidate;
    }
    counter++;
  }
}

/**
 * Check if a proposed employee ID is already in use by another employee.
 */
export function isEmployeeIdTaken(
  proposedId: string,
  currentEmployeeId: string | undefined,
  existingEmployees: Employee[]
): boolean {
  const formattedProposed = (proposedId || '').trim().toUpperCase();
  if (!formattedProposed) return false;

  const formattedCurrent = (currentEmployeeId || '').trim().toUpperCase();

  return existingEmployees.some((emp) => {
    const existingFormatted = (emp.id || '').trim().toUpperCase();
    return (
      existingFormatted === formattedProposed &&
      existingFormatted !== formattedCurrent
    );
  });
}

/**
 * Ensures that all employees in an array have unique, valid IDs.
 * If any employee has an empty, whitespace, or duplicate ID,
 * reassigns a new unique ID and returns the cleaned array along with
 * a mapping of old ID -> new ID for cascading updates.
 */
export function sanitizeUniqueEmployees(employees: Employee[]): {
  employees: Employee[];
  hasChanges: boolean;
  idChanges: Record<string, string>;
} {
  const seenIds = new Set<string>();
  const idChanges: Record<string, string> = {};
  let hasChanges = false;

  const result: Employee[] = [];

  for (let i = 0; i < employees.length; i++) {
    const emp = { ...employees[i] };
    const rawId = (emp.id || '').trim().toUpperCase();

    if (!rawId || seenIds.has(rawId)) {
      // Duplicate or empty ID detected! Assign a new unique ID
      hasChanges = true;
      let counter = 1;
      let candidate = `EMP${String(counter).padStart(3, '0')}`;
      while (seenIds.has(candidate) || employees.some((e, idx) => idx > i && (e.id || '').trim().toUpperCase() === candidate)) {
        counter++;
        candidate = `EMP${String(counter).padStart(3, '0')}`;
      }

      if (rawId) {
        idChanges[rawId] = candidate;
      }
      emp.id = candidate;
      seenIds.add(candidate);
    } else {
      emp.id = rawId;
      seenIds.add(rawId);
    }

    result.push(emp);
  }

  return {
    employees: result,
    hasChanges,
    idChanges,
  };
}
