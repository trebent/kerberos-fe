import { FlowMeta, FlowMetaDataOAS, FlowMetaDataRouter } from '../services/admin';

/**
 * The shape of `data` for the flow components the app reads, by component name. The admin spec
 * declares `data` as a oneOf, which the generated client merges into one `FlowMetaData` type
 * holding only the shared fields, so the name is what tells the shapes apart.
 */
interface FlowComponentData {
  router: FlowMetaDataRouter;
  'oas-validator': FlowMetaDataOAS;
}

/** The data of the named component in a flow, or undefined if the flow has no such component. */
export function flowComponentData<Name extends keyof FlowComponentData>(
  flow: readonly FlowMeta[],
  name: Name,
): FlowComponentData[Name] | undefined {
  const component = flow.find((candidate) => candidate.name === name);
  return component?.data as unknown as FlowComponentData[Name] | undefined;
}

/** Components every request passes through, whichever backend it is routed to. */
const ALWAYS_ON_PATH = new Set(['obs', 'router', 'forwarder']);

/** The names of the flow components a request to `backend` passes through. */
export function componentsOnPath(flow: readonly FlowMeta[], backend: string): Set<string> {
  return new Set(
    flow
      .filter(
        (component) =>
          ALWAYS_ON_PATH.has(component.name) || mentionsBackend(component.data, backend),
      )
      .map((component) => component.name),
  );
}

/** Whether `data`, at any depth, names `backend` in a `backend` or `backends` field. */
function mentionsBackend(data: unknown, backend: string): boolean {
  if (Array.isArray(data)) return data.some((item) => mentionsBackend(item, backend));
  if (!isRecord(data)) return false;
  return Object.entries(data).some(
    ([key, value]) =>
      (key === 'backend' && value === backend) ||
      (key === 'backends' && Array.isArray(value) && value.includes(backend)) ||
      mentionsBackend(value, backend),
  );
}

/** A flow component's data as indented, YAML-like text, for its tooltip. */
export function describeFlowData(data: unknown): string {
  if (data === null || data === undefined) return '';
  if (!isRecord(data)) return String(data);
  return entryLines(data, '').join('\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `key: value` lines, with nested records and lists indented under their key. */
function entryLines(record: Record<string, unknown>, indent: string): string[] {
  return Object.entries(record).flatMap(([key, value]) => {
    if (value === null || value === undefined) return [`${indent}${key}:`];
    if (Array.isArray(value)) {
      if (value.length === 0) return [`${indent}${key}: []`];
      return [`${indent}${key}:`, ...value.flatMap((item) => itemLines(item, `${indent}  `))];
    }
    if (isRecord(value)) return [`${indent}${key}:`, ...entryLines(value, `${indent}  `)];
    return [`${indent}${key}: ${value}`];
  });
}

/** One list item: `- value`, or a record whose first entry follows the dash. */
function itemLines(item: unknown, indent: string): string[] {
  if (!isRecord(item)) return [`${indent}- ${item ?? 'null'}`];
  const [first, ...rest] = entryLines(item, `${indent}  `);
  if (first === undefined) return [`${indent}-`];
  return [`${indent}- ${first.trimStart()}`, ...rest];
}
