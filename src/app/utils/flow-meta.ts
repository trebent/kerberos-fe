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
