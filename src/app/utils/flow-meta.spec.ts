import { FlowMeta } from '../services/admin';
import { flowComponentData } from './flow-meta';

const flow = [
  { name: 'router', data: { backends: [{ name: 'echo', host: 'echo.local', port: 8080 }] } },
] as unknown as FlowMeta[];

describe('flowComponentData', () => {
  it("returns the named component's data", () => {
    expect(flowComponentData(flow, 'router')?.backends?.map((b) => b.name)).toEqual(['echo']);
  });

  it('returns undefined for a component the flow does not have', () => {
    expect(flowComponentData(flow, 'oas-validator')).toBeUndefined();
  });
});
