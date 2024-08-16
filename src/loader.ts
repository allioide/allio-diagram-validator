import {
  Ajv, type Options, type ValidateFunction, type ErrorObject,
} from 'ajv';
import {parse, YAMLParseError} from 'yaml';
import {getLocationForJsonPath, parseWithPointers, type YamlParserResult} from '@stoplight/yaml';
import {type ALLIODiagram} from './schema/alliodiagram.js';
import allioDiagramSchema from './schema/alliodiagram_ajv.json' with { type: 'json' };
import {DiagramValidationError, DiagramValidationErrorDetail} from './util/errors.js';

let cacheValidatorOption: Options | undefined;
let cacheValidator: ValidateFunction<ALLIODiagram> | undefined;

function getAjvValidator(verbose: boolean): ValidateFunction<ALLIODiagram> {
  const option = verbose ? {allErrors: true} : undefined;
  if (cacheValidatorOption !== option || cacheValidator === undefined) {
    cacheValidatorOption = option;
    cacheValidator = new Ajv(cacheValidatorOption).compile<ALLIODiagram>(allioDiagramSchema);
  }

  return cacheValidator;
}

function shouldSkipErrorObject(error: ErrorObject): boolean {
  // Ajv emits this error alongside 'additionalProperties' when a required key is missing but we only need one error to present to the user
  if (error.keyword === 'if' && error.message === 'must match "then" schema') {
    return true;
  }

  if (error.keyword === 'anyOf' && error.message === 'must match a schema in anyOf') {
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
  const line = locationInYaml?.range.start.line; // Ajv line number start at 0
  return new DiagramValidationErrorDetail(line ? line + 1 : undefined, locationInYaml?.range.start.character, 'error', message);
}

export function loadDiagramFromString(fileContent: string, verbose: boolean): ALLIODiagram {
  // Validate the syntax of the YAML file
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

  // Validate the parsed data based on the schema
  const validator = getAjvValidator(verbose);
  if (!validator(diagram)) {
    // Parse the file again to get the position in the YAML file. We don't use this function in the first step as the error message is less readable.
    const parseResult = parseWithPointers(fileContent);
    const set = new Set();
    const errors = validator.errors!
      .filter(error => !shouldSkipErrorObject(error))
      .map(error => parseAjvErrorObject(parseResult, error))
      // When verbose is true, Ajv return duplicated error when anyOf is used in the schema so we filter it here for readability
      .filter(error => {
        const errorAsString = JSON.stringify(error);
        if (!set.has(errorAsString)) {
          set.add(errorAsString);
          return true;
        }

        return false;
      });
    throw new DiagramValidationError(errors);
  }

  // TODO: additional validataion not cover by the schema
  return diagram;
}
