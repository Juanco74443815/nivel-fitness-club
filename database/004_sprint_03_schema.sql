BEGIN;

CREATE TABLE planes_membresia (
    id_plan INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    duracion_dias INTEGER NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_planes_membresia_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT chk_planes_membresia_duracion
        CHECK (duracion_dias > 0),

    CONSTRAINT chk_planes_membresia_precio
        CHECK (precio > 0)
);

CREATE TABLE membresias (
    id_membresia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_socio INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    -- Justificación obligatoria (validada en el servicio) cuando el estado
    -- cambia a ANULADA, según HDU-27.
    motivo_anulacion VARCHAR(255),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_membresias_socio
        FOREIGN KEY (id_socio)
        REFERENCES socios(id_socio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_membresias_plan
        FOREIGN KEY (id_plan)
        REFERENCES planes_membresia(id_plan)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_membresias_estado
        CHECK (estado IN ('PENDIENTE', 'ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'ANULADA')),

    CONSTRAINT chk_membresias_fechas
        CHECK (fecha_fin > fecha_inicio)
);

-- Un socio solo puede tener una membresía vigente (PENDIENTE o ACTIVA) a la
-- vez (HDU-26, observación), aunque su historial acumule varias. Índice
-- único parcial, mismo patrón ya usado en reservas.
CREATE UNIQUE INDEX uq_membresias_socio_vigente
    ON membresias (id_socio)
    WHERE estado IN ('PENDIENTE', 'ACTIVA');

CREATE INDEX idx_planes_membresia_estado
    ON planes_membresia(estado);

CREATE INDEX idx_membresias_id_socio
    ON membresias(id_socio);

CREATE INDEX idx_membresias_id_plan
    ON membresias(id_plan);

CREATE INDEX idx_membresias_estado
    ON membresias(estado);

COMMIT;
