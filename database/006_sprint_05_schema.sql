BEGIN;

CREATE TABLE registro_auditoria (
    id_auditoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad_afectada VARCHAR(50) NOT NULL,
    id_registro_afectado INTEGER,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalle TEXT,

    CONSTRAINT fk_registro_auditoria_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_registro_auditoria_id_usuario
    ON registro_auditoria(id_usuario);

CREATE INDEX idx_registro_auditoria_fecha
    ON registro_auditoria(fecha);

CREATE TABLE consulta_nutricional (
    id_consulta INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_socio INTEGER NOT NULL,
    imagen_url VARCHAR(255) NOT NULL,
    alimentos_detectados TEXT NOT NULL,
    calorias_estimadas NUMERIC(8, 2),
    proteinas_g NUMERIC(8, 2),
    carbohidratos_g NUMERIC(8, 2),
    grasas_g NUMERIC(8, 2),
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADO',
    fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consulta_nutricional_socio
        FOREIGN KEY (id_socio)
        REFERENCES socios(id_socio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_consulta_nutricional_estado
        CHECK (estado IN ('PROCESANDO', 'COMPLETADO', 'ERROR'))
);

CREATE INDEX idx_consulta_nutricional_id_socio
    ON consulta_nutricional(id_socio);

CREATE INDEX idx_consulta_nutricional_fecha
    ON consulta_nutricional(fecha_consulta);

COMMIT;
