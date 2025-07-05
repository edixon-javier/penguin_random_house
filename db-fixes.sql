-- Corregir políticas RLS para instalaciones
-- Primero, eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Acceso completo para autenticados" ON public.instalaciones;
DROP POLICY IF EXISTS "Permitir inserción anónima" ON public.instalaciones;
DROP POLICY IF EXISTS "Permitir lectura anónima" ON public.instalaciones;

-- Crear nueva política única que permite a usuarios anónimos insertar y a usuarios autenticados hacer todo
CREATE POLICY "Política universal instalaciones" ON public.instalaciones
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Corregir políticas RLS para piezas_instaladas
-- Primero, eliminar políticas existentes
DROP POLICY IF EXISTS "Acceso completo para autenticados" ON public.piezas_instaladas;
DROP POLICY IF EXISTS "Permitir inserción anónima" ON public.piezas_instaladas;
DROP POLICY IF EXISTS "Permitir lectura anónima" ON public.piezas_instaladas;

-- Crear nueva política única
CREATE POLICY "Política universal piezas" ON public.piezas_instaladas
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Configuración de Storage
-- Estas instrucciones deben ejecutarse en la consola SQL de Supabase
-- o crear buckets desde la interfaz de usuario y aplicar las políticas correctas

-- Crear los buckets si no existen
-- (Ejecutar estas instrucciones desde la UI de Supabase o API, no desde SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-librerias', 'fotos-librerias', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-espacios', 'fotos-espacios', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-piezas', 'fotos-piezas', true);

-- Políticas de Storage para anónimos (ejecutar desde SQL de Supabase)
CREATE POLICY "Política anónima fotos-librerias"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'fotos-librerias');

CREATE POLICY "Política anónima fotos-espacios"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'fotos-espacios');

CREATE POLICY "Política anónima fotos-piezas"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'fotos-piezas');

-- Políticas de Storage para usuarios autenticados
CREATE POLICY "Política autenticada fotos-librerias"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'fotos-librerias')
WITH CHECK (bucket_id = 'fotos-librerias');

CREATE POLICY "Política autenticada fotos-espacios"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'fotos-espacios')
WITH CHECK (bucket_id = 'fotos-espacios');

CREATE POLICY "Política autenticada fotos-piezas"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'fotos-piezas')
WITH CHECK (bucket_id = 'fotos-piezas');
