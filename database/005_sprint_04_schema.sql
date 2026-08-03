BEGIN;

CREATE TABLE pagos (
    id_pago INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_socio INTEGER NOT NULL,
    id_membresia INTEGER,
    monto NUMERIC(10, 2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL,
    comprobante_url VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones VARCHAR(255),
    verificado_por INTEGER,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pagos_socio
        FOREIGN KEY (id_socio)
        REFERENCES socios(id_socio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_pagos_membresia
        FOREIGN KEY (id_membresia)
        REFERENCES membresias(id_membresia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_pagos_verificado_por
        FOREIGN KEY (verificado_por)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_pagos_metodo
        CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'QR')),

    CONSTRAINT chk_pagos_estado
        CHECK (estado IN ('PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'ANULADO')),

    CONSTRAINT chk_pagos_monto
        CHECK (monto > 0)
);

CREATE INDEX idx_pagos_id_socio
    ON pagos(id_socio);

CREATE INDEX idx_pagos_id_membresia
    ON pagos(id_membresia);

CREATE INDEX idx_pagos_estado
    ON pagos(estado);

CREATE INDEX idx_pagos_fecha_pago
    ON pagos(fecha_pago);

COMMIT;
