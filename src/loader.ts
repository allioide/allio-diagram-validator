import {Ajv} from 'ajv';
import {parse} from 'yaml';
import {type ALLIODiagram} from './schema/alliodiagram.js';
import allioDiagramSchema from './schema/alliodiagram.json' with { type: 'json' };
import {DiagramValidationError} from './util/errors.js';

const ajv = new Ajv();
const validator = ajv.compile<ALLIODiagram>(allioDiagramSchema);

export function loadDiagramFromString(fileContent: string): ALLIODiagram {
  const diagram = parse(fileContent) as unknown;
  if (!validator(diagram)) {
    throw new DiagramValidationError(validator.errors!);
  }

  // TODO: additional validataion not cover by the schema
  return diagram;
}
