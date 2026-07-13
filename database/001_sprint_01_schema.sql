BEGIN;

CREATE TABLE roles (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_roles_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE usuarios (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol INTEGER NOT NULL,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    ci VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMPTZ,

    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE UNIQUE INDEX uq_usuarios_correo_lower
    ON usuarios (LOWER(correo));

CREATE TABLE socios (
    id_socio INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER UNIQUE,
    codigo_socio VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    ci VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    fecha_nacimiento DATE,
    fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_socios_usuarios
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_socios_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT chk_socios_fecha_nacimiento
        CHECK (
            fecha_nacimiento IS NULL
            OR fecha_nacimiento <= CURRENT_DATE
        )
);

CREATE UNIQUE INDEX uq_socios_correo_lower
    ON socios (LOWER(correo))
    WHERE correo IS NOT NULL;

CREATE TABLE tokens_recuperacion (
    id_token BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_uso TIMESTAMPTZ,

    CONSTRAINT fk_tokens_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_token_expiracion
        CHECK (fecha_expiracion > fecha_creacion),

    CONSTRAINT chk_token_fecha_uso
        CHECK (
            usado = FALSE
            OR fecha_uso IS NOT NULL
        )
);

CREATE INDEX idx_usuarios_id_rol
    ON usuarios(id_rol);

CREATE INDEX idx_usuarios_estado
    ON usuarios(estado);

CREATE INDEX idx_socios_estado
    ON socios(estado);

CREATE INDEX idx_tokens_usuario
    ON tokens_recuperacion(id_usuario);

CREATE INDEX idx_tokens_expiracion
    ON tokens_recuperacion(fecha_expiracion);

COMMIT;