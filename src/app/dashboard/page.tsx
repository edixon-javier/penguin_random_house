import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardActions } from "@/components/features/dashboard-actions";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string; libreria?: string; sede?: string; fecha?: string };
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect("/auth/login");
  }
  
  // Parámetros de paginación y filtrado
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;
  
  // Construir la consulta con filtros opcionales
  let query = supabase.from("instalaciones").select("*", { count: "exact" });
  
  if (searchParams.libreria) {
    query = query.ilike("nombre_libreria", `%${searchParams.libreria}%`);
  }
  
  if (searchParams.sede) {
    query = query.ilike("sede", `%${searchParams.sede}%`);
  }
  
  if (searchParams.fecha) {
    // Filtrar por fecha, asumiendo formato YYYY-MM-DD
    query = query.gte("created_at", `${searchParams.fecha}T00:00:00`)
                .lt("created_at", `${searchParams.fecha}T23:59:59`);
  }
  
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(startIndex, endIndex);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>;
  }
  
  // Calcular total de páginas
  const totalPages = count ? Math.ceil(count / limit) : 1;
  
  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard de Instalaciones</h1>
        <Link
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nuevo Registro
        </Link>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Filtros</h2>
        <form className="flex flex-wrap gap-2">
          <input 
            type="text" 
            name="libreria" 
            placeholder="Librería"
            defaultValue={searchParams.libreria || ""} 
            className="border px-3 py-2 rounded"
          />
          <input 
            type="text" 
            name="sede" 
            placeholder="Sede"
            defaultValue={searchParams.sede || ""} 
            className="border px-3 py-2 rounded"
          />
          <input 
            type="date" 
            name="fecha" 
            placeholder="Fecha"
            defaultValue={searchParams.fecha || ""} 
            className="border px-3 py-2 rounded"
          />
          <button 
            type="submit"
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Buscar
          </button>
          <Link 
            href="/dashboard"
            className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
          >
            Limpiar
          </Link>
        </form>
      </div>
      
      {/* Tabla de instalaciones */}
      <div className="bg-white rounded shadow overflow-hidden">
        {data && data.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Librería
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sede
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((instalacion) => (
                <tr key={instalacion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/dashboard/ver/${instalacion.id}`} className="text-blue-600 hover:underline">
                      {instalacion.nombre_libreria}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {instalacion.sede || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(instalacion.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {instalacion.isevento ? 
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Evento
                      </span> : 
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Instalación
                      </span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/dashboard/ver/${instalacion.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </Link>
                      <Link 
                        href={`/dashboard/editar/${instalacion.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <DashboardActions id={instalacion.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No se encontraron registros
            {(searchParams.libreria || searchParams.sede || searchParams.fecha) && 
              " con los filtros aplicados"}
          </div>
        )}
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            {page > 1 && (
              <Link
                href={`/dashboard?page=${page - 1}${searchParams.libreria ? `&libreria=${searchParams.libreria}` : ''}${searchParams.sede ? `&sede=${searchParams.sede}` : ''}${searchParams.fecha ? `&fecha=${searchParams.fecha}` : ''}`}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 mr-2"
              >
                Anterior
              </Link>
            )}
            
            <span className="px-3 py-1">
              Página {page} de {totalPages}
            </span>
            
            {page < totalPages && (
              <Link
                href={`/dashboard?page=${page + 1}${searchParams.libreria ? `&libreria=${searchParams.libreria}` : ''}${searchParams.sede ? `&sede=${searchParams.sede}` : ''}${searchParams.fecha ? `&fecha=${searchParams.fecha}` : ''}`}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 ml-2"
              >
                Siguiente
              </Link>
            )}
          </nav>
        </div>
      )}
    </main>
  );
}
