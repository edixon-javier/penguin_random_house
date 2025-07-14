export function FetchDataSteps() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p>
          Aquí están los siguientes pasos para comenzar:
        </p>
        <ul className="list-disc pl-6">
          <li>
            Revisar las instalaciones existentes en la sección de Dashboard
          </li>
          <li>
            Crear nuevas instalaciones usando el formulario
          </li>
          <li>
            Gestionar la información de librerías registradas
          </li>
        </ul>
      </div>
    </div>
  );
}
