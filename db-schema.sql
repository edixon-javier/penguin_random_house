-- Tabla de instalaciones con todos los campos requeridos
CREATE TABLE public.instalaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre_libreria TEXT NOT NULL,
  sede TEXT,
  direccion_libreria TEXT,
  telefono TEXT,
  correo_electronico TEXT,
  nombre_administrador TEXT,
  horario_atencion_libreria TEXT,
  hora_inicio_instalacion TIMESTAMPTZ,
  hora_fin_instalacion TIMESTAMPTZ,
  latitud FLOAT8,
  longitud FLOAT8,
  fotos_libreria TEXT[],  -- Array de URLs a imágenes almacenadas en Storage
  horario_instalacion_publicidad TEXT,
  horario_entrega_paquetes TEXT,
  horario_instalacion_piezas TEXT,
  fotos_espacio_brandeado TEXT[],  -- Array de URLs a imágenes almacenadas en Storage
  comentarios TEXT,
  isevento BOOLEAN NOT NULL DEFAULT false,
  nombre_persona_recibe TEXT,
  cargo_persona_recibe TEXT
);

COMMENT ON TABLE public.instalaciones IS 'Almacena todos los registros de instalaciones publicitarias en librerías';

-- Tabla de piezas instaladas, relacionada con la tabla de instalaciones
CREATE TABLE public.piezas_instaladas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instalacion_id UUID NOT NULL REFERENCES public.instalaciones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre_pieza TEXT NOT NULL,
  medidas_pieza TEXT,
  fotos_pieza TEXT[]  -- Array de URLs a imágenes almacenadas en Storage
);

COMMENT ON TABLE public.piezas_instaladas IS 'Almacena información detallada de cada pieza instalada en una instalación';

-- Configurar políticas de seguridad para que cualquiera pueda insertar pero solo usuarios autenticados pueden leer/editar
ALTER TABLE public.instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piezas_instaladas ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo a usuarios autenticados para ambas tablas
CREATE POLICY "Acceso completo para autenticados" ON public.instalaciones
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso completo para autenticados" ON public.piezas_instaladas
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Permitir inserciones anónimas (sin autenticación)
CREATE POLICY "Permitir inserción anónima" ON public.instalaciones
  FOR INSERT WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Permitir inserción anónima" ON public.piezas_instaladas
  FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Permitir selecciones anónimas (para mostrar registros públicos)
CREATE POLICY "Permitir lectura anónima" ON public.instalaciones
  FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Permitir lectura anónima" ON public.piezas_instaladas
  FOR SELECT USING (auth.role() = 'anon');

-- Crear buckets de Storage para almacenar imágenes
-- Ejecutar en la UI de Supabase o mediante API:
-- 1. Bucket "fotos-librerias"
-- 2. Bucket "fotos-espacios"
-- 3. Bucket "fotos-piezas"

-- Índices para búsquedas comunes
CREATE INDEX idx_instalaciones_created_at ON public.instalaciones(created_at);
CREATE INDEX idx_instalaciones_nombre_libreria ON public.instalaciones(nombre_libreria);
CREATE INDEX idx_instalaciones_sede ON public.instalaciones(sede);
CREATE INDEX idx_piezas_instaladas_instalacion_id ON public.piezas_instaladas(instalacion_id);
