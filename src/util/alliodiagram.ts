import {type Begin, type Diagram, type DiagramComponent} from '../schema/alliodiagram.js';

export type DiagramErrorDetail = {
  location: string[];
  severity: 'error' | 'warning';
  message: string;
};

export type ValidateResult<T> = {
  result: T | undefined;
  error: DiagramErrorDetail[];
};

export function generateIdToDiagramComponentMap(diagram: Diagram): ValidateResult<Map<string, DiagramComponent>> {
  const result = new Map<string, DiagramComponent>();
  const error: DiagramErrorDetail[] = [];
  for (let i = 0; i < diagram.content.length; i++) {
    const component = diagram.content[i];
    if (component.id) {
      if (result.has(component.id)) {
        error.push({location: ['content', i.toString(), 'id'], severity: 'error', message: 'component id should be unique'});
      } else {
        result.set(component.id, component);
      }
    } else {
      // Component without id is unreachable unless it is a transition
      // Note: we should not reach here as the schema require id field when component's type is not 'transition'
      if (component.type !== 'transition') {
        error.push({location: ['content', i.toString()], severity: 'warning', message: 'found unreachable diagram component'});
      }
    }
  }

  return {result, error};
}

export function getRootBeginComponent(diagram: Diagram): ValidateResult<Begin> {
  const begins = diagram.content.filter(element => element.type === 'begin');
  if (begins.length === 0) {
    return {
      result: undefined,
      error: [{location: ['content'], severity: 'error', message: 'diagram should start with a "Begin" block'}],
    };
  }

  if (begins.length > 1) {
    const error: DiagramErrorDetail[] = begins.map(begin => ({
      location: ['content', diagram.content.indexOf(begin).toString()],
      severity: 'error',
      message: 'only one root "Begin" block is allowed in a diagram',
    }));
    return {
      result: undefined,
      error,
    };
  }

  return {result: begins[0], error: []};
}

export function generateDiagramTransitionMap(diagram: Diagram, idToDiagramComponentMap: Map<string, DiagramComponent>): Map<DiagramComponent, DiagramComponent[]> {
  const result = new Map<DiagramComponent, DiagramComponent[]>();
  for (const component of diagram.content) {
    if (component.type === 'transition') {
      const source = idToDiagramComponentMap.get(component.from)!;
      const destination = idToDiagramComponentMap.get(component.to)!;
      if (result.has(source)) {
        result.get(source)!.push(component);
      } else {
        result.set(source, [component]);
      }
      if (result.has(component)) {
        result.get(component)!.push(destination);
      } else {
        result.set(component, [destination]);
      }
    }
  }

  return result;
}

