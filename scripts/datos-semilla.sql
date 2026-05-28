-- scripts/datos-semilla.sql
-- Datos iniciales para pruebas del sistema

-- Período académico
INSERT INTO periodo_academico (codigo, nombre, anio, semestre, fecha_inicio, fecha_fin, fecha_inicio_clases, fecha_fin_clases, estado)
VALUES ('2026-I', '2026 - Primer Semestre', 2026, 1, '2026-03-01', '2026-07-31', '2026-03-15', '2026-07-15', 'asignacion_horarios');

-- Usuarios
INSERT INTO usuario (codigo, nombres, apellidos, correo_electronico, contrasena_hash, rol) VALUES
('ADMIN001', 'Carlos', 'Rodríguez', 'admin@unitru.edu.pe', '$2b$10$hash_ejemplo', 'administrador_sistema'),
('DOC001', 'Juan', 'Pérez', 'jperez@unitru.edu.pe', '$2b$10$hash_ejemplo', 'docente'),
('DOC002', 'María', 'García', 'mgarcia@unitru.edu.pe', '$2b$10$hash_ejemplo', 'docente'),
('DOC003', 'Pedro', 'Sánchez', 'psanchez@unitru.edu.pe', '$2b$10$hash_ejemplo', 'docente'),
('DOC004', 'Rosa', 'Martínez', 'rmartinez@unitru.edu.pe', '$2b$10$hash_ejemplo', 'docente'),
('OPER001', 'Ana', 'López', 'alopez@unitru.edu.pe', '$2b$10$hash_ejemplo', 'operador_horarios');

-- Docentes
INSERT INTO docente (id_usuario, codigo_docente, nombres, apellidos, modalidad, categoria, antiguedad, fecha_ingreso) VALUES
(2, 'DOC-001', 'Juan', 'Pérez Gómez', 'nombrado', 'principal', 15, '2011-03-01'),
(3, 'DOC-002', 'María', 'García López', 'nombrado', 'asociado', 10, '2016-03-01'),
(4, 'DOC-003', 'Pedro', 'Sánchez Díaz', 'contratado', 'auxiliar', 5, '2021-03-01'),
(5, 'DOC-004', 'Rosa', 'Martínez Ríos', 'nombrado', 'jefe_practica', 8, '2018-03-01');

-- Cursos
INSERT INTO curso (codigo, nombre, horas_teoria, horas_laboratorio, creditos, ciclo) VALUES
('SIS-101', 'Programación I', 4, 2, 5, 1),
('SIS-201', 'Estructura de Datos', 4, 2, 5, 3),
('SIS-301', 'Base de Datos', 4, 2, 5, 5),
('SIS-401', 'Ingeniería de Software', 4, 0, 4, 7);

-- Ambientes
INSERT INTO ambiente (codigo, nombre, tipo, capacidad, piso, pabellon, equipamiento) VALUES
('A-101', 'Aula 101', 'aula', 40, '1', 'A', 'Proyector, Pizarra acrílica'),
('A-102', 'Aula 102', 'aula', 35, '1', 'A', 'Proyector, Pizarra acrílica'),
('A-201', 'Aula 201', 'aula', 50, '2', 'A', 'Proyector, Pizarra acrílica, Aire acondicionado'),
('LAB-1', 'Laboratorio de Cómputo 1', 'laboratorio', 25, '1', 'B', '25 PC, Proyector, Aire acondicionado'),
('LAB-2', 'Laboratorio de Cómputo 2', 'laboratorio', 30, '1', 'B', '30 PC, Proyector, Aire acondicionado'),
('LAB-3', 'Laboratorio de Redes', 'laboratorio', 20, '2', 'B', '20 PC, Equipos de red, Proyector');

-- Curso-Ambiente (asignar ambientes válidos a cada curso)
INSERT INTO curso_ambiente (id_curso, id_ambiente, tipo_clase) VALUES
(1, 1, 'teoria'), (1, 2, 'teoria'), (1, 3, 'teoria'),  -- Prog I - Aulas
(1, 4, 'laboratorio'), (1, 5, 'laboratorio'),           -- Prog I - Labs
(2, 1, 'teoria'), (2, 2, 'teoria'), (2, 3, 'teoria'),  -- Estructura - Aulas
(2, 4, 'laboratorio'), (2, 5, 'laboratorio'),           -- Estructura - Labs
(3, 1, 'teoria'), (3, 2, 'teoria'),                     -- BD - Aulas
(3, 5, 'laboratorio'), (3, 6, 'laboratorio'),           -- BD - Labs
(4, 1, 'teoria'), (4, 3, 'teoria');                    -- Ing Software - Aulas

-- Docente-Curso (asignar cursos que puede dictar cada docente)
INSERT INTO docente_curso (id_docente, id_curso, tipo_clase) VALUES
(1, 1, 'teoria'), (1, 1, 'laboratorio'),  -- Juan Pérez - Prog I
(1, 2, 'teoria'),                          -- Juan Pérez - Estructura
(2, 1, 'teoria'), (2, 1, 'laboratorio'),  -- María García - Prog I
(2, 3, 'teoria'), (2, 3, 'laboratorio'),  -- María García - BD
(3, 4, 'teoria'),                          -- Pedro Sánchez - Ing Software
(4, 1, 'laboratorio'), (4, 2, 'laboratorio');  -- Rosa Martínez - Labs

-- Grupos
INSERT INTO grupo (id_curso, id_periodo, codigo_grupo, capacidad_maxima) VALUES
(1, 1, 'A', 40), (1, 1, 'B', 40),
(2, 1, 'A', 40), (2, 1, 'B', 35),
(3, 1, 'A', 35),
(4, 1, 'A', 45);
