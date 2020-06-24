import { ValidationError } from 'yup';

interface Errors {
  [key: string]: string;
}
export default function getValidationErrors(err: ValidationError): Errors {
  const validationsErros: Errors = {};
  err.inner.forEach((error) => {
    validationsErros[error.path] = error.message;
  });
  console.log(validationsErros);
  return validationsErros;
}
