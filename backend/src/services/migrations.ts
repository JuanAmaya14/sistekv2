import pool from '../config/database';

const NEW_VALUES = ['Alta', 'Media', 'Baja'];

/**
 * Activa Row Level Security (RLS) en todas las tablas del esquema public.
 *
 * Por qué es necesario en Supabase: además de la conexión PostgreSQL que usa
 * este backend, Supabase publica automáticamente una API REST (PostgREST) sobre
 * el esquema `public`. Esa API se consume con la "anon key", que está pensada
 * para ir incrustada en aplicaciones cliente, es decir, NO es un secreto.
 * Los roles `anon` y `authenticated` tienen SELECT/INSERT/UPDATE/DELETE sobre
 * estas tablas, así que sin RLS cualquiera con esa clave podría leer los hashes
 * de contraseñas, los tokens de recuperación o cambiarse el rol a administrador,
 * saltándose por completo la autenticación y los permisos de esta API.
 *
 * Activar RLS sin definir políticas equivale a "denegar todo" para esos roles.
 * El backend no se ve afectado: conecta como `postgres`, que es dueño de las
 * tablas y tiene BYPASSRLS. Por eso NO se usa FORCE ROW LEVEL SECURITY, que sí
 * aplicaría las políticas también al dueño y dejaría la aplicación sin acceso.
 */
export const enableRowLevelSecurity = async (): Promise<void> => {
  await pool.query(`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relrowsecurity = FALSE
      LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
      END LOOP;
    END $$;
  `);
};

/**
 * Alinea la columna `tickets.priority` con los valores que usa la aplicación
 * (Alta / Media / Baja).
 *
 * Bases creadas con versiones anteriores tienen los valores antiguos
 * ('bajo', 'medio', 'alto', 'urgente'). Si se dejan así, `sequelize.sync`
 * falla al convertir el tipo porque los datos existentes no encajan en el
 * enum nuevo. Por eso se normaliza ANTES de sincronizar.
 *
 * Es idempotente: si los datos ya están normalizados no toca el esquema,
 * porque alterar el tipo con un CHECK que referencia el enum provocaría
 * "operator does not exist: character varying = enum_tickets_priority".
 */
export const normalizeTicketPriorities = async (): Promise<void> => {
  const tableExists = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'tickets'`
  );
  if (tableExists.rowCount === 0) return; // Base nueva: la crea Sequelize con el enum correcto

  // El cast a texto funciona tanto si la columna es enum como si es varchar
  const pendientes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM tickets WHERE priority::text <> ALL($1::text[])`,
    [NEW_VALUES]
  );

  if (pendientes.rows[0].n === 0) {
    return; // Ya está normalizada: no se toca el esquema
  }

  // Hay valores antiguos: se quitan las restricciones que bloquean el cambio de tipo
  await pool.query(`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'tickets'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%priority%'
      LOOP
        EXECUTE format('ALTER TABLE tickets DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END $$;
  `);

  await pool.query(`ALTER TABLE tickets ALTER COLUMN priority DROP DEFAULT`);
  await pool.query(
    `ALTER TABLE tickets ALTER COLUMN priority TYPE VARCHAR(50) USING priority::text`
  );

  // Traducir los valores antiguos a los actuales
  await pool.query(`UPDATE tickets SET priority = 'Alta'  WHERE priority IN ('alto', 'urgente', 'alta')`);
  await pool.query(`UPDATE tickets SET priority = 'Media' WHERE priority IN ('medio', 'media')`);
  await pool.query(`UPDATE tickets SET priority = 'Baja'  WHERE priority IN ('bajo', 'baja')`);

  // Cualquier valor inesperado pasa a 'Media' para no bloquear la conversión del tipo
  await pool.query(
    `UPDATE tickets SET priority = 'Media' WHERE priority <> ALL($1::text[])`,
    [NEW_VALUES]
  );

  // Eliminar el tipo enum antiguo si ya ninguna columna lo usa;
  // Sequelize lo recreará con los valores correctos al sincronizar.
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tickets_priority')
         AND NOT EXISTS (
           SELECT 1 FROM pg_attribute a
           JOIN pg_type t ON a.atttypid = t.oid
           WHERE t.typname = 'enum_tickets_priority' AND a.attisdropped = FALSE
         )
      THEN
        DROP TYPE "public"."enum_tickets_priority";
      END IF;
    END $$;
  `);
};
