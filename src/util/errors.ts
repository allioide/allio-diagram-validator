export class DiagramValidationError {
  constructor(public line: number | undefined, public character: number | undefined, public severity: 'error' | 'warning', public message: string) {}
}
