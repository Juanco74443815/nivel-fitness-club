BEGIN;

INSERT INTO roles (
    nombre,
    descripcion
)
VALUES
    (
        'Administrador',
        'Gestiona usuarios, socios y configuraciones del sistema.'
    ),
    (
        'Recepcionista',
        'Realiza operaciones administrativas y atención de socios.'
    ),
    (
        'Socio',
        'Accede a las funciones disponibles para miembros del gimnasio.'
    )
ON CONFLICT (nombre) DO NOTHING;

COMMIT;