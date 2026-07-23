BEGIN;

CREATE TABLE clases (
    id_clase INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    instructor VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_clases_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE programaciones_clase (
    id_programacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_clase INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cupo_maximo INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_programaciones_clase
        FOREIGN KEY (id_clase)
        REFERENCES clases(id_clase)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_programaciones_estado
        CHECK (estado IN ('PROGRAMADA', 'CANCELADA', 'FINALIZADA')),

    CONSTRAINT chk_programaciones_horario
        CHECK (hora_fin > hora_inicio),

    CONSTRAINT chk_programaciones_cupo
        CHECK (cupo_maximo > 0)
);

CREATE TABLE reservas (
    id_reserva INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_socio INTEGER NOT NULL,
    id_programacion INTEGER NOT NULL,
    fecha_reserva TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservas_socio
        FOREIGN KEY (id_socio)
        REFERENCES socios(id_socio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reservas_programacion
        FOREIGN KEY (id_programacion)
        REFERENCES programaciones_clase(id_programacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_reservas_estado
        CHECK (estado IN ('ACTIVA', 'CANCELADA', 'FINALIZADA'))
);

-- Impide que un mismo socio tenga más de una reserva ACTIVA sobre la misma
-- sesión programada. Es un índice único parcial (no una restricción UNIQUE
-- simple sobre toda la tabla) para permitir que un socio vuelva a reservar
-- la misma sesión después de cancelar una reserva anterior.
CREATE UNIQUE INDEX uq_reservas_socio_programacion_activa
    ON reservas (id_socio, id_programacion)
    WHERE estado = 'ACTIVA';

CREATE INDEX idx_programaciones_clase_id_clase
    ON programaciones_clase(id_clase);

CREATE INDEX idx_programaciones_clase_estado
    ON programaciones_clase(estado);

CREATE INDEX idx_reservas_id_programacion
    ON reservas(id_programacion);

CREATE INDEX idx_reservas_id_socio
    ON reservas(id_socio);

CREATE INDEX idx_reservas_estado
    ON reservas(estado);

COMMIT;
