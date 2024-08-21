import {
  Ajv, type Options, type ValidateFunction, type ErrorObject,
} from 'ajv';
import {parse, YAMLParseError} from 'yaml';
import {getLocationForJsonPath, parseWithPointers, type YamlParserResult} from '@stoplight/yaml';
import {type DiagramComponent, type ALLIODiagram} from './schema/alliodiagram.js';
import allioDiagramSchema from './schema/alliodiagram_ajv.json' with { type: 'json' };
import {DiagramValidationError} from './util/errors.js';
import {
  type DiagramErrorDetail, generateDiagramTransitionMap, generateIdToDiagramComponentMap, getRootBeginComponent,
} from './util/alliodiagram.js';

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

function shouldSkipAjvErrorObject(error: ErrorObject): boolean {
  // Ajv emits this error alongside 'additionalProperties' when a required key is missing but we only need one error to present to the user
  if (error.keyword === 'if' && error.message === 'must match "then" schema') {
    return true;
  }

  if (error.keyword === 'anyOf' && error.message === 'must match a schema in anyOf') {
    return true;
  }

  return false;
}

function parseAjvErrorObject(parseResult: YamlParserResult<unknown>, error: ErrorObject): DiagramValidationError {
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
  const line = locationInYaml?.range.start.line; // Line number start at 0
  return new DiagramValidationError(line ? line + 1 : undefined, locationInYaml?.range.start.character, 'error', message);
}

// Convert DiagramErrorDetail return by most functions in './util/alliodiagram.ts' to DiagramValidationError by replace location with actual location in the YAML file
function parseDiagramErrorDetail(parseResult: YamlParserResult<unknown>, diagramIndex: number, detail: DiagramErrorDetail): DiagramValidationError {
  const locationInYaml = getLocationForJsonPath(parseResult, ['diagrams', diagramIndex.toString(), ...detail.location]);
  const line = locationInYaml?.range.start.line; // Line number start at 0
  return new DiagramValidationError(line ? line + 1 : undefined, locationInYaml?.range.start.character, detail.severity, detail.message);
}

function hasErrorWithSeverityError(detail: DiagramErrorDetail[]): boolean {
  return detail.find(element => element.severity === 'error') !== undefined;
}

export type DiagramLoaderResult = {
  diagram: ALLIODiagram | undefined;
  errors: DiagramValidationError[];
};

export function loadDiagramFromString(fileContent: string, verbose: boolean): DiagramLoaderResult {
  // Validate the syntax of the YAML file
  let diagramContent;
  try {
    diagramContent = parse(fileContent) as unknown;
  } catch (error) {
    if (error instanceof YAMLParseError) {
      const linePos = error.linePos?.[0];
      return {diagram: undefined, errors: [new DiagramValidationError(linePos?.line, linePos?.col, 'error', error.message)]};
    }

    throw error;
  }

  // Parse the file again to get the position in the YAML file. We don't use this function in the first step as the error message is less readable.
  const parseResult = parseWithPointers(fileContent);

  // Validate the parsed data based on the schema
  const validator = getAjvValidator(verbose);
  if (!validator(diagramContent)) {
    const set = new Set();
    const errors = validator.errors!
      .filter(error => !shouldSkipAjvErrorObject(error))
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
    return {diagram: undefined, errors};
  }

  const errors: DiagramValidationError[] = [];
  function appendError(diagramIndex: number, errorDetails: DiagramErrorDetail[]): boolean {
    if (errorDetails.length > 0) {
      errors.push(...errorDetails.map(element => parseDiagramErrorDetail(parseResult, diagramIndex, element)));
      if (hasErrorWithSeverityError(errorDetails)) {
        return true;
      }
    }

    return false;
  }

  // Additional validation not cover by the schema
  for (let i = 0; i < diagramContent.diagrams.length; i++) {
    const diagram = diagramContent.diagrams[i];

    // Validate component id
    const idToDiagramComponentMapResult = generateIdToDiagramComponentMap(diagram);
    if (appendError(i, idToDiagramComponentMapResult.error)) {
      break;
    }

    const idToDiagramComponentMap = idToDiagramComponentMapResult.result!;

    // Get root begin component
    const rootBeginComponentResult = getRootBeginComponent(diagram);
    if (appendError(i, rootBeginComponentResult.error)) {
      break;
    }

    const rootBegin = rootBeginComponentResult.result!;

    // Check component reachability
    const diagramTransitionMap = generateDiagramTransitionMap(diagram, idToDiagramComponentMap);
    const visited = new Set<DiagramComponent>();
    const queue: DiagramComponent[] = [rootBegin];
    while (queue.length > 0) {
      const currentComponent = queue.shift()!;
      visited.add(currentComponent);
      const children = diagramTransitionMap.get(currentComponent);
      if (children) {
        queue.push(...children.filter(component => !visited.has(component)));
      }
    }

    const unreachableComponents = diagram.content.filter(component => !visited.has(component));
    if (unreachableComponents.length > 0) {
      const errors: DiagramErrorDetail[] = unreachableComponents.map(component => ({
        location: ['content', diagram.content.indexOf(component).toString()],
        severity: 'warning',
        message: 'found unreachable diagram component',
      }));
      appendError(i, errors);
    }

    // TODO: additional validataion not cover by the schema
  }

  return {diagram: diagramContent, errors};
}
