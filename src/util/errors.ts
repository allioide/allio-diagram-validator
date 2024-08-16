export class DiagramValidationErrorDetail {
  constructor(public line: number | undefined, public character: number | undefined, public severity: 'error' | 'warning', public message: string) {}
}

export class DiagramValidationError extends Error {
  detail: DiagramValidationErrorDetail[];

  constructor(detail: DiagramValidationErrorDetail[]) {
    super();
    this.detail = detail;
  }
}
