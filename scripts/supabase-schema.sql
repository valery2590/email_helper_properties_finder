-- ==============================================================================
-- PROPFINDER BCN - TABLA DE PROPIEDADES EN SUPABASE
-- ==============================================================================
-- Instrucciones:
-- 1. Entra a tu proyecto en https://supabase.com/
-- 2. Ve a la pestaña "SQL Editor" en el menú de la izquierda.
-- 3. Pega este script completo y pulsa "Run" (botón verde).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Datos del inmueble
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    district TEXT DEFAULT 'Barcelona',
    location TEXT DEFAULT 'Barcelona',
    m2 NUMERIC,
    rooms INTEGER,
    bathrooms INTEGER,
    url TEXT,
    image_url TEXT,
    description TEXT,
    source TEXT DEFAULT 'gmail_alert',

    -- Veredicto financiero
    status TEXT NOT NULL,                     -- 'VIABLE', 'MODERATE_RISK', 'NOT_VIABLE'
    is_viable BOOLEAN DEFAULT TRUE,
    is_broker_viable BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 80,
    
    -- Escenario tradicional 80% LTV (Banca estándar)
    monthly_payment_80 NUMERIC,
    dti_percent_80 NUMERIC,
    total_upfront_80 NUMERIC,                 -- 20% entrada + 11.5% gastos
    shortfall_80 NUMERIC,                     -- Faltante tras los 32.629 €
    months_needed_80 INTEGER,                 -- Meses a 2.500 €/m cobro día 1
    target_date_80 TEXT,

    -- Mejor escenario con Broker (90%, 95% o 100% LTV)
    best_broker_ltv INTEGER,                  -- 90, 95 o 100
    monthly_payment_broker NUMERIC,
    dti_percent_broker NUMERIC,
    total_upfront_broker NUMERIC,
    shortfall_broker NUMERIC,
    months_needed_broker INTEGER,
    target_date_broker TEXT,

    -- Metadatos del correo de Gmail
    email_subject TEXT,
    email_from TEXT,
    email_date TIMESTAMPTZ
);

-- Índices para búsquedas rápidas por fecha y estado de viabilidad
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);

-- Habilitar Row Level Security (RLS) pero permitir lectura pública para la app
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de propiedades evaluadas" 
ON public.properties FOR SELECT 
USING (true);

CREATE POLICY "Inserción mediante Service Role o Anon Key" 
ON public.properties FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Eliminación mediante Anon o Service Role" 
ON public.properties FOR DELETE 
USING (true);
