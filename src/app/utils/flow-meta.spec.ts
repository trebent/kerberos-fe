import { FlowMeta } from '../services/admin';
import { componentsOnPath, describeFlowData, flowComponentData } from './flow-meta';

const flow = [
  { name: 'obs', data: {} },
  { name: 'router', data: { backends: [{ name: 'echo', host: 'echo.local', port: 8080 }] } },
  { name: 'oas-validator', data: { backends: ['echo'] } },
  { name: 'auth', data: { rules: [{ backend: 'other' }] } },
] as unknown as FlowMeta[];

describe('flowComponentData', () => {
  it("returns the named component's data", () => {
    expect(flowComponentData(flow, 'router')?.backends?.map((b) => b.name)).toEqual(['echo']);
  });

  it('returns undefined for a component the flow does not have', () => {
    expect(flowComponentData([], 'oas-validator')).toBeUndefined();
  });
});

describe('componentsOnPath', () => {
  it('includes the components every request passes and those that name the backend', () => {
    expect([...componentsOnPath(flow, 'echo')]).toEqual(['obs', 'router', 'oas-validator']);
    expect([...componentsOnPath(flow, 'other')]).toEqual(['obs', 'router', 'auth']);
  });
});

describe('describeFlowData', () => {
  it('writes records and lists as indented YAML-like lines', () => {
    const data = {
      name: 'router',
      empty: [],
      nothing: null,
      backends: [
        { name: 'echo', tags: ['a', 'b'], meta: { port: 1 }, gone: null },
        'plain',
        null,
        {},
        { rules: [{ path: '/x' }] },
      ],
      nested: { deeper: { value: 3 } },
    };

    expect(describeFlowData(data).split('\n')).toEqual([
      'name: router',
      'empty: []',
      'nothing:',
      'backends:',
      '  - name: echo',
      '    tags:',
      '      - a',
      '      - b',
      '    meta:',
      '      port: 1',
      '    gone:',
      '  - plain',
      '  - null',
      '  -',
      '  - rules:',
      '      - path: /x',
      'nested:',
      '  deeper:',
      '    value: 3',
    ]);
  });

  it('writes nothing for missing data and plain values as they are', () => {
    expect(describeFlowData(undefined)).toBe('');
    expect(describeFlowData('x')).toBe('x');
  });
});
