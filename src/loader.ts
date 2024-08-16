import {Ajv, type ErrorObject} from 'ajv';
import {parse, YAMLParseError} from 'yaml';
import {getLocationForJsonPath, parseWithPointers, type YamlParserResult} from '@stoplight/yaml';
import {type ALLIODiagram} from './schema/alliodiagram.js';
import allioDiagramSchema from './schema/alliodiagram_ajv.json' with { type: 'json' };
import {DiagramValidationError, DiagramValidationErrorDetail} from './util/errors.js';

const ajv = new Ajv();
const validator = ajv.compile<ALLIODiagram>(allioDiagramSchema);

function shouldSkipErrorObject(error: ErrorObject): boolean {
  if (error.keyword === 'if' && error.message === 'must match "then" schema') {
    return true;
  }

  return false;
}

function parseAjvErrorObject(parseResult: YamlParserResult<unknown>, error: ErrorObject): DiagramValidationErrorDetail {
  const pathInYaml = error.instancePath.slice(1).split('/'); // '/diagrams/0/content' => ['diagrams', '0', 'content']
  let message = error.message ?? '-';

  // Replace error message or fix line number
  if (error.keyword === 'additionalProperties' && error.params.additionalProperty && error.message === 'must NOT have additional properties') {
    message = `found invalid key "${error.params.additionalProperty}"`;
    // 'error.instancePath' points to the begining of the yaml object instead of the incorrect key
    // thus we append the incorrect key to the path to get more accurate line number
    pathInYaml.push(error.params.additionalProperty as string);
  }

  const locationInYaml = getLocationForJsonPath(parseResult, pathInYaml);
  const line = locationInYaml?.range.start.line;
  return new DiagramValidationErrorDetail(line ? line + 1 : undefined, locationInYaml?.range.start.character, 'error', message);
}

export function loadDiagramFromString(fileContent: string): ALLIODiagram {
  let diagram;
  try {
    diagram = parse(fileContent) as unknown;
  } catch (error) {
    if (error instanceof YAMLParseError) {
      const linePos = error.linePos?.[0];
      throw new DiagramValidationError([new DiagramValidationErrorDetail(linePos?.line, linePos?.col, 'error', error.message)]);
    } else {
      throw error;
    }
  }

  if (!validator(diagram)) {
    const parseResult = parseWithPointers(fileContent);
    throw new DiagramValidationError(validator.errors!
      .filter(error => !shouldSkipErrorObject(error))
      .map(error => parseAjvErrorObject(parseResult, error)));
  }

  // TODO: additional validataion not cover by the schema
  return diagram;
}
