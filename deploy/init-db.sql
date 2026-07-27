-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 24-04-2026 a las 21:20:06
-- Versión del servidor: 8.0.44
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gestorpincadb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bodegas`
--

CREATE TABLE `bodegas` (
  `id_bodegas` int NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `estado` tinyint DEFAULT NULL COMMENT '0 inactiva 1 activa',
  `instalaciones_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bodegas`
--

INSERT INTO `bodegas` (`id_bodegas`, `nombre`, `descripcion`, `estado`, `instalaciones_id`) VALUES
(1, 'Bodega principal', 'BODEGA INSUMOS, MATERIAS PRIMAS Y PRODUCTOS', 1, 1),
(2, 'Bodega 1', 'Aditivos técnicos, impermeabilizantes de alto desempeño y maquinaria pesada.', 1, 2),
(3, 'Juan Mina', 'Punto estratégico en la Vía Cordialidad, orientado al manejo de inventarios y distribución regional, con conexiones hacia rutas intermunicipales.', 1, 3),
(8, 'Laboratorio', 'Área de bodega con acondicionamiento tipo laboratorio', 1, 1),
(15, 'Centro de insumos', 'Área destinada al almacenamiento y distribución de insumos.', 1, 1),
(16, 'Depósito especializado', 'Espacio seguro para almacenamiento bajo condiciones controladas.', 0, 1),
(18, 'Bodega 2', 'Resinas base, solventes y una amplia gama de pinturas para acabados horneables.', 1, 2),
(19, 'Bodega 3', 'Estación de colorimetría con pastas pigmentadas, anticorrosivos y productos listos para despacho.', 1, 2),
(21, 'Patio', 'Almacenamiento masivo de solventes industriales, aglutinantes y selladores por volumen.', 1, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria`
--

CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL,
  `nombre` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `categoria`
--

INSERT INTO `categoria` (`id_categoria`, `nombre`) VALUES
(1, 'ESMALTE'),
(2, 'PASTA'),
(3, 'ANTICORROSIVO'),
(4, 'BARNIZ');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_clientes` int NOT NULL,
  `nombre_encargado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nombre_empresa` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `numero_documento` bigint DEFAULT NULL,
  `direccion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ciudad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `plazo_pago` int DEFAULT '30' COMMENT 'Días de plazo: 0, 15, 30, 60, 90',
  `telefono` bigint DEFAULT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` tinyint NOT NULL DEFAULT '2' COMMENT '1 Empresa 2 Particular',
  `estado` tinyint NOT NULL DEFAULT '1' COMMENT '1 activo 2 inactivo',
  `dias_credito` int DEFAULT '30' COMMENT 'Plazo de pago en días',
  `limite_credito` decimal(12,2) DEFAULT '0.00' COMMENT 'Cupo máximo de crédito',
  `credito_usado` decimal(12,2) DEFAULT '0.00' COMMENT 'Suma de saldos pendientes activos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_clientes`, `nombre_encargado`, `nombre_empresa`, `numero_documento`, `direccion`, `ciudad`, `plazo_pago`, `telefono`, `email`, `tipo`, `estado`, `dias_credito`, `limite_credito`, `credito_usado`) VALUES
(1, 'Carlos Mendoza', 'Distribuidora Andina S.A.S', 900123456, 'Calle 45 #32-10, Barranquilla', NULL, 30, 3014567890, 'c.mendoza@andina.com', 2, 1, 30, 5000000.00, 125000.00),
(2, 'Juliana Pérez', 'Soluciones del Caribe Ltda', 801987654, 'Carrera 21 #55-22, Cartagena', NULL, 30, 3157894321, 'juliana.perez@caribe.com', 1, 2, 60, 10000000.00, 0.00),
(3, 'Mauricio Torres', 'Pinturas Torres & Cía', 1023456789, 'Av. Murillo #12-80, Barranquilla', NULL, 30, 3001122334, 'm.torres@ptorres.com', 2, 1, 30, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `costos_indirectos`
--

CREATE TABLE `costos_indirectos` (
  `id_costos_indirectos` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `categoria` enum('servicios','mano_de_obra','instalaciones','otros') NOT NULL,
  `valor_mensual` decimal(15,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_actualizacion` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `costos_item`
--

CREATE TABLE `costos_item` (
  `id_costos_item` int NOT NULL,
  `item_general_id` int NOT NULL,
  `costo_unitario` decimal(18,2) DEFAULT NULL,
  `costo_mp_galon` decimal(10,0) DEFAULT NULL,
  `costo_cunete` decimal(10,0) NOT NULL,
  `costo_tambor` decimal(10,0) NOT NULL,
  `periodo` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `metodo_calculo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_calculo` date DEFAULT NULL,
  `costo_mp_kg` decimal(10,0) DEFAULT NULL,
  `envase` decimal(18,2) DEFAULT NULL,
  `etiqueta` decimal(18,2) DEFAULT NULL,
  `bandeja` decimal(10,0) DEFAULT NULL,
  `plastico` decimal(10,0) DEFAULT NULL,
  `volumen` decimal(10,0) DEFAULT NULL,
  `precio_venta` decimal(18,2) DEFAULT NULL,
  `cantidad_total` decimal(10,0) DEFAULT NULL,
  `costo_mod` decimal(10,0) DEFAULT NULL COMMENT '0  inactivo\r\n1 activo',
  `estado` tinyint DEFAULT NULL,
  `porcentaje_utilidad` decimal(10,0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `costos_item`
--

INSERT INTO `costos_item` (`id_costos_item`, `item_general_id`, `costo_unitario`, `costo_mp_galon`, `costo_cunete`, `costo_tambor`, `periodo`, `metodo_calculo`, `fecha_calculo`, `costo_mp_kg`, `envase`, `etiqueta`, `bandeja`, `plastico`, `volumen`, `precio_venta`, `cantidad_total`, `costo_mod`, `estado`, `porcentaje_utilidad`) VALUES
(1, 1, 0.00, 2000, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 4200.00, 350.00, 140, 153, 370, 2000.00, 0, 600, NULL, 20),
(2, 31, 7000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(3, 32, 11000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(4, 33, 34050.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(5, 34, 27144.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(6, 35, 12691.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(7, 36, 4372.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(8, 37, 11466.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(9, 38, 16300.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(10, 39, 17000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(11, 40, 4400.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(12, 41, 14300.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(13, 42, 40.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(14, 43, 1550.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(15, 44, 4617.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(17, 46, 14300.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(18, 47, 855.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(19, 48, 5400.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(21, 50, 12215.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(23, 52, 14152.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(25, 54, 12718.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(27, 56, 11447.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(28, 57, 1690.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(30, 59, 722.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(31, 60, 715.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(32, 61, 4300.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(33, 62, 4400.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(34, 63, 8000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(35, 64, 8000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(36, 65, 1103.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(37, 66, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(38, 67, 43900.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(39, 68, 37300.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(40, 69, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(41, 70, 7000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(42, 71, 19500.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(43, 72, 33500.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(44, 73, 37200.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(45, 74, 21850.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(46, 75, 10400.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(47, 76, 8000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(48, 77, 11466.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(49, 78, 13000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(50, 79, 17000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(51, 80, 2900.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(52, 81, 17000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(54, 83, 4617.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(55, 84, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(56, 85, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(57, 86, 11000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(58, 2, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 719, 20000.00, 0, 600, NULL, 40),
(59, 3, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 398, 170000.00, 0, 600, NULL, NULL),
(60, 4, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 440, 0.00, 0, 600, NULL, NULL),
(61, 5, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 376, 0.00, 0, 600, NULL, NULL),
(62, 6, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 397, 0.00, 0, 600, NULL, NULL),
(63, 7, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 396, 0.00, 0, 600, NULL, NULL),
(64, 8, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 712, 0.00, 0, 600, NULL, NULL),
(65, 9, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 616, 0.00, 0, 600, NULL, NULL),
(66, 10, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 711, 0.00, 0, 600, NULL, NULL),
(67, 11, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 595, 0.00, 0, 600, NULL, NULL),
(68, 12, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 599, 0.00, 0, 600, NULL, NULL),
(69, 13, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 578, 0.00, 0, 600, NULL, NULL),
(70, 14, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 813, 0.00, 0, 600, NULL, NULL),
(71, 15, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 168, 0.00, 0, 600, NULL, NULL),
(72, 16, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 212, 0.00, 0, 600, NULL, NULL),
(73, 17, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 213, 0.00, 0, 600, NULL, NULL),
(74, 18, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 801, 0.00, 0, 600, NULL, NULL),
(75, 19, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 3600.00, 350.00, 140, 153, 178, 0.00, 0, 600, NULL, NULL),
(76, 20, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 328, 0.00, 0, 150, NULL, NULL),
(77, 21, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 345, 0.00, 0, 150, NULL, NULL),
(78, 22, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 488, 0.00, 0, 150, NULL, NULL),
(79, 23, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 119, 0.00, 0, 150, NULL, NULL),
(80, 24, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 961, 0.00, 0, 150, NULL, NULL),
(81, 25, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 1018, 0.00, 0, 150, NULL, NULL),
(82, 26, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 874, 0.00, 0, 150, NULL, NULL),
(83, 27, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 851, 0.00, 0, 150, NULL, NULL),
(84, 28, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 833, 0.00, 0, 150, NULL, NULL),
(85, 29, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 748, 0.00, 0, 150, NULL, NULL),
(86, 30, 0.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-07', 0, 0.00, 0.00, 0, 0, 376, 0.00, 0, 150, NULL, NULL),
(87, 87, 4372.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(88, 88, 4400.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(89, 89, 4372.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(90, 90, 4372.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(92, 92, 16300.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(93, 93, 14152.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(94, 94, 11466.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(95, 95, 17000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(96, 96, 11447.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(97, 97, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(98, 98, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(99, 99, 22700.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-10', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(108, 100, 8000.00, 0, 0, 0, NULL, 'MANUAL', '2025-06-15', 0, 0.00, 0.00, 0, 0, 0, 0.00, 0, 0, NULL, NULL),
(128, 114, 60.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 60, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(129, 115, 7880.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 7880, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(130, 116, 5900.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 5900, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(131, 117, 16000.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 16000, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(132, 118, 10000.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 10000, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(133, 119, 9200.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 9200, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(134, 120, 9800.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 9800, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(135, 121, 16600.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 16600, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(136, 122, 11100.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 11100, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(137, 123, 558.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 558, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(138, 124, 1520.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 1520, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(139, 125, 2450.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 2450, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(140, 126, 1800.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 1800, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(141, 127, 4850.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 4850, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(142, 128, 7200.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 7200, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(143, 129, 15000.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 15000, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(144, 130, 11700.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 11700, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(145, 131, 6905.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 6905, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(146, 132, 23000.00, 0, 0, 0, NULL, 'MANUAL', '2026-01-12', 23000, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL),
(147, 133, 0.00, 0, 0, 0, NULL, 'Manual', '2026-01-16', 0, 0.00, 0.00, 0, 0, 1, 0.00, 1, 0, 1, NULL),
(164, 223, 0.00, NULL, 0, 0, NULL, NULL, NULL, NULL, 0.00, 0.00, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(165, 224, 0.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-18', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(166, 229, 6200.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(167, 231, 5378.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(168, 232, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(169, 233, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(170, 234, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(171, 235, 20.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(172, 236, 1000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(173, 238, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(174, 239, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(175, 240, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(176, 241, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL),
(177, 242, 2000.00, 0, 0, 0, '2026-04', 'Manual', '2026-04-22', 0, 0.00, 0.00, 0, 0, 1, 0.00, NULL, 0, 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `costos_produccion`
--

CREATE TABLE `costos_produccion` (
  `id` int NOT NULL,
  `costo_unitario` mediumint DEFAULT NULL,
  `costo_mp_galon` tinyint DEFAULT NULL,
  `periodo` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `metodo_calculo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_calculo` varchar(0) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `costo_mp_kg` tinyint DEFAULT NULL,
  `envase` smallint DEFAULT NULL,
  `etiqueta` smallint DEFAULT NULL,
  `bandeja` smallint DEFAULT NULL,
  `plastico` smallint DEFAULT NULL,
  `costo_total` tinyint DEFAULT NULL,
  `volumen` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `precio_venta` tinyint DEFAULT NULL,
  `cantidad_total` tinyint DEFAULT NULL,
  `costo_mod` smallint DEFAULT NULL,
  `preparaciones_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizaciones`
--

CREATE TABLE `cotizaciones` (
  `id_cotizaciones` int UNSIGNED NOT NULL,
  `numero` varchar(20) NOT NULL,
  `cliente_id` int NOT NULL,
  `fecha_cotizacion` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(12,2) NOT NULL DEFAULT '0.00',
  `impuestos` decimal(12,2) NOT NULL DEFAULT '0.00',
  `retencion` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estado` enum('Borrador','Enviada','Aceptada','Rechazada','Vencida','Convertida') NOT NULL DEFAULT 'Borrador',
  `observaciones` text,
  `facturas_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cotizaciones`
--

INSERT INTO `cotizaciones` (`id_cotizaciones`, `numero`, `cliente_id`, `fecha_cotizacion`, `fecha_vencimiento`, `subtotal`, `descuento`, `impuestos`, `retencion`, `total`, `estado`, `observaciones`, `facturas_id`, `creado_en`) VALUES
(1, 'COT-2025-0001', 1, '2025-11-05', '2026-04-20', 300000.00, 0.00, 57000.00, 7000.00, 350000.00, 'Convertida', 'Origen de FAC-20', 1, '2026-03-07 14:04:50'),
(2, 'COT-2025-0002', 2, '2024-12-20', '2025-01-10', 300000.00, 0.00, 57000.00, 7000.00, 750000.00, 'Aceptada', 'Origen de factura 89211291', 2, '2026-03-07 14:04:50'),
(3, 'COT-2025-0003', 1, '2025-03-01', '2025-03-20', 520000.00, 0.00, 98800.00, 0.00, 618800.00, 'Enviada', 'Propuesta pintura exterior', NULL, '2026-03-07 14:04:50'),
(4, 'COT-2025-0004', 2, '2025-03-10', '2026-03-25', 980000.00, 50000.00, 177100.00, 0.00, 1107100.00, 'Borrador', 'En revisión interna', NULL, '2026-03-07 14:04:50'),
(5, 'COT-2025-0005', 1, '2026-03-07', '2026-03-15', 250000.00, 0.00, 47500.00, 0.00, 297500.00, 'Rechazada', 'Cliente prefirió otra propuesta', NULL, '2026-03-07 14:04:50');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizaciones_detalle`
--

CREATE TABLE `cotizaciones_detalle` (
  `id_detalle` int UNSIGNED NOT NULL,
  `cotizaciones_id` int UNSIGNED NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cotizaciones_detalle`
--

INSERT INTO `cotizaciones_detalle` (`id_detalle`, `cotizaciones_id`, `descripcion`, `cantidad`, `precio_unit`, `descuento_pct`, `subtotal`) VALUES
(1, 1, 'Pintura base agua blanca 4L', 2.00, 85000.00, 0.00, 170000.00),
(2, 1, 'Sellador multiusos 3.6L', 1.00, 88000.00, 0.00, 88000.00),
(3, 1, 'Rodillos premium 9\"', 5.00, 8400.00, 0.00, 42000.00),
(4, 3, 'Pintura exterior mate 4L', 4.00, 92000.00, 0.00, 368000.00),
(5, 3, 'Lija al agua grano 220', 20.00, 7600.00, 0.00, 152000.00),
(6, 4, 'Pintura epóxica 4L', 6.00, 125000.00, 5.00, 712500.00),
(7, 4, 'Catalizador epóxico 1L', 6.00, 45000.00, 0.00, 270000.00),
(8, 5, 'Thinner acrílico galón', 5.00, 50000.00, 0.00, 250000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_facturas`
--

CREATE TABLE `detalle_facturas` (
  `id_detalle_facturas` int NOT NULL,
  `cantidad` tinyint DEFAULT NULL,
  `precio_unitario` decimal(7,1) DEFAULT NULL,
  `subtotal` decimal(7,1) DEFAULT NULL,
  `facturas_id` int DEFAULT NULL,
  `item_general_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
  `id_empresa` int NOT NULL,
  `nit` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `razon_social` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ciudad` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefono` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pagina_web` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresa`
--

INSERT INTO `empresa` (`id_empresa`, `nit`, `razon_social`, `descripcion`, `ciudad`, `telefono`, `pagina_web`) VALUES
(1, '901314182', 'PINTURAS INDUSTRIALES DEL CARIBE S.A.S', 'Comercio al por mayor de materiales de construcción, artículos de ferretería, pinturas, productos de vidrio, equipo y materiales de fontanería y calefacción. - 4663', 'Barranquilla', '3019794729', 'https://pinca.com.co/');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id_facturas` int NOT NULL,
  `numero` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `fecha_emision` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `saldo_pendiente` decimal(12,2) NOT NULL DEFAULT '0.00',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `estado` enum('Pendiente','Parcial','Pagada','Vencida','Anulada') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Pendiente',
  `subtotal` decimal(10,2) DEFAULT NULL,
  `descuento` decimal(12,2) NOT NULL DEFAULT '0.00',
  `impuestos` decimal(10,2) DEFAULT NULL,
  `retencion` decimal(10,2) DEFAULT NULL,
  `movimiento_inventario_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id_facturas`, `numero`, `cliente_id`, `fecha_emision`, `fecha_vencimiento`, `total`, `saldo_pendiente`, `observaciones`, `estado`, `subtotal`, `descuento`, `impuestos`, `retencion`, `movimiento_inventario_id`, `creado_en`) VALUES
(1, 'FAC-20', 1, '2025-11-12', '2025-12-12', 350000.00, 125000.00, NULL, 'Parcial', 300000.00, 0.00, 57000.00, 7000.00, 6, '2026-03-07 14:01:47'),
(2, '89211291', 2, '2025-01-12', '2025-02-11', 750000.00, 0.00, NULL, 'Pagada', 300000.00, 0.00, 57000.00, 7000.00, 6, '2026-03-07 14:01:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas_detalle`
--

CREATE TABLE `facturas_detalle` (
  `id_detalle` int UNSIGNED NOT NULL,
  `facturas_id` int NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `facturas_detalle`
--

INSERT INTO `facturas_detalle` (`id_detalle`, `facturas_id`, `descripcion`, `cantidad`, `precio_unit`, `descuento_pct`, `subtotal`) VALUES
(1, 1, 'Pintura base agua blanca 4L', 2.00, 85000.00, 0.00, 170000.00),
(2, 1, 'Sellador multiusos 3.6L', 1.00, 88000.00, 0.00, 88000.00),
(3, 1, 'Rodillos premium 9\"', 5.00, 8400.00, 0.00, 42000.00),
(4, 2, 'Pintura esmalte negro mate 1L', 3.00, 52000.00, 0.00, 156000.00),
(5, 2, 'Thinner acrílico 1/4', 4.00, 18000.00, 0.00, 72000.00),
(6, 2, 'Brocha 3\" cerda natural', 3.00, 24000.00, 0.00, 72000.00),
(7, 1, 'Pintura base agua blanca 4L', 2.00, 85000.00, 0.00, 170000.00),
(8, 1, 'Sellador multiusos 3.6L', 1.00, 88000.00, 0.00, 88000.00),
(9, 1, 'Rodillos premium 9\"', 5.00, 8400.00, 0.00, 42000.00),
(10, 2, 'Pintura esmalte negro mate 1L', 3.00, 52000.00, 0.00, 156000.00),
(11, 2, 'Thinner acrílico 1/4', 4.00, 18000.00, 0.00, 72000.00),
(12, 2, 'Brocha 3\" cerda natural', 3.00, 24000.00, 0.00, 72000.00),
(13, 1, 'Pintura base agua blanca 4L', 2.00, 85000.00, 0.00, 170000.00),
(14, 1, 'Sellador multiusos 3.6L', 1.00, 88000.00, 0.00, 88000.00),
(15, 1, 'Rodillos premium 9\"', 5.00, 8400.00, 0.00, 42000.00),
(16, 2, 'Pintura esmalte negro mate 1L', 3.00, 52000.00, 0.00, 156000.00),
(17, 2, 'Thinner acrílico 1/4', 4.00, 18000.00, 0.00, 72000.00),
(18, 2, 'Brocha 3\" cerda natural', 3.00, 24000.00, 0.00, 72000.00),
(19, 1, 'Pintura base agua blanca 4L', 2.00, 85000.00, 0.00, 170000.00),
(20, 1, 'Sellador multiusos 3.6L', 1.00, 88000.00, 0.00, 88000.00),
(21, 1, 'Rodillos premium 9\"', 5.00, 8400.00, 0.00, 42000.00),
(22, 2, 'Pintura esmalte negro mate 1L', 3.00, 52000.00, 0.00, 156000.00),
(23, 2, 'Thinner acrílico 1/4', 4.00, 18000.00, 0.00, 72000.00),
(24, 2, 'Brocha 3\" cerda natural', 3.00, 24000.00, 0.00, 72000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `formulaciones`
--

CREATE TABLE `formulaciones` (
  `id_formulaciones` int NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `estado` tinyint DEFAULT NULL COMMENT '0 inactiva\\n1 activa',
  `defecto` tinyint DEFAULT '0' COMMENT '1 por defecto',
  `item_general_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `formulaciones`
--

INSERT INTO `formulaciones` (`id_formulaciones`, `nombre`, `descripcion`, `estado`, `defecto`, `item_general_id`) VALUES
(1, 'PREPARACIÓN BARNIZ TRANSPARENTE BIRILLANTE', NULL, 1, 1, 1),
(2, 'PREPARACION ESMALTE BLANCO', NULL, 0, 1, 2),
(3, 'PREPARACION ESMALTE CAOBA', NULL, 1, 1, 3),
(4, 'PREPARACION ESMALTE NEGRO MATE', NULL, 1, 1, 4),
(5, 'PREPARACIÓN ESMALTE ROJO FIESTA', NULL, 1, 1, 5),
(6, 'PREPARACION ESMALTE NEGRO BRILLANTE', NULL, 1, 1, 6),
(7, 'PREPARACION ESMALTE VERDE ESMERALDA', NULL, 1, 1, 7),
(8, 'PREPARACION ESMALTE GRIS PLATA', NULL, 1, 1, 8),
(9, 'PREPARACION ESMALTE AZUL ESPAÑOL', NULL, 1, 1, 9),
(10, 'PREPARACION ESMALTE BLANCO MATE', NULL, 1, 1, 10),
(11, 'PREPARACION ESMALTE AMARILLO', NULL, 1, 1, 11),
(12, 'PREPARACION ESMALTE NARANJA', NULL, 1, 1, 12),
(13, 'PREPARACION ESMALTE TABACO', NULL, 1, 1, 13),
(14, 'PREPARACION ANTICORROSIVO GRIS', NULL, 1, 1, 14),
(15, 'PREPARACION ANTICORROSIVO NEGRO', NULL, 1, 1, 15),
(16, 'PREPARACION ANTICORROSIVO AMARILLO', NULL, 1, 1, 16),
(17, 'PREPARACION ANTICORROSIVO ROJO', NULL, 1, 1, 17),
(18, 'PREPARACION ANTICORROSIVO BLANCO', NULL, 1, 1, 18),
(19, 'PREPARACION ANTICORROSIVO VERDE', NULL, 1, 1, 19),
(20, 'PREPARACION PASTA ESMALTE VERDE ENTONADOR', NULL, 1, 1, 20),
(21, 'PREPARACION PASTA ESMALTE AZUL ENTONADOR', NULL, 1, 1, 21),
(22, 'PREPARACION PASTA ESMALTE NEGRO', NULL, 1, 1, 22),
(23, 'PREPARACION PASTA ESMALTE ROJO CARMIN 57:1', NULL, 1, 1, 23),
(24, 'PREPARACION PASTA ESMALTE NARANJA', NULL, 1, 1, 24),
(25, 'PREPARACION PASTA ESMALTE AMARILLO', NULL, 1, 1, 25),
(26, 'PREPARACION PASTA ESMALTE CAOBA', NULL, 1, 1, 26),
(27, 'PREPARACION PASTA ESMALTE AMARILLO OXIDO', NULL, 1, 1, 27),
(28, 'PREPARACION PASTA ESMALTE ROJO OXIDO', NULL, 1, 1, 28),
(29, 'PREPARACION PASTA ESMALTE BLANCO', NULL, 1, 1, 29),
(30, 'PREPARACION PASTA ESMALTE TABACO', NULL, 1, 1, 30),
(48, 'Formulación - VINILO T1 BLANCO', NULL, 1, 1, 133),
(52, 'PREPARACION ESMALTE BLANCO', NULL, 1, 1, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gestiones_cobro`
--

CREATE TABLE `gestiones_cobro` (
  `id_gestion` int NOT NULL,
  `facturas_id` int NOT NULL,
  `clientes_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `tipo` enum('llamada','email','visita','whatsapp') NOT NULL,
  `resultado` varchar(255) DEFAULT NULL,
  `proxima_gestion` date DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `gestiones_cobro`
--

INSERT INTO `gestiones_cobro` (`id_gestion`, `facturas_id`, `clientes_id`, `usuario_id`, `tipo`, `resultado`, `proxima_gestion`, `creado_en`) VALUES
(1, 1, 1, NULL, 'llamada', 'No contestó. Se dejó mensaje de voz.', '2026-01-10', '2026-03-19 14:38:34'),
(2, 1, 1, NULL, 'whatsapp', 'Prometió pagar la próxima semana.', '2026-01-20', '2026-03-19 14:38:34'),
(3, 1, 1, NULL, 'llamada', 'No cumplió. Nuevo compromiso para el 25.', '2026-01-25', '2026-03-19 14:38:34'),
(4, 1, 1, NULL, 'visita', 'No estaba el encargado. Se dejó comunicado.', '2026-02-01', '2026-03-19 14:38:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_precios`
--

CREATE TABLE `historial_precios` (
  `id_historial` int UNSIGNED NOT NULL,
  `item_proveedor_id` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `precio_con_iva` decimal(10,2) DEFAULT NULL,
  `fecha` date NOT NULL,
  `observacion` varchar(100) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `historial_precios`
--

INSERT INTO `historial_precios` (`id_historial`, `item_proveedor_id`, `precio_unitario`, `precio_con_iva`, `fecha`, `observacion`, `creado_en`) VALUES
(1, 6, 4200.00, 0.00, '2024-01-15', 'Precio inicial', '2026-03-21 02:59:59'),
(2, 6, 4600.00, 0.00, '2024-05-01', 'Ajuste Q2', '2026-03-21 02:59:59'),
(3, 6, 5000.00, 0.00, '2024-10-01', 'Alza materia prima', '2026-03-21 02:59:59'),
(4, 7, 1400.00, 700.00, '2024-01-15', 'Precio inicial', '2026-03-21 02:59:59'),
(5, 7, 1700.00, 850.00, '2024-06-01', 'Ajuste semestral', '2026-03-21 02:59:59'),
(6, 7, 2000.00, 1002.00, '2025-01-10', 'Último ajuste', '2026-03-21 02:59:59'),
(7, 8, 160.00, 400.00, '2024-02-01', 'Precio inicial', '2026-03-21 02:59:59'),
(8, 8, 180.00, 460.00, '2024-08-15', 'Ajuste', '2026-03-21 02:59:59'),
(9, 8, 200.00, 500.00, '2025-02-01', 'Precio actual', '2026-03-21 02:59:59'),
(10, 9, 580.00, 0.00, '2024-03-01', 'Precio inicial', '2026-03-21 02:59:59'),
(11, 9, 620.00, 0.00, '2024-09-01', 'Ajuste', '2026-03-21 02:59:59'),
(12, 10, 240.00, 0.00, '2024-01-15', 'Precio inicial', '2026-03-21 02:59:59'),
(13, 10, 270.00, 0.00, '2024-07-01', 'Ajuste', '2026-03-21 02:59:59'),
(14, 10, 300.00, 0.00, '2025-01-01', 'Precio actual', '2026-03-21 02:59:59'),
(15, 31, 3800.00, 4400.00, '2024-02-01', 'Precio inicial', '2026-03-21 03:00:50'),
(16, 31, 4000.00, 4650.00, '2024-07-01', 'Ajuste', '2026-03-21 03:00:50'),
(17, 31, 4200.00, 4900.00, '2025-01-15', 'Precio actual', '2026-03-21 03:00:50'),
(18, 32, 1500.00, 750.00, '2024-02-01', 'Precio inicial', '2026-03-21 03:00:50'),
(19, 32, 1650.00, 820.00, '2024-08-01', 'Ajuste', '2026-03-21 03:00:50'),
(20, 32, 1750.00, 875.00, '2025-01-15', 'Precio actual', '2026-03-21 03:00:50'),
(21, 33, 190.00, 480.00, '2024-03-01', 'Precio inicial', '2026-03-21 03:00:50'),
(22, 33, 210.00, 520.00, '2024-10-01', 'Ajuste', '2026-03-21 03:00:50'),
(23, 33, 220.00, 550.00, '2025-02-01', 'Precio actual', '2026-03-21 03:00:50'),
(24, 34, 240.00, 280.00, '2024-03-01', 'Precio inicial', '2026-03-21 03:00:50'),
(25, 34, 260.00, 305.00, '2024-09-01', 'Ajuste', '2026-03-21 03:00:50'),
(26, 34, 280.00, 330.00, '2025-01-01', 'Precio actual', '2026-03-21 03:00:50'),
(27, 35, 78000.00, 90000.00, '2024-04-01', 'Precio inicial', '2026-03-21 03:00:50'),
(28, 35, 82000.00, 95000.00, '2024-09-01', 'Ajuste', '2026-03-21 03:00:50'),
(29, 35, 85000.00, 98000.00, '2025-01-01', 'Precio actual', '2026-03-21 03:00:50'),
(30, 36, 19000.00, 22000.00, '2024-04-01', 'Precio inicial', '2026-03-21 03:00:50'),
(31, 36, 20500.00, 23500.00, '2024-10-01', 'Ajuste', '2026-03-21 03:00:50'),
(32, 36, 22000.00, 25000.00, '2025-02-01', 'Precio actual', '2026-03-21 03:00:50'),
(33, 37, 86000.00, 99000.00, '2024-04-01', 'Precio inicial', '2026-03-21 03:00:50'),
(34, 37, 89000.00, 102000.00, '2024-09-01', 'Ajuste', '2026-03-21 03:00:50'),
(35, 37, 92000.00, 106000.00, '2025-01-01', 'Precio actual', '2026-03-21 03:00:50'),
(36, 38, 17000.00, 19500.00, '2024-04-01', 'Precio inicial', '2026-03-21 03:00:50'),
(37, 38, 18500.00, 21000.00, '2024-10-01', 'Ajuste', '2026-03-21 03:00:50'),
(38, 38, 19500.00, 22000.00, '2025-02-01', 'Precio actual', '2026-03-21 03:00:50');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `instalaciones`
--

CREATE TABLE `instalaciones` (
  `id_instalaciones` int NOT NULL,
  `nombre` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ciudad` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefono` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_empresa` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `instalaciones`
--

INSERT INTO `instalaciones` (`id_instalaciones`, `nombre`, `descripcion`, `ciudad`, `direccion`, `telefono`, `id_empresa`) VALUES
(1, 'Sede Cordialidad', 'SEDE DE FABRICACIÓN DE PINTURAS', ' BARRANQUILLA', 'Calle 99 # 6-59', '3019794729', 1),
(2, 'Sede Villa Olimpica', 'SEDE DE FABRICACIÓN DE PINTURAS', 'Galapa', '', '3019794729', 1),
(3, 'Sede Juan Mina', 'SEDE DE FABRICACIÓN DE PINTURAS', 'Barranquilla', '', '3019794729', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id_inventario` int NOT NULL,
  `cantidad` decimal(5,2) DEFAULT NULL,
  `fecha_update` date DEFAULT NULL,
  `apartada` tinyint DEFAULT NULL,
  `item_general_id` int NOT NULL,
  `estado` tinyint DEFAULT NULL COMMENT '0 disponible\\r\\n1 No disponible',
  `movimiento_inventario_id` int DEFAULT NULL,
  `tipo` tinyint DEFAULT NULL COMMENT '1 ingreso\n2 egreso',
  `bodegas_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id_inventario`, `cantidad`, `fecha_update`, `apartada`, `item_general_id`, `estado`, `movimiento_inventario_id`, `tipo`, `bodegas_id`) VALUES
(1, 11.00, NULL, 0, 1, 0, NULL, 1, 1),
(2, 0.00, NULL, 0, 2, 0, NULL, 1, 1),
(3, 0.00, NULL, 0, 3, 0, NULL, 1, 1),
(4, 0.00, NULL, 0, 4, 0, NULL, 1, 1),
(5, 0.00, NULL, 0, 5, 0, NULL, 1, 1),
(6, 0.00, NULL, 0, 6, 0, NULL, 1, 1),
(7, 0.00, NULL, 0, 7, 0, NULL, 1, 1),
(8, 0.00, NULL, 0, 8, 0, NULL, 1, 1),
(9, 0.00, NULL, 0, 9, 0, NULL, 1, 1),
(10, 0.00, NULL, 0, 10, 0, NULL, 1, 1),
(11, 0.00, NULL, 0, 11, 0, NULL, 1, 1),
(12, 0.00, NULL, 0, 12, 0, NULL, 1, 1),
(13, 0.00, NULL, 0, 13, 0, NULL, 1, 1),
(14, 0.00, NULL, 0, 14, 0, NULL, 1, 1),
(15, 0.00, NULL, 0, 15, 0, NULL, 1, 1),
(16, 0.00, NULL, 0, 16, 0, NULL, 1, 1),
(17, 0.00, NULL, 0, 17, 0, NULL, 1, 1),
(18, 0.00, NULL, 0, 18, 0, NULL, 1, 1),
(19, 0.00, NULL, 0, 19, 0, NULL, 1, 1),
(20, 0.00, NULL, 0, 20, 0, NULL, 1, 1),
(21, 0.00, NULL, 0, 21, 0, NULL, 1, 1),
(22, 0.00, NULL, 0, 22, 0, NULL, 1, 1),
(23, 0.00, NULL, 0, 23, 0, NULL, 1, 1),
(24, 0.00, NULL, 0, 24, 0, NULL, 1, 1),
(25, 0.00, NULL, 0, 25, 0, NULL, 1, 1),
(26, 0.00, NULL, 0, 26, 0, NULL, 1, 1),
(27, 0.00, NULL, 0, 27, 0, NULL, 1, 1),
(28, 0.00, NULL, 0, 28, 0, NULL, 1, 1),
(29, 0.00, NULL, 0, 29, 0, NULL, 1, 1),
(30, 0.00, NULL, 0, 30, 0, NULL, 1, 1),
(31, 28.11, '2026-04-04', 0, 31, 0, NULL, 1, 1),
(32, 3.99, '2026-04-04', 0, 32, 0, NULL, 1, 1),
(33, 18.24, '2026-04-04', 0, 33, 0, NULL, 1, 1),
(34, 2.23, '2026-04-04', 0, 34, 0, NULL, 1, 1),
(35, 0.48, '2026-04-04', 0, 35, 0, NULL, 1, 1),
(36, 18.65, '2026-04-04', 0, 36, 0, NULL, 1, 1),
(37, 0.00, NULL, 0, 37, 0, NULL, 1, 1),
(38, 0.00, NULL, 0, 38, 0, NULL, 1, 1),
(39, 0.00, NULL, 0, 39, 0, NULL, 1, 1),
(40, 0.00, NULL, 0, 40, 0, NULL, 1, 1),
(41, 0.00, NULL, 0, 41, 0, NULL, 1, 1),
(42, 0.00, NULL, 0, 42, 0, NULL, 1, 1),
(43, 0.00, NULL, 0, 43, 0, NULL, 1, 1),
(44, 0.00, NULL, 0, 44, 0, NULL, 1, 1),
(45, 0.00, NULL, 0, 46, 0, NULL, 1, 1),
(46, 0.00, NULL, 0, 47, 0, NULL, 1, 1),
(47, 0.00, NULL, 0, 48, 0, NULL, 1, 1),
(48, 0.00, NULL, 0, 50, 0, NULL, 1, 1),
(49, 0.00, NULL, 0, 52, 0, NULL, 1, 1),
(50, 0.00, NULL, 0, 54, 0, NULL, 1, 1),
(51, 0.00, NULL, 0, 56, 0, NULL, 1, 1),
(52, 0.00, NULL, 0, 57, 0, NULL, 1, 1),
(53, 0.00, NULL, 0, 59, 0, NULL, 1, 1),
(54, 0.00, NULL, 0, 60, 0, NULL, 1, 1),
(55, 0.00, NULL, 0, 61, 0, NULL, 1, 1),
(56, 0.00, NULL, 0, 62, 0, NULL, 1, 1),
(57, 0.00, NULL, 0, 63, 0, NULL, 1, 1),
(58, 0.00, NULL, 0, 64, 0, NULL, 1, 1),
(59, 0.00, NULL, 0, 65, 0, NULL, 1, 1),
(60, 0.00, NULL, 0, 66, 0, NULL, 1, 1),
(61, 0.00, NULL, 0, 67, 0, NULL, 1, 1),
(62, 0.00, NULL, 0, 68, 0, NULL, 1, 1),
(63, 0.00, NULL, 0, 69, 0, NULL, 1, 1),
(64, 0.00, NULL, 0, 70, 0, NULL, 1, 1),
(65, 0.00, NULL, 0, 71, 0, NULL, 1, 1),
(66, 0.00, NULL, 0, 72, 0, NULL, 1, 1),
(67, 0.00, NULL, 0, 73, 0, NULL, 1, 1),
(68, 0.00, NULL, 0, 74, 0, NULL, 1, 1),
(69, 0.00, NULL, 0, 75, 0, NULL, 1, 1),
(70, 0.00, NULL, 0, 76, 0, NULL, 1, 1),
(71, 0.00, NULL, 0, 77, 0, NULL, 1, 1),
(72, 0.00, NULL, 0, 78, 0, NULL, 1, 1),
(73, 0.00, NULL, 0, 79, 0, NULL, 1, 1),
(74, 0.00, NULL, 0, 80, 0, NULL, 1, 1),
(75, 0.00, NULL, 0, 81, 0, NULL, 1, 1),
(76, 0.00, NULL, 0, 83, 0, NULL, 1, 1),
(77, 0.00, NULL, 0, 84, 0, NULL, 1, 1),
(78, 0.00, NULL, 0, 85, 0, NULL, 1, 1),
(79, 0.00, NULL, 0, 86, 0, NULL, 1, 1),
(80, 0.00, NULL, 0, 87, 0, NULL, 1, 1),
(81, 0.00, NULL, 0, 88, 0, NULL, 1, 1),
(82, 0.00, NULL, 0, 89, 0, NULL, 1, 1),
(83, 0.00, NULL, 0, 90, 0, NULL, 1, 1),
(84, 0.00, NULL, 0, 92, 0, NULL, 1, 1),
(85, 0.00, NULL, 0, 93, 0, NULL, 1, 1),
(86, 0.00, NULL, 0, 94, 0, NULL, 1, 1),
(87, 0.00, NULL, 0, 95, 0, NULL, 1, 1),
(88, 0.00, NULL, 0, 96, 0, NULL, 1, 1),
(89, 0.00, NULL, 0, 97, 0, NULL, 1, 1),
(90, 0.00, NULL, 0, 98, 0, NULL, 1, 1),
(91, 0.00, NULL, 0, 99, 0, NULL, 1, 1),
(92, 0.00, NULL, 0, 100, 0, NULL, 1, 1),
(108, 0.00, NULL, 0, 114, 0, NULL, 1, 1),
(109, 0.00, NULL, 0, 115, 0, NULL, 1, 1),
(110, 0.00, NULL, 0, 116, 0, NULL, 1, 1),
(111, 0.00, NULL, 0, 117, 0, NULL, 1, 1),
(112, 0.00, NULL, 0, 118, 0, NULL, 1, 1),
(113, 0.00, NULL, 0, 119, 0, NULL, 1, 1),
(114, 0.00, NULL, 0, 120, 0, NULL, 1, 1),
(115, 0.00, NULL, 0, 121, 0, NULL, 1, 1),
(116, 0.00, NULL, 0, 122, 0, NULL, 1, 1),
(117, 0.00, NULL, 0, 123, 0, NULL, 1, 1),
(118, 0.00, NULL, 0, 124, 0, NULL, 1, 1),
(119, 0.00, NULL, 0, 125, 0, NULL, 1, 1),
(120, 0.00, NULL, 0, 126, 0, NULL, 1, 1),
(121, 0.00, NULL, 0, 127, 0, NULL, 1, 1),
(122, 0.00, NULL, 0, 128, 0, NULL, 1, 1),
(123, 0.00, NULL, 0, 129, 0, NULL, 1, 1),
(124, 0.00, NULL, 0, 130, 0, NULL, 1, 1),
(125, 0.00, NULL, 0, 131, 0, NULL, 1, 1),
(126, 0.00, NULL, 0, 132, 0, NULL, 1, 1),
(139, 5.00, NULL, 0, 133, 1, NULL, 1, 1),
(162, 2.00, '2026-04-17', 0, 134, 0, NULL, 1, 2),
(163, 1.00, '2026-04-17', 0, 135, 0, NULL, 1, 2),
(164, 1.00, '2026-04-17', 0, 136, 0, NULL, 1, 2),
(165, 1.00, '2026-04-17', 0, 137, 0, NULL, 1, 2),
(166, 1.00, '2026-04-17', 0, 138, 0, NULL, 1, 2),
(167, 1.00, '2026-04-17', 0, 139, 0, NULL, 1, 2),
(168, 1.00, '2026-04-17', 0, 140, 0, NULL, 1, 2),
(169, 1.00, '2026-04-17', 0, 141, 0, NULL, 1, 2),
(170, 6.00, '2026-04-17', 0, 194, 0, NULL, 1, 2),
(171, 19.00, '2026-04-17', 0, 142, 0, NULL, 1, 2),
(172, 2.00, '2026-04-17', 0, 143, 0, NULL, 1, 18),
(173, 1.00, '2026-04-17', 0, 144, 0, NULL, 1, 18),
(174, 1.00, '2026-04-17', 0, 145, 0, NULL, 1, 18),
(175, 1.00, '2026-04-17', 0, 146, 0, NULL, 1, 18),
(176, 1.00, '2026-04-17', 0, 147, 0, NULL, 1, 18),
(177, 1.00, '2026-04-17', 0, 189, 0, NULL, 1, 18),
(178, NULL, '2026-04-17', 0, 148, 0, NULL, 1, 18),
(179, 1.00, '2026-04-17', 0, 149, 0, NULL, 1, 18),
(180, 1.00, '2026-04-17', 0, 150, 0, NULL, 1, 18),
(181, 1.00, '2026-04-17', 0, 151, 0, NULL, 1, 18),
(182, 1.00, '2026-04-17', 0, 152, 0, NULL, 1, 18),
(183, 2.00, '2026-04-17', 0, 134, 0, NULL, 1, 18),
(184, 1.00, '2026-04-17', 0, 153, 0, NULL, 1, 18),
(185, NULL, '2026-04-17', 0, 154, 0, NULL, 1, 18),
(186, NULL, '2026-04-17', 0, 155, 0, NULL, 1, 18),
(187, 4.00, '2026-04-17', 0, 156, 0, NULL, 1, 18),
(188, 1.00, '2026-04-17', 0, 157, 0, NULL, 1, 18),
(189, 1.00, '2026-04-17', 0, 158, 0, NULL, 1, 18),
(190, 1.00, '2026-04-17', 0, 159, 0, NULL, 1, 18),
(191, 1.00, '2026-04-17', 0, 160, 0, NULL, 1, 18),
(192, 3.00, '2026-04-17', 0, 161, 0, NULL, 1, 18),
(193, 1.00, '2026-04-17', 0, 190, 0, NULL, 1, 18),
(194, 1.00, '2026-04-17', 0, 191, 0, NULL, 1, 18),
(195, 2.00, '2026-04-17', 0, 162, 0, NULL, 1, 18),
(196, 4.00, '2026-04-17', 0, 163, 0, NULL, 1, 18),
(197, 1.00, '2026-04-17', 0, 219, 0, NULL, 1, 18),
(198, 3.00, '2026-04-17', 0, 164, 0, NULL, 1, 18),
(199, 1.00, '2026-04-17', 0, 192, 0, NULL, 1, 18),
(200, 1.00, '2026-04-17', 0, 165, 0, NULL, 1, 18),
(201, 1.00, '2026-04-17', 0, 166, 0, NULL, 1, 18),
(202, 6.00, '2026-04-17', 0, 167, 0, NULL, 1, 18),
(203, 6.00, '2026-04-17', 0, 168, 0, NULL, 1, 18),
(204, 1.00, '2026-04-17', 0, 169, 0, NULL, 1, 18),
(205, NULL, '2026-04-17', 0, 170, 0, NULL, 1, 18),
(206, 2.00, '2026-04-17', 0, 171, 0, NULL, 1, 18),
(207, 1.00, '2026-04-17', 0, 172, 0, NULL, 1, 18),
(208, 1.00, '2026-04-17', 0, 173, 0, NULL, 1, 18),
(209, 1.00, '2026-04-17', 0, 136, 0, NULL, 1, 18),
(210, 1.00, '2026-04-17', 0, 174, 0, NULL, 1, 18),
(211, 1.00, '2026-04-17', 0, 175, 0, NULL, 1, 18),
(212, NULL, '2026-04-17', 0, 176, 0, NULL, 1, 18),
(213, 2.00, '2026-04-17', 0, 177, 0, NULL, 1, 18),
(214, NULL, '2026-04-17', 0, 193, 0, NULL, 1, 18),
(215, 2.00, '2026-04-17', 0, 178, 0, NULL, 1, 18),
(216, 1.00, '2026-04-17', 0, 179, 0, NULL, 1, 18),
(217, 1.00, '2026-04-17', 0, 180, 0, NULL, 1, 18),
(218, 1.00, '2026-04-17', 0, 181, 0, NULL, 1, 18),
(219, 1.00, '2026-04-17', 0, 182, 0, NULL, 1, 18),
(220, NULL, '2026-04-17', 0, 183, 0, NULL, 1, 18),
(221, 3.00, '2026-04-17', 0, 184, 0, NULL, 1, 18),
(222, NULL, '2026-04-17', 0, 185, 0, NULL, 1, 18),
(223, 2.00, '2026-04-17', 0, 186, 0, NULL, 1, 18),
(224, 1.00, '2026-04-17', 0, 187, 0, NULL, 1, 18),
(225, NULL, '2026-04-17', 0, 188, 0, NULL, 1, 18),
(226, 4.00, '2026-04-17', 0, 162, 0, NULL, 1, 19),
(227, 1.00, '2026-04-17', 0, 195, 0, NULL, 1, 19),
(228, 2.00, '2026-04-17', 0, 196, 0, NULL, 1, 19),
(229, 1.00, '2026-04-17', 0, 197, 0, NULL, 1, 19),
(230, 1.00, '2026-04-17', 0, 150, 0, NULL, 1, 19),
(231, 2.00, '2026-04-17', 0, 172, 0, NULL, 1, 19),
(232, 1.00, '2026-04-17', 0, 198, 0, NULL, 1, 19),
(233, 1.00, '2026-04-17', 0, 199, 0, NULL, 1, 19),
(234, 1.00, '2026-04-17', 0, 200, 0, NULL, 1, 19),
(235, 1.00, '2026-04-17', 0, 201, 0, NULL, 1, 19),
(236, 1.00, '2026-04-17', 0, 202, 0, NULL, 1, 19),
(237, 3.00, '2026-04-17', 0, 203, 0, NULL, 1, 19),
(238, NULL, '2026-04-17', 0, 204, 0, NULL, 1, 19),
(239, NULL, '2026-04-17', 0, 171, 0, NULL, 1, 19),
(240, 1.00, '2026-04-17', 0, 213, 0, NULL, 1, 19),
(241, 4.00, '2026-04-17', 0, 205, 0, NULL, 1, 19),
(242, 4.00, '2026-04-17', 0, 206, 0, NULL, 1, 19),
(243, 3.00, '2026-04-17', 0, 207, 0, NULL, 1, 19),
(244, 4.00, '2026-04-17', 0, 208, 0, NULL, 1, 19),
(245, 1.00, '2026-04-17', 0, 209, 0, NULL, 1, 19),
(246, 6.00, '2026-04-17', 0, 210, 0, NULL, 1, 19),
(247, 1.00, '2026-04-17', 0, 211, 0, NULL, 1, 19),
(248, 8.00, '2026-04-17', 0, 212, 0, NULL, 1, 19),
(249, 31.00, '2026-04-17', 0, 161, 0, NULL, 1, 21),
(250, 7.00, '2026-04-17', 0, 214, 0, NULL, 1, 21),
(251, 4.00, '2026-04-17', 0, 215, 0, NULL, 1, 21),
(252, 1.00, '2026-04-17', 0, 216, 0, NULL, 1, 21),
(253, 4.00, '2026-04-17', 0, 217, 0, NULL, 1, 21),
(254, 7.00, '2026-04-17', 0, 137, 0, NULL, 1, 21),
(255, 113.00, '2026-04-17', 0, 180, 0, NULL, 1, 21),
(256, 7.00, '2026-04-17', 0, 218, 0, NULL, 1, 21),
(257, 2.00, '2026-04-17', 0, 219, 0, NULL, 1, 21),
(258, 1.00, '2026-04-17', 0, 220, 0, NULL, 1, 21),
(259, 1.00, '2026-04-17', 0, 221, 0, NULL, 1, 21),
(260, 1.00, '2026-04-17', 0, 222, 0, NULL, 1, 21),
(261, 0.00, NULL, NULL, 223, NULL, NULL, NULL, 1),
(262, 0.00, '2026-04-18', 0, 224, 1, NULL, 1, 1),
(263, 0.00, '2026-04-22', 0, 229, 1, NULL, 1, 1),
(264, 0.00, '2026-04-22', 0, 231, 1, NULL, 1, 1),
(265, 0.00, '2026-04-22', 0, 232, 1, NULL, 1, 1),
(266, 0.00, '2026-04-22', 0, 233, 1, NULL, 1, 1),
(267, 0.00, '2026-04-22', 0, 234, 1, NULL, 1, 1),
(268, 0.00, '2026-04-22', 0, 235, 1, NULL, 1, 1),
(269, 0.00, '2026-04-22', 0, 236, 1, NULL, 1, 1),
(270, 0.00, '2026-04-22', 0, 238, 1, NULL, 1, 1),
(271, 0.00, '2026-04-22', 0, 239, 1, NULL, 1, 1),
(272, 0.00, '2026-04-22', 0, 240, 1, NULL, 1, 1),
(273, 0.00, '2026-04-22', 0, 241, 1, NULL, 1, 1),
(274, 0.00, '2026-04-22', 0, 242, 1, NULL, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_capas`
--

CREATE TABLE `inventario_capas` (
  `id_capa` int NOT NULL,
  `item_general_id` int NOT NULL,
  `bodegas_id` int NOT NULL,
  `proveedor_id` int DEFAULT NULL,
  `item_proveedor_id` int DEFAULT NULL,
  `orden_compra_id` int DEFAULT NULL,
  `cantidad_original` decimal(15,4) NOT NULL,
  `cantidad_disponible` decimal(15,4) NOT NULL,
  `costo_unitario` decimal(15,4) NOT NULL COMMENT 'Costo por unidad base (KG)',
  `unidad_compra_id` int DEFAULT NULL,
  `factor_conversion` decimal(15,6) DEFAULT '1.000000',
  `precio_compra` decimal(15,4) DEFAULT NULL COMMENT 'Precio original en unidad de compra',
  `fecha_ingreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lote_proveedor` varchar(50) DEFAULT NULL COMMENT 'Nro de lote del proveedor',
  `observaciones` text,
  `estado` tinyint DEFAULT '1' COMMENT '1=activa, 0=agotada'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `inventario_capas`
--

INSERT INTO `inventario_capas` (`id_capa`, `item_general_id`, `bodegas_id`, `proveedor_id`, `item_proveedor_id`, `orden_compra_id`, `cantidad_original`, `cantidad_disponible`, `costo_unitario`, `unidad_compra_id`, `factor_conversion`, `precio_compra`, `fecha_ingreso`, `lote_proveedor`, `observaciones`, `estado`) VALUES
(1, 1, 1, NULL, NULL, NULL, 11.0000, 11.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(2, 31, 1, NULL, NULL, NULL, 28.1100, 28.1100, 7000.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(3, 32, 1, NULL, NULL, NULL, 3.9900, 3.9900, 11000.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(4, 33, 1, NULL, NULL, NULL, 18.2400, 18.2400, 34050.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(5, 34, 1, NULL, NULL, NULL, 2.2300, 2.2300, 27144.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(6, 35, 1, NULL, NULL, NULL, 0.4800, 0.4800, 12691.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(7, 36, 1, NULL, NULL, NULL, 18.6500, 18.6500, 4372.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(8, 133, 1, NULL, NULL, NULL, 5.0000, 5.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(9, 134, 2, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(10, 135, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(11, 136, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(12, 137, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(13, 138, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(14, 139, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(15, 140, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(16, 141, 2, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(17, 194, 2, NULL, NULL, NULL, 6.0000, 6.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(18, 142, 2, NULL, NULL, NULL, 19.0000, 19.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(19, 143, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(20, 144, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(21, 145, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(22, 146, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(23, 147, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(24, 189, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(25, 149, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(26, 150, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(27, 151, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(28, 152, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(29, 134, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(30, 153, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(31, 156, 18, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(32, 157, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(33, 158, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(34, 159, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(35, 160, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(36, 161, 18, NULL, NULL, NULL, 3.0000, 3.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(37, 190, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(38, 191, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(39, 162, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(40, 163, 18, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(41, 219, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(42, 164, 18, NULL, NULL, NULL, 3.0000, 3.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(43, 192, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(44, 165, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(45, 166, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(46, 167, 18, NULL, NULL, NULL, 6.0000, 6.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(47, 168, 18, NULL, NULL, NULL, 6.0000, 6.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(48, 169, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(49, 171, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(50, 172, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(51, 173, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(52, 136, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(53, 174, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(54, 175, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(55, 177, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(56, 178, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(57, 179, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(58, 180, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(59, 181, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(60, 182, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(61, 184, 18, NULL, NULL, NULL, 3.0000, 3.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(62, 186, 18, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(63, 187, 18, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(64, 162, 19, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(65, 195, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(66, 196, 19, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(67, 197, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(68, 150, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(69, 172, 19, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(70, 198, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(71, 199, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(72, 200, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(73, 201, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(74, 202, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(75, 203, 19, NULL, NULL, NULL, 3.0000, 3.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(76, 213, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(77, 205, 19, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(78, 206, 19, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(79, 207, 19, NULL, NULL, NULL, 3.0000, 3.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(80, 208, 19, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(81, 209, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(82, 210, 19, NULL, NULL, NULL, 6.0000, 6.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(83, 211, 19, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(84, 212, 19, NULL, NULL, NULL, 8.0000, 8.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(85, 161, 21, NULL, NULL, NULL, 31.0000, 31.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(86, 214, 21, NULL, NULL, NULL, 7.0000, 7.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(87, 215, 21, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(88, 216, 21, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(89, 217, 21, NULL, NULL, NULL, 4.0000, 4.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(90, 137, 21, NULL, NULL, NULL, 7.0000, 7.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(91, 180, 21, NULL, NULL, NULL, 113.0000, 113.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(92, 218, 21, NULL, NULL, NULL, 7.0000, 7.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(93, 219, 21, NULL, NULL, NULL, 2.0000, 2.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(94, 220, 21, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(95, 221, 21, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1),
(96, 222, 21, NULL, NULL, NULL, 1.0000, 1.0000, 0.0000, NULL, 1.000000, NULL, '2026-04-24 03:16:48', NULL, 'Migración: saldo existente sin proveedor identificado', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_general`
--

CREATE TABLE `item_general` (
  `id_item_general` int NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` tinyint DEFAULT NULL COMMENT '0 productos\\n1 materia prima\\n2 Insumos',
  `categoria_id` int DEFAULT NULL,
  `viscosidad` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `p_g` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `p_kg` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `color` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `brillo_60` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `secado` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cubrimiento` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `molienda` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ph` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `poder_tintoreo` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `unidad_id` int DEFAULT NULL,
  `costo_produccion` decimal(10,2) DEFAULT NULL,
  `precio_venta_manual` decimal(12,2) DEFAULT NULL,
  `precio_manual_activo` tinyint(1) DEFAULT '0',
  `unidad_almacenaje_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `item_general`
--

INSERT INTO `item_general` (`id_item_general`, `nombre`, `codigo`, `tipo`, `categoria_id`, `viscosidad`, `p_g`, `p_kg`, `color`, `brillo_60`, `secado`, `cubrimiento`, `molienda`, `ph`, `poder_tintoreo`, `unidad_id`, `costo_produccion`, `precio_venta_manual`, `precio_manual_activo`, `unidad_almacenaje_id`) VALUES
(1, 'BARNIZ TRANSPARENTE BRILLANTE', 'BAR001', 0, 1, '95-100 KU', '3,4+/-0,05 Kg', '', 'STD', '>=95', '12 HORAS', '', '', '', '', 5, 0.00, 56000.00, 1, 5),
(2, 'ESMALTE BLANCO', 'ESM002', 0, 1, '100-105 KU', '3,6+/-0,05 Kg', '', '', '>=90', '12 HORAS', '100+/-5 %', '', '', '', 4, 7000.00, NULL, 0, NULL),
(3, 'ESMALTE CAOBA', 'ESM003', 0, 1, '100-105 KU', '3,6+/-0,05 Kg', '', NULL, '>=90', '6 HORAS', '100+/-5%', '7.5 H', NULL, NULL, 3, 11000.00, NULL, 0, NULL),
(4, 'ESMALTE NEGRO MATE', 'ESM004', 0, 1, '105-110 KU', '3,9+/-0,05 Kg', '', NULL, '<=15', '12 HORAS', '100+/-5%', '6 H', NULL, NULL, 4, 34050.00, NULL, 0, NULL),
(5, 'ESMALTE ROJO FIESTA', 'ESM005', 0, 1, '100-105 KU', '3,6+/-0,05 Kg', '', '', '>= 90°', '12 HORAS', '100+/-5%', '', '', '', 1, 27144.00, NULL, 0, NULL),
(6, 'ESMALTE NEGRO BRILLANTE', 'ESM006', 0, 1, '100-105 KU', '3.4+/-0.05 Kg', '', '', '>= 90', '12 HORAS', '100+/-5%', '', '', '', 3, 12691.00, NULL, 0, NULL),
(7, 'ESMALTE VERDE ESMERALDA', 'ESM007', 0, 1, '100-105 KU', '3.6+/-0,05 Kg', '', '', '>=90', '12 HORAS', '100+/-5%', '', '', '', 1, 4372.00, NULL, 0, NULL),
(8, 'ESMALTE GRIS PLATA', 'ESM008', 0, 1, '100-105 KU', '3,6+/-0,05 Kg', '', '', '>=90', '12 HORAS', '100+/-5 %', '', '', '', 7, 11466.00, NULL, 0, NULL),
(9, 'ESMALTE AZUL ESPAÑOL', 'ESM009', 0, 1, '100-105 KU', '3,6+/-0,05 Kg', '', NULL, '>=90', '12 HORAS', '100+/-5 %', '7.5 H', NULL, NULL, NULL, 16300.00, NULL, 0, NULL),
(10, 'ESMALTE BLANCO MATE', 'ESM010', 0, 1, '95-100', '4,2 +/- 0,1 Kg', '', '', '15', '12 HORAS', '100+/-5', '', '', '', 3, 17000.00, NULL, 0, NULL),
(11, 'ESMALTE AMARILLO', 'ESM011', 0, 1, '100-105 KU', '3,6+/-0,05 Kg', '', NULL, '>=90', '12 HORAS', '100+/-5', '7.5 H', NULL, NULL, NULL, 4400.00, NULL, 0, NULL),
(12, 'ESMALTE NARANJA', 'ESM012', 0, 1, '100-105', '3.5+/-0.05', '', NULL, '>=90', '12 HORAS', '100+/-5', '7.5 H', NULL, NULL, NULL, 14300.00, NULL, 0, NULL),
(13, 'ESMALTE TABACO', 'ESM013', 0, 1, '100-105KU', '3.5+/-0.05', '', NULL, '>=90', '12 HORAS', '100+/-5', '7.5 H', NULL, NULL, NULL, 40.00, NULL, 0, NULL),
(14, 'ANTICORROSIVO GRIS', 'ANT014', 0, 3, '105-110 KU', '4.2+/-0.05 Kg', '', NULL, 'MATE', '6 HORAS', '100+/-5', '5,5', NULL, NULL, NULL, 1550.00, NULL, 0, NULL),
(15, 'ANTICORROSIVO NEGRO', 'ANT015', 0, 3, '105-110 KU', '4.2+/-0.05 Kg', '', NULL, 'MATE', '6 HORAS', '100+/-5', '5,5', NULL, NULL, NULL, 4617.00, NULL, 0, NULL),
(16, 'ANTICORROSIVO AMARILLO', 'ANT016', 0, 3, '105-110 KU', '4.2+/-0.05 Kg', '', NULL, 'MATE', '6 HORAS', '100+/-5', '5,5', NULL, NULL, NULL, 8640.00, NULL, 0, NULL),
(17, 'ANTICORROSIVO ROJO', 'ANT017', 0, 3, '105-110 KU', '4.2+/-0.05 Kg', '', NULL, 'MATE', '6 HORAS', '100+/-5', '5,5', NULL, NULL, NULL, 14300.00, NULL, 0, NULL),
(18, 'ANTICORROSIVO BLANCO', 'ANT018', 0, 3, '105-110 KU', '4.2+/-0.05 Kg', '', NULL, 'MATE', '6 HORAS', '100+/-5', '5,5', NULL, NULL, NULL, 855.00, NULL, 0, NULL),
(19, 'ANTICORROSIVO VERDE', 'ANT019', 0, 3, '105-110 KU', '4.2+/-0.05 Kg', '', NULL, 'MATE', '6 HORAS', '100+/-5', '5,5', NULL, NULL, NULL, 5400.00, NULL, 0, NULL),
(20, 'PASTA ESMALTE VERDE ENTONADOR', 'PAS020', 0, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 8105.00, NULL, 0, NULL),
(21, 'PASTA ESMALTE AZUL ENTONADOR', 'PAS021', 0, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 12215.00, NULL, 0, NULL),
(22, 'PASTA ESMALTE NEGRO', 'PAS022', 2, 2, '100 KU', '4,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 19945.00, NULL, 0, NULL),
(23, 'PASTA ESMALTE ROJO CARMIN 57:1', 'PAS023', 0, 2, '100 KU', '5,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 14152.00, NULL, 0, NULL),
(24, 'PASTA ESMALTE NARANJA', 'PAS024', 2, 2, '100 KU', '5,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 11447.00, NULL, 0, NULL),
(25, 'PASTA ESMALTE AMARILLO', 'PAS025', 0, 2, '100 KU', '5,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 12718.00, NULL, 0, NULL),
(26, 'PASTA ESMALTE CAOBA', 'PAS026', 2, 2, '100 KU', '5,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 7742.00, NULL, 0, NULL),
(27, 'PASTA ESMALTE AMARILLO OXIDO', 'PAS027', 2, 2, '100 KU', '5,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 11447.00, NULL, 0, NULL),
(28, 'PASTA ESMALTE ROJO OXIDO', 'PAS028', 0, 2, '100 KU', '5,55', '', 'STD', NULL, NULL, NULL, '>7H', '-', 'STD', NULL, 1690.00, NULL, 0, NULL),
(29, 'PASTA ESMALTE BLANCO', 'PAS029', 0, 2, '120', '5,78', '', 'STD', NULL, NULL, NULL, '7,5', '-', '100 +/- 0.5 %', NULL, 10303.00, NULL, 0, NULL),
(30, 'PASTA ESMALTE TABACO', 'PAS030', 2, 2, '95-100', '5.71-5.91', '', 'STD', NULL, NULL, NULL, '7,5', '-', 'STD', NULL, 722.00, NULL, 0, NULL),
(31, 'RESINA MEDIA EN SOYA AL 50%', 'RAM014', 1, 0, '', '', '', '', '', '', '', '', '', '', 0, 715.00, NULL, 0, NULL),
(32, 'METIL ETIL CETOXIMA', 'AAN002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4300.00, NULL, 0, NULL),
(33, 'OCTOATO DE COBALTO AL 12%', 'SOC011', 1, 0, '', '', '', '', '', '', '', '', '', '', 0, 4400.00, NULL, 0, NULL),
(34, 'OCTOATO DE ZIRCONIO AL 24%', 'SOZ024', 1, 0, '', '', '', '', '', '', '', '', '', '', 0, 8000.00, NULL, 0, NULL),
(35, 'OCTOATO DE CALCIO AL 10%', 'SOC010', 1, 0, '', '', '', '', '', '', '', '', '', '', 0, 8000.00, NULL, 0, NULL),
(36, 'DISOLVENTE 2232 #3', 'SAA011', 1, 0, '', '', '', '', '', '', '', '', '', '', 0, 1103.00, NULL, 0, NULL),
(37, 'DIOXIDO DE TITANIO SULFATO', 'PED010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 22700.00, NULL, 0, NULL),
(38, 'OCTOATO DE ZINC AL 16%', 'SOZ016', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 43900.00, NULL, 0, NULL),
(39, 'BENTOCLAY BP 184', 'AAS005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 37300.00, NULL, 0, NULL),
(40, 'ETANOL AL 96%', 'SAA022', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 22700.00, NULL, 0, NULL),
(41, 'DISASTAB GAT', 'AEM005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7000.00, NULL, 0, NULL),
(42, 'AGUA', 'SIA040', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 19500.00, NULL, 0, NULL),
(43, 'SULFATO DE MAGNESIO', 'AET004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 33500.00, NULL, 0, NULL),
(44, 'VARSOL', 'SAV010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 37200.00, NULL, 0, NULL),
(46, 'DISASTAB GAT', 'AEM004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 10400.00, NULL, 0, NULL),
(47, 'MICROTALC C 20', 'CTA011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 8000.00, NULL, 0, NULL),
(48, 'CELITE 499', 'MSI006', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11466.00, NULL, 0, NULL),
(50, 'PASTA ESMALTE ROJO 57:1', 'PE1033', 2, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17000.00, NULL, 0, NULL),
(52, 'PASTA AMARILLO CROMO MEDIO', 'PE1010', 2, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17000.00, NULL, 0, NULL),
(54, 'PASTA VERDE FTALO', 'PE1040', 2, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4617.00, NULL, 0, NULL),
(56, 'PASTA ESMALTE AZUL FTALO 15:3', 'PE1021', 2, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 22700.00, NULL, 0, NULL),
(57, 'OMYACARB UF', 'CCC002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11000.00, NULL, 0, NULL),
(59, 'MICROTALC C 20', 'CTA025', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(60, 'CARBONATO DE CALCIO HI WHITE', 'CCC004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(61, 'LECITINA DE SOYA', 'AHU002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(62, 'ETANOL AL 96%', 'SAM023', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(63, 'OXIDO DE HIERRO AMARILLO Y 4021', 'PEA010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(64, 'OXIDO DE HIERRO ROJO R-5530', 'PER030', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(65, 'MICROTALC 20', 'CTA020', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(66, 'TROYSPERSE CD1', 'ADI002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(67, 'PIGMENTO VERDE FTALO 7', 'PEV053', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(68, 'PIGMENTO AZUL FTALO 15;3', 'PEA041', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(69, 'EDAPLAN 918 / LANSPERSE SUV', 'ADI010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(70, 'RESINA MEDIA EN SOYA AL 50%', 'MS-45', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(71, 'POW CARBON BLACK CHEMO', 'PEN081', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(72, 'PIGMENTO ROJO CARMIN 57:1', 'PER031', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(73, 'PIGMENTO NARANJA MOLIBDENO', 'PEN023', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(74, 'PIGMENTO MARILLO DE CROMO AL 73', 'PEA011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(75, 'PIGMENTO OXIFERR CAOBA MARRON M 4781', 'PEC081', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(76, 'PIGMENTO OXIFERR AMARILLO Y-4011', 'PEA013', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(77, 'DIOXIDO DE TITANIO SULFATO 2196', 'PED007', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(78, 'OXIFER TABACO R-4370', 'PET080', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 8105.00, NULL, 0, NULL),
(79, 'BENTOCLAY BP 184', 'AAS012', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(80, 'METANOL', 'SAM023', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(81, 'ORGANOCLAY BK 884', 'AAS005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(83, 'DISOLVENTE 2232 / VARSOL', 'SAA011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(84, 'EDAPLAN 915', 'ADI010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(85, 'CHEMOSPERSE 77', 'ADI011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(86, 'ADIMON 84', 'AAN002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 0, NULL),
(87, 'DISOLVENTE #3', 'SAA011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4372.00, NULL, 0, NULL),
(88, 'ETANOL 96%', 'SAA022', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4400.00, NULL, 0, NULL),
(89, 'DISOLVENTE 2232', 'SAA011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4372.00, NULL, 0, NULL),
(90, 'DISOLVENTE 3', 'SAA011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4372.00, NULL, 0, NULL),
(92, 'OCTOATO DE ZINC 16%', 'SOZ016', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 16300.00, NULL, 0, NULL),
(93, 'PASTA ESMALTE AMARILLO CROMO MEDIO', 'PE1010', 2, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 14152.00, NULL, 0, NULL),
(94, 'DIOXIDO DE TITANIO SULFATO 2196', 'PED010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11466.00, NULL, 0, NULL),
(95, 'BENTOCLAY BP184', 'AAS005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17000.00, NULL, 0, NULL),
(96, 'PASTA ESMALTE AZUL 15:3', 'PE1021', 2, 2, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11447.00, NULL, 0, NULL),
(97, 'EDAPLAN 918', 'ADI010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 22700.00, NULL, 0, NULL),
(98, 'EDAPLAN 918 / LANSPERSE SUV', 'ADI010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 22700.00, NULL, 0, NULL),
(99, 'CHEMOSPERSE 77', 'ADI010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 22700.00, NULL, 0, NULL),
(100, 'PIGMENTO OXIFERR ROJO R-5530', 'PER030', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(114, 'Agua (MP)', 'MP-001', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(115, 'TPF (MP)', 'MP-002', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(116, 'Dispersante (MP)', 'MP-003', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(117, 'Masellose (MP)', 'MP-004', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(118, 'Tergitol (MP)', 'MP-005', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(119, 'Dietilen (MP)', 'MP-006', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(120, 'Texanol (MP)', 'MP-007', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(121, 'Antiespumante (MP)', 'MP-008', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(122, 'Titanio (MP)', 'MP-009', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(123, 'Carbonato de calcio (MP)', 'MP-010', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(124, 'Talco Ty 400 (MP)', 'MP-011', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(125, 'Caolin (MP)', 'MP-012', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(126, 'Carbonato UF (MP)', 'MP-013', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(127, 'Acronal (MP)', 'MP-014', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(128, 'Bactericida (MP)', 'MP-015', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(129, 'Aceite Pino (MP)', 'MP-016', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(130, 'Aisol 700 (MP)', 'MP-017', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(131, 'Amoniaco (MP)', 'MP-018', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(132, 'Fungicida (MP)', 'MP-019', 1, 0, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(133, 'VINILO T1 BLANCO', 'EBT012', 0, 1, '', '', '', '', '', '', '', '', '', '', NULL, 1.00, NULL, 0, NULL),
(134, 'SIKA WT-100 CO', 'SIK001', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(135, 'POLASTOCRETE', 'SIK002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(136, 'SIKA STABILIZER 4R CO', 'SIK003', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(137, 'SIKALASTIC 851 R COMP A', 'SIK004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(138, 'PLASTIMENT TM 5-CO', 'SIK005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(139, 'SARNACOL 2130', 'SIK006', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(140, 'SIKAFUND MO-CO', 'SIK007', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(141, 'RESINA ACRILICA MASFLEX', 'RES001', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(142, 'UFI PRETHOX', 'VAR001', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(143, 'RESINA NEGRA (POR IDENTIFICAR)', 'RES002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(144, 'PASTA AZUL PHILAC', 'PHI001', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(145, 'ADITIVO NEGRO (MUESTRA)', 'VAR002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(146, 'SOLVENTE (POR IDENTIFICAR)', 'SAA099', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(147, 'PROPIL MORENO', 'VAR003', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(148, 'SILVACOL', 'VAR004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(149, 'HORNESABE BLANCO', 'HOR001', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(150, 'HORNESABE BEIGE', 'HOR002', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(151, 'HORNESABE ALEMANA', 'HOR003', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(152, 'HORNESABE AMARILLO', 'HOR004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(153, 'SIKA FLOR CURATHANE', 'SIK008', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(154, 'CAT PU', 'VAR005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(155, 'SIKALASTIC 871 R COMP B', 'SIK009', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(156, 'LODO EPOXÍCO / RESINA EN POLVO', 'VAR006', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(157, 'CAT SKAUR 32', 'VAR007', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(158, 'PU VDE', 'VAR008', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(159, 'RESINAS FERROBAR 903', 'RES003', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(160, 'SIKALASTIC 830 COMP B', 'SIK010', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(161, 'ETHYL SILICATO', 'VAR009', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(162, 'RESINA CORTA R4', 'RES004', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(163, 'RESINA PU', 'RES005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(164, 'PASTA ROJA PHILAC', 'PHI002', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(165, 'PINTURA NEGRA COOKROT', 'VAR010', 0, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(166, 'XLOC PHILAC SOLVENTE', 'PHI003', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(167, 'SIKA PLAY 169', 'SIK011', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(168, 'SIKA FLUID 169', 'SIK012', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(169, 'SIKAMANTO FLEX COMP A', 'SIK013', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(170, 'LATEX PESANTE PARA TEJAS', 'VAR011', 0, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(171, 'PASTA CAOBA PHILAC', 'PHI004', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(172, 'HORNESABE BCO', 'HOR005', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(173, 'GROUP MORENO', 'VAR012', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(174, 'SOLVENTE SUCIO SIKA', 'SIK014', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(175, 'PROPILER RESINA COMP B', 'RES006', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(176, 'SELLADOR NITRO', 'VAR013', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(177, 'BINDA POLIURETANO', 'VAR014', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(178, 'VINILO BEIGE', 'VAR015', 0, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(179, 'RESINA BEA EPOXICA', 'RES007', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(180, 'FRUTA ROJA', 'PHI005', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(181, 'RESINA BLANCA', 'RES008', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(182, 'RESINA NARANJA', 'RES009', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(183, 'MAFA LACA', 'VAR016', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(184, 'SIKAPLAST REVOLVER CON AMOLRED', 'SIK015', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(185, 'PASTA AMARILLA PHILAC', 'PHI006', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(186, 'ALCONA CATANAS', 'VAR017', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(187, 'SODA PH CONEXA AZL', 'VAR018', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(188, 'CANALINOSE IBC', 'VAR019', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(189, 'RESINA SIKA (MUESTRA)', 'SIK022', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(190, 'INJEX HORENEM ADECRIL', 'VAR028', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(191, 'CODO EPOXÍCO SIKA', 'VAR029', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(192, 'NEGRO - NARANJA (POR IDENTIFICAR)', 'VAR031', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(193, 'RASPER BASE BESS', 'VAR032', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(194, 'ROJO IBC MASFLEX', 'VAR030', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(195, 'EPOXICA (POR IDENTIFICAR)', 'VAR020', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(196, 'PASTA AZUL CON GENA MORENO', 'PHI007', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(197, 'HORNESABE DORADO', 'HOR006', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(198, 'HORNESABE DORADO COBRE', 'HOR007', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(199, 'HORNESABE VERDE ALBOA', 'HOR008', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(200, 'HORNESABE AMARILLA', 'HOR009', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(201, 'SPLANDER PHILAC', 'PHI008', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(202, 'MICA INTERIOR PHILAC', 'PHI009', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(203, 'PASTA MORADA CARVAJAL PHILAC', 'PHI010', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(204, 'PASTA VIOLETA', 'PHI011', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(205, 'GPS SIKA (MUESTRA)', 'SIK016', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(206, 'XLOC PHILAC (POR ANALIZAR)', 'PHI012', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(207, 'ANT BES AREPHE', 'VAR021', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(208, 'MOLOC NARANJA', 'VAR022', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(209, 'PASTA AZUL (TAMBOR LOP)', 'PHI013', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(210, 'POLIESTER POP LUCY', 'VAR023', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(211, 'CAT EPOXÍCO IBC', 'VAR024', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(212, 'VINILO POP COLONIAL', 'VAR025', 0, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(213, 'TAMBOR AMARILLO SIKA (POR IDENTIFICAR)', 'SIK023', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(214, 'SIKAPLAST REVOLVER', 'SIK017', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(215, 'SIKA FULL REVOLVER', 'SIK018', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(216, 'SIKA FILM', 'SIK019', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(217, 'SIKA TRAFIC COMP A', 'SIK020', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(218, 'MANCHA (COLORANTE)', 'PHI014', 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(219, 'SPLANDER', 'VAR026', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(220, 'LACANTE', 'VAR027', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(221, 'SOLVENTE CON BORNELO', 'SAA030', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(222, '2N SIKA STABILIZER 100', 'SIK021', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0, 1),
(223, 'BARNIZ EPOXICO ', 'EP01', 0, 4, '', '', '', '', '', '', '', '', '', '', 2, NULL, NULL, 0, NULL),
(224, 'EPOXICA TRANSPARENTE', 'EPTR91', 0, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 0.00, NULL, 0, NULL),
(225, 'XILOL', 'XIL21288', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(226, 'RESINA EPOXICA', 'NPSN CHINA', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(228, 'VARSOL', 'VAR9218', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(229, 'RESINA MEDIA EN SOYA', '291283', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 6200.00, NULL, 0, NULL),
(230, 'DISPERSANTE', NULL, 2, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 9),
(231, 'DISPERSANTE', '093816', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 5378.00, NULL, 0, NULL),
(232, 'CLEYTHONE', '927163', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(233, 'AZUL ULTRAMAR', '018273', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(234, 'TITANEO', '092192', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(235, 'CARBONATO UF', '556115', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 20.00, NULL, 0, NULL),
(236, 'FOSFATO ZINC', '521584', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 1000.00, NULL, 0, NULL),
(237, 'VARSOL', 'VARPD281', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(238, 'COBALTO', '821722', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(239, 'ZIRCONIO', '032936', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(240, 'CALCIO', '545421', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(241, 'ANTIPIEL', '545124', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(242, 'P-400', '545124', 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, 2000.00, NULL, 0, NULL),
(243, 'XILOL', NULL, 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 9),
(244, 'ISOBUTANOL', NULL, 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 9),
(245, 'BUTIL GLICOL', NULL, 1, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 9);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_general_formulaciones`
--

CREATE TABLE `item_general_formulaciones` (
  `id_item_general_formulaciones` int NOT NULL,
  `formulaciones_id` int NOT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `porcentaje` int DEFAULT NULL,
  `item_general_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `item_general_formulaciones`
--

INSERT INTO `item_general_formulaciones` (`id_item_general_formulaciones`, `formulaciones_id`, `cantidad`, `porcentaje`, `item_general_id`) VALUES
(1, 2, 914.00, NULL, 31),
(2, 1, 932.00, NULL, 31),
(3, 1, 3.72, NULL, 32),
(4, 1, 6.52, NULL, 33),
(5, 1, 10.25, NULL, 34),
(6, 1, 9.32, NULL, 35),
(7, 1, 301.00, NULL, 36),
(8, 2, 425.00, NULL, 31),
(9, 2, 293.00, NULL, 37),
(10, 2, 2.63, NULL, 38),
(11, 2, 16.00, NULL, 39),
(12, 2, 8.00, NULL, 40),
(13, 2, 14.20, NULL, 41),
(14, 2, 470.00, NULL, 42),
(15, 2, 4.70, NULL, 43),
(16, 2, 5.20, NULL, 86),
(17, 2, 9.37, NULL, 33),
(18, 2, 14.72, NULL, 34),
(19, 2, 13.40, NULL, 35),
(20, 2, 197.00, NULL, 36),
(21, 2, 200.00, NULL, 44),
(22, 3, 775.00, NULL, 31),
(23, 3, 103.00, NULL, 26),
(24, 3, 8.70, NULL, 41),
(25, 3, 290.00, NULL, 42),
(26, 3, 3.00, NULL, 43),
(27, 3, 3.30, NULL, 86),
(28, 3, 5.78, NULL, 33),
(29, 3, 9.10, NULL, 34),
(30, 3, 8.26, NULL, 35),
(31, 3, 113.00, NULL, 36),
(32, 3, 114.00, NULL, 44),
(33, 4, 775.00, NULL, 31),
(34, 4, 224.00, NULL, 47),
(35, 4, 40.00, NULL, 48),
(36, 4, 12.00, NULL, 81),
(37, 4, 6.00, NULL, 40),
(38, 4, 125.00, NULL, 22),
(39, 4, 8.70, NULL, 41),
(40, 4, 290.00, NULL, 42),
(41, 4, 2.90, NULL, 43),
(42, 4, 3.35, NULL, 86),
(43, 4, 5.86, NULL, 33),
(44, 4, 9.21, NULL, 34),
(45, 4, 8.37, NULL, 35),
(46, 4, 227.00, NULL, 44),
(47, 5, 775.00, NULL, 31),
(48, 5, 36.56, NULL, 50),
(49, 5, 79.40, NULL, 24),
(50, 5, 6.00, NULL, 41),
(51, 5, 200.00, NULL, 42),
(52, 5, 2.00, NULL, 43),
(53, 5, 3.33, NULL, 86),
(54, 5, 5.83, NULL, 33),
(55, 5, 9.16, NULL, 34),
(56, 5, 8.32, NULL, 35),
(57, 5, 227.00, NULL, 36),
(58, 6, 775.00, NULL, 31),
(59, 6, 125.00, NULL, 22),
(60, 6, 5.70, NULL, 41),
(61, 6, 190.00, NULL, 42),
(62, 6, 1.90, NULL, 43),
(63, 6, 3.35, NULL, 86),
(64, 6, 5.86, NULL, 33),
(65, 6, 9.21, NULL, 34),
(66, 6, 8.37, NULL, 35),
(67, 6, 227.00, NULL, 44),
(68, 7, 775.00, NULL, 31),
(69, 7, 62.00, NULL, 52),
(70, 7, 10.40, NULL, 56),
(71, 7, 108.00, NULL, 54),
(72, 7, 6.20, NULL, 41),
(73, 7, 205.00, NULL, 42),
(74, 7, 2.10, NULL, 43),
(75, 7, 3.46, NULL, 86),
(76, 7, 6.05, NULL, 33),
(77, 7, 9.51, NULL, 34),
(78, 7, 8.65, NULL, 35),
(79, 7, 113.00, NULL, 36),
(80, 7, 114.00, NULL, 44),
(81, 8, 425.00, NULL, 31),
(82, 8, 251.00, NULL, 37),
(83, 8, 2.63, NULL, 38),
(84, 8, 16.00, NULL, 39),
(85, 8, 8.00, NULL, 40),
(86, 8, 3.30, NULL, 27),
(87, 8, 17.00, NULL, 22),
(88, 8, 14.20, NULL, 41),
(89, 8, 470.00, NULL, 42),
(90, 8, 4.70, NULL, 43),
(91, 8, 5.20, NULL, 86),
(92, 8, 9.37, NULL, 33),
(93, 8, 14.72, NULL, 34),
(94, 8, 13.40, NULL, 35),
(95, 8, 197.00, NULL, 36),
(96, 8, 200.00, NULL, 44),
(97, 9, 225.00, NULL, 31),
(98, 9, 56.00, NULL, 37),
(99, 9, 0.70, NULL, 38),
(100, 9, 2.00, NULL, 39),
(101, 9, 1.00, NULL, 40),
(102, 9, 168.00, NULL, 56),
(103, 9, 11.20, NULL, 50),
(104, 9, 9.70, NULL, 41),
(105, 9, 323.00, NULL, 42),
(106, 9, 3.23, NULL, 43),
(107, 9, 5.40, NULL, 86),
(108, 9, 9.45, NULL, 33),
(109, 9, 14.86, NULL, 34),
(110, 9, 13.51, NULL, 35),
(111, 9, 197.00, NULL, 36),
(112, 9, 165.00, NULL, 44),
(113, 10, 1173.00, NULL, 31),
(114, 10, 288.00, NULL, 37),
(115, 10, 435.00, NULL, 57),
(116, 10, 84.00, NULL, 48),
(117, 10, 5.00, NULL, 38),
(118, 10, 25.00, NULL, 39),
(119, 10, 10.00, NULL, 40),
(120, 10, 14.30, NULL, 41),
(121, 10, 477.00, NULL, 42),
(122, 10, 4.80, NULL, 43),
(123, 10, 4.69, NULL, 86),
(124, 10, 8.20, NULL, 33),
(125, 10, 12.90, NULL, 34),
(126, 10, 11.70, NULL, 35),
(127, 10, 433.00, NULL, 44),
(128, 11, 1033.00, NULL, 31),
(129, 11, 294.70, NULL, 52),
(130, 11, 11.13, NULL, 41),
(131, 11, 371.00, NULL, 42),
(132, 11, 3.70, NULL, 43),
(133, 11, 4.72, NULL, 86),
(134, 11, 8.26, NULL, 33),
(135, 11, 13.00, NULL, 34),
(136, 11, 11.81, NULL, 35),
(137, 11, 391.00, NULL, 44),
(138, 12, 1033.00, NULL, 31),
(139, 12, 180.00, NULL, 24),
(140, 12, 77.00, NULL, 52),
(141, 12, 11.00, NULL, 41),
(142, 12, 363.00, NULL, 42),
(143, 12, 3.66, NULL, 43),
(144, 12, 4.64, NULL, 86),
(145, 12, 8.13, NULL, 33),
(146, 12, 12.77, NULL, 34),
(147, 12, 11.61, NULL, 35),
(148, 12, 391.00, NULL, 44),
(149, 13, 1033.00, NULL, 31),
(150, 13, 190.00, NULL, 30),
(151, 13, 11.00, NULL, 41),
(152, 13, 363.00, NULL, 42),
(153, 13, 3.60, NULL, 43),
(154, 13, 4.50, NULL, 86),
(155, 13, 7.90, NULL, 33),
(156, 13, 12.40, NULL, 34),
(157, 13, 11.30, NULL, 35),
(158, 13, 391.00, NULL, 44),
(159, 14, 1056.00, NULL, 31),
(160, 14, 186.00, NULL, 77),
(161, 14, 848.00, NULL, 59),
(162, 14, 70.00, NULL, 60),
(163, 14, 5.00, NULL, 61),
(164, 14, 25.00, NULL, 39),
(165, 14, 5.00, NULL, 40),
(166, 14, 17.80, NULL, 41),
(167, 14, 593.00, NULL, 42),
(168, 14, 5.93, NULL, 43),
(169, 14, 4.30, NULL, 86),
(170, 14, 7.40, NULL, 33),
(171, 14, 11.60, NULL, 34),
(172, 14, 10.60, NULL, 35),
(173, 14, 20.00, NULL, 22),
(174, 14, 550.00, NULL, 44),
(175, 15, 256.00, NULL, 31),
(176, 15, 37.00, NULL, 22),
(177, 15, 2.30, NULL, 61),
(178, 15, 46.00, NULL, 60),
(179, 15, 132.00, NULL, 59),
(180, 15, 4.00, NULL, 79),
(181, 15, 2.00, NULL, 40),
(182, 15, 3.70, NULL, 41),
(183, 15, 123.00, NULL, 42),
(184, 15, 1.30, NULL, 43),
(185, 15, 1.10, NULL, 86),
(186, 15, 2.00, NULL, 33),
(187, 15, 3.00, NULL, 34),
(188, 15, 2.80, NULL, 35),
(189, 15, 89.60, NULL, 44),
(190, 16, 274.00, NULL, 31),
(191, 16, 47.00, NULL, 63),
(192, 16, 220.00, NULL, 59),
(193, 16, 18.00, NULL, 60),
(194, 16, 1.30, NULL, 61),
(195, 16, 6.50, NULL, 39),
(196, 16, 4.00, NULL, 40),
(197, 16, 4.80, NULL, 41),
(198, 16, 160.00, NULL, 42),
(199, 16, 1.60, NULL, 43),
(200, 16, 1.10, NULL, 86),
(201, 16, 1.92, NULL, 33),
(202, 16, 3.00, NULL, 34),
(203, 16, 2.74, NULL, 35),
(204, 16, 142.60, NULL, 44),
(205, 17, 274.00, NULL, 31),
(206, 17, 58.00, NULL, 64),
(207, 17, 220.00, NULL, 59),
(208, 17, 18.00, NULL, 60),
(209, 17, 1.30, NULL, 61),
(210, 17, 6.50, NULL, 39),
(211, 17, 4.00, NULL, 40),
(212, 17, 4.70, NULL, 41),
(213, 17, 155.60, NULL, 42),
(214, 17, 1.55, NULL, 43),
(215, 17, 1.10, NULL, 86),
(216, 17, 1.92, NULL, 33),
(217, 17, 3.00, NULL, 34),
(218, 17, 2.74, NULL, 35),
(219, 17, 142.60, NULL, 44),
(220, 18, 1056.00, NULL, 31),
(221, 18, 165.00, NULL, 77),
(222, 18, 230.00, NULL, 65),
(223, 18, 688.00, NULL, 60),
(224, 18, 5.00, NULL, 38),
(225, 18, 25.00, NULL, 39),
(226, 18, 5.00, NULL, 40),
(227, 18, 17.55, NULL, 41),
(228, 18, 585.26, NULL, 42),
(229, 18, 5.85, NULL, 43),
(230, 18, 4.30, NULL, 86),
(231, 18, 7.40, NULL, 33),
(232, 18, 11.60, NULL, 34),
(233, 18, 10.60, NULL, 35),
(234, 18, 550.00, NULL, 44),
(235, 19, 256.00, NULL, 31),
(236, 19, 36.00, NULL, 77),
(237, 19, 10.00, NULL, 63),
(238, 19, 20.00, NULL, 96),
(239, 19, 3.00, NULL, 22),
(240, 19, 2.30, NULL, 61),
(241, 19, 46.00, NULL, 60),
(242, 19, 132.00, NULL, 59),
(243, 19, 4.00, NULL, 39),
(244, 19, 2.00, NULL, 40),
(245, 19, 3.90, NULL, 41),
(246, 19, 130.00, NULL, 42),
(247, 19, 1.30, NULL, 43),
(248, 19, 1.10, NULL, 86),
(249, 19, 2.00, NULL, 33),
(250, 19, 3.00, NULL, 34),
(251, 19, 2.80, NULL, 35),
(252, 19, 89.60, NULL, 44),
(253, 20, 186.00, NULL, 31),
(254, 20, 3.00, NULL, 32),
(255, 20, 3.00, NULL, 39),
(256, 20, 8.00, NULL, 66),
(257, 20, 50.00, NULL, 67),
(258, 20, 2.00, NULL, 40),
(259, 20, 76.00, NULL, 44),
(260, 21, 186.00, NULL, 31),
(261, 21, 3.00, NULL, 32),
(262, 21, 5.00, NULL, 79),
(263, 21, 3.00, NULL, 80),
(264, 21, 15.00, NULL, 61),
(265, 21, 52.00, NULL, 68),
(266, 21, 5.00, NULL, 97),
(267, 21, 76.00, NULL, 44),
(268, 22, 242.00, NULL, 31),
(269, 22, 3.10, NULL, 86),
(270, 22, 9.00, NULL, 97),
(271, 22, 25.00, NULL, 61),
(272, 22, 59.00, NULL, 71),
(273, 23, 55.00, NULL, 31),
(274, 23, 0.80, NULL, 39),
(275, 23, 0.40, NULL, 80),
(276, 23, 0.25, NULL, 86),
(277, 23, 2.80, NULL, 85),
(278, 23, 1.60, NULL, 61),
(279, 23, 24.00, NULL, 72),
(280, 23, 34.00, NULL, 44),
(281, 24, 332.00, NULL, 31),
(282, 24, 9.00, NULL, 39),
(283, 24, 5.00, NULL, 80),
(284, 24, 3.10, NULL, 86),
(285, 24, 35.00, NULL, 85),
(286, 24, 18.90, NULL, 61),
(287, 24, 408.00, NULL, 73),
(288, 24, 150.00, NULL, 44),
(289, 25, 332.00, NULL, 31),
(290, 25, 9.00, NULL, 39),
(291, 25, 5.00, NULL, 80),
(292, 25, 3.10, NULL, 86),
(293, 25, 18.90, NULL, 61),
(294, 25, 465.00, NULL, 74),
(295, 25, 150.00, NULL, 44),
(296, 26, 295.00, NULL, 31),
(297, 26, 6.00, NULL, 39),
(298, 26, 3.00, NULL, 80),
(299, 26, 3.10, NULL, 86),
(300, 26, 35.00, NULL, 97),
(301, 26, 18.90, NULL, 61),
(302, 26, 340.00, NULL, 75),
(303, 26, 173.00, NULL, 44),
(304, 27, 295.00, NULL, 31),
(305, 27, 6.00, NULL, 39),
(306, 27, 3.00, NULL, 80),
(307, 27, 3.10, NULL, 86),
(308, 27, 18.90, NULL, 61),
(309, 27, 340.00, NULL, 76),
(310, 27, 150.00, NULL, 36),
(311, 28, 295.00, NULL, 31),
(312, 28, 6.00, NULL, 39),
(313, 28, 3.00, NULL, 80),
(314, 28, 3.10, NULL, 86),
(315, 28, 17.00, NULL, 97),
(316, 28, 18.90, NULL, 61),
(317, 28, 340.00, NULL, 100),
(318, 28, 150.00, NULL, 36),
(319, 29, 213.00, NULL, 31),
(320, 29, 22.00, NULL, 39),
(321, 29, 4.00, NULL, 66),
(322, 29, 5.00, NULL, 40),
(323, 29, 441.00, NULL, 37),
(324, 29, 63.00, NULL, 44),
(325, 30, 1.00, NULL, 86),
(326, 30, 185.00, NULL, 78),
(327, 30, 134.00, NULL, 31),
(328, 30, 6.00, NULL, 66),
(329, 30, 8.00, NULL, 39),
(330, 30, 7.00, NULL, 61),
(331, 30, 33.00, NULL, 44),
(332, 30, 2.00, NULL, 40),
(333, 25, 35.00, NULL, 84),
(334, 27, 35.00, NULL, 84),
(335, 22, 150.00, NULL, 83),
(366, 50, 5.00, 0, 35),
(367, 50, 10.00, 0, 47),
(368, 51, 180.00, 0, 229),
(369, 51, 2.00, 0, 231),
(370, 52, 360.00, 0, 229),
(371, 52, 2.00, 0, 231),
(372, 52, 5.00, 0, 232),
(373, 52, 0.28, 0, 233),
(374, 52, 180.00, 0, 234),
(375, 52, 20.00, 0, 235),
(376, 52, 3.00, 0, 236),
(377, 52, 195.00, 0, 237),
(378, 52, 2.00, 0, 41),
(379, 52, 95.00, 0, 42),
(380, 52, 2.00, 0, 238),
(381, 52, 2.00, 0, 239),
(382, 52, 2.00, 0, 240),
(383, 52, 2.00, 0, 241),
(384, 52, 0.35, 0, 242);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_proveedor`
--

CREATE TABLE `item_proveedor` (
  `id_item_proveedor` int NOT NULL,
  `nombre` varchar(55) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `codigo` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  `precio_con_iva` decimal(10,2) DEFAULT NULL,
  `disponible` tinyint DEFAULT NULL COMMENT '1 Disponible 2 No disponible',
  `descripcion` varchar(55) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proveedor_id` int DEFAULT NULL,
  `item_general_id` int DEFAULT NULL,
  `unidad_compra_id` int DEFAULT NULL,
  `factor_conversion` decimal(15,6) NOT NULL DEFAULT '1.000000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `item_proveedor`
--

INSERT INTO `item_proveedor` (`id_item_proveedor`, `nombre`, `codigo`, `tipo`, `precio_unitario`, `precio_con_iva`, `disponible`, `descripcion`, `proveedor_id`, `item_general_id`, `unidad_compra_id`, `factor_conversion`) VALUES
(6, 'Tubería PVC 1/2\" x 6m', 'PVC-12-6', 'Fontanería', 5000.00, 0.00, 1, 'Tubería de PVC para conducción de agua fría', 2, NULL, NULL, 1.000000),
(7, 'Codo PVC 1/2\" 90°', 'CDO-12-90', 'Fontanería', 2000.00, 1002.00, 1, 'Codo de PVC para unión de tuberías en ángulo recto', 2, NULL, NULL, 1.000000),
(8, 'Brocha 3 Pulgadas Profesional', 'BRC-3P', 'Herramientas ', 200.00, 500.00, 1, 'Brocha de cerdas sintéticas ideal para pintura acrílica', 2, NULL, NULL, 1.000000),
(9, 'Rodillo de Lana 9\"', 'RDL-9L', 'Herramientas', 0.00, 0.00, 1, 'Rodillo de lana para pintura en superficies rugosas', 2, NULL, NULL, 1.000000),
(10, 'Lija de Agua 220', 'LJ-220', 'Abrasivos', 0.00, 0.00, 1, 'Lija fina para acabado de superficies pintadas', 2, NULL, NULL, 1.000000),
(31, 'Tubería PVC 1/2\" x 6m', 'AQ-PVC-12', 'Fontanería', 4200.00, 4900.00, 1, 'Tubería PVC conducción agua fría', 8, NULL, NULL, 1.000000),
(32, 'Codo PVC 1/2\" 90°', 'AQ-CDO-12', 'Fontanería', 1750.00, 875.00, 1, 'Codo PVC 90 grados', 8, NULL, NULL, 1.000000),
(33, 'Brocha 3 Pulgadas Profesional', 'AQ-BRC-3P', 'Herramientas', 220.00, 550.00, 1, 'Brocha cerdas naturales', 8, NULL, NULL, 1.000000),
(34, 'Lija de Agua 220', 'AQ-LJ-220', 'Abrasivos', 280.00, 330.00, 1, 'Lija grano 220 acabado fino', 8, NULL, NULL, 1.000000),
(35, 'Pintura Epóxica Gris', 'AQ-EP-GR', 'Pinturas', 85000.00, 98000.00, 1, 'Pintura epóxica industrial', 8, NULL, NULL, 1.000000),
(36, 'Thinner Acrílico', 'AQ-TH-AC', 'Solventes', 22000.00, 25000.00, 1, 'Thinner para pintura acrílica', 8, NULL, NULL, 1.000000),
(37, 'Pintura Epóxica Gris', 'SL-EP-GR', 'Pinturas', 92000.00, 106000.00, 1, 'Pintura epóxica alta resistencia', 2, NULL, NULL, 1.000000),
(38, 'Thinner Acrílico', 'SL-TH-AC', 'Solventes', 19500.00, 22000.00, 1, 'Thinner acrílico industrial', 2, NULL, NULL, 1.000000),
(40, 'TALCO TY 400 G', 'QUI-MAT-0001', 'Materia Prima', 1504.00, 1790.00, 1, NULL, 23, NULL, NULL, 1.000000),
(41, 'OMIYACARB UF', 'QUI-MAT-0002', 'Materia Prima', 1828.00, 2175.00, 1, NULL, 23, NULL, NULL, 1.000000),
(42, 'COLARDIT ANTIESPUMANTE', 'QUI-ADIT-0001', 'Insumo', 7143.00, 8500.00, 1, NULL, 23, NULL, NULL, 1.000000),
(43, 'COLARCRYL ACRONAL 50', 'QUI-ADIT-0002', 'Insumo', 5252.00, 6250.00, 1, NULL, 23, NULL, NULL, 1.000000),
(44, 'COLARCIDE BACTERICIDA', 'QUI-BIO-0001', 'Insumo', 6387.00, 7600.00, 1, NULL, 23, NULL, NULL, 1.000000),
(45, 'COLARDIT REGULADOR PH', 'QUI-ADIT-0003', 'Insumo', 6555.00, 7800.00, 1, NULL, 23, NULL, NULL, 1.000000),
(46, 'DISPERSANTE', 'QUI-ADIT-0004', 'Insumo', 5378.00, 6400.00, 1, '', 23, 230, NULL, 1.000000),
(47, 'COLARDIT AS ASOCIATIVO', 'QUI-ADIT-0005', 'Insumo', 9916.00, 11800.00, 1, NULL, 23, NULL, NULL, 1.000000),
(48, 'COLARBAG FUNGICIDA', 'QUI-BIO-0002', 'Insumo', 20840.00, 24800.00, 1, NULL, 23, NULL, NULL, 1.000000),
(49, 'BRITEX CALCINADO', 'QUI-MAT-0003', 'Materia Prima', 2605.00, 3100.00, 1, NULL, 23, NULL, NULL, 1.000000),
(50, 'WEKCELO C7 CELULOSICO', 'QUI-ESP-0001', 'Insumo', 18403.00, 21900.00, 1, NULL, 23, NULL, NULL, 1.000000),
(51, 'CARBONATO DE CALCIO M325', 'CARBM325', 'Materia Prima', 300.00, 357.00, 1, '', 24, NULL, 9, 1.000000),
(52, 'CARBONATO DE CALCIO M600', 'CARBM600', 'Materia Prima', 460.00, 547.00, 1, '', 24, NULL, 9, 1.000000),
(53, 'RESINA EPOXICA', 'NPSN CHINA', 'Materia Prima', 15069.00, 17932.00, 1, '', 25, 226, 9, 1.000000),
(54, 'RESINA KR 828 100%', 'KER828', 'Materia Prima', 10300.00, 12257.00, 1, '', 26, NULL, 9, 1.000000),
(55, 'ENDURECEDOR 100%', 'NT-1515X70', 'Materia Prima', 20000.00, 23800.00, 1, '', 26, NULL, 9, 1.000000),
(56, 'ENDURECEDOR 100%', 'NX-5454', 'Materia Prima', 19700.00, 23443.00, 1, '', 26, NULL, 9, 1.000000),
(57, 'XILOL', 'XIL21288', 'Materia Prima', 6120.00, 7283.00, 1, '', 27, 225, 9, 1.000000),
(58, 'THINNER ', 'TH2092', 'Materia Prima', 15961.00, 18994.00, 1, '', 27, NULL, 3, 1.000000),
(59, 'VARSOL', 'VAR9218', 'Materia Prima', 5961.00, 7094.00, 1, '', 27, 228, NULL, 1.000000),
(60, 'VARSOL', 'VARPD281', 'Materia Prima', 1230.00, 1464.00, 1, '', 28, 237, NULL, 1.000000),
(61, 'THINNER', 'TH921298', 'Materia Prima', 880.00, 1047.00, 1, '', 28, NULL, 3, 1.000000),
(62, 'RESINA MEDIA EN SOYA AL 50%', 'RA-7', 'Materia Prima', 6200.00, 7378.00, 1, '', 29, NULL, 9, 1.000000),
(63, 'RESINA UREA FORMALDEHIDO', 'RN-9E', 'Materia Prima', 8050.00, 9580.00, 1, '', 29, NULL, 9, 1.000000),
(64, 'RESINA CORTA EN PALMISTE AL 55%', 'RA-4 ', 'Materia Prima', 7350.00, 8747.00, 1, '', 29, NULL, 9, 1.000000),
(65, 'RESINA CORTA EN SOYA AL 53%', 'RA-15', 'Materia Prima', 6900.00, 8211.00, 1, '', 29, NULL, 9, 1.000000),
(66, 'RESINA CORTA EN SOYA AL 55% (+ SOL)', 'RA-15M', 'Materia Prima', 6900.00, 8211.00, 1, '', 29, NULL, 9, 1.000000),
(67, 'RESINA CORTA EN SOYA AL 45%', 'RA-16', 'Materia Prima', 6950.00, 8271.00, 1, '', 29, NULL, 9, 1.000000),
(68, 'RESINA MALEICA SOLIDA', 'RM-1', 'Materia Prima', 11300.00, 13447.00, 1, '', 29, NULL, 9, 1.000000),
(69, 'RESINA MEDIA EN TOFA AL 50%', 'RA-22', 'Materia Prima', 7550.00, 8985.00, 1, '', 29, NULL, 9, 1.000000),
(70, 'RESINA MEDIA EN SOYA AL 50%', 'RA-23', 'Materia Prima', 6350.00, 7557.00, 1, '', 29, NULL, 9, 1.000000),
(71, 'RESINA LARGA EN SOYA AL 70%', 'RA-25', 'Materia Prima', 7300.00, 8687.00, 1, '', 29, NULL, 9, 1.000000),
(72, 'RESINA CHAIN STOPPED AL 60%', 'RA-37', 'Materia Prima', 7200.00, 8568.00, 1, '', 29, NULL, 9, 1.000000),
(73, 'RESINA CORTA EN TOFA AL 55%', 'RA-44', 'Materia Prima', 8200.00, 9758.00, 1, '', 29, NULL, 9, 1.000000),
(74, 'RESINA UREA FORMALDEHIDO', 'RN-9E', 'Materia Prima', 8050.00, 9580.00, 1, '', 29, NULL, 9, 1.000000),
(75, 'XILOL', 'XILB6800', 'Materia Prima', 0.00, 6800.00, 1, '', 30, 243, 9, 1.000000),
(76, 'ISOBUTANOL', 'ISOB7100', 'Materia Prima', 0.00, 7100.00, 1, '', 30, 244, 9, 1.000000),
(77, 'Butil Glicol', 'BUTB890', 'Materia Prima', 0.00, 8900.00, 1, '', 30, 245, 9, 1.000000);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` bigint UNSIGNED NOT NULL,
  `version` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `class` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `group` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `namespace` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `time` int NOT NULL,
  `batch` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `version`, `class`, `group`, `namespace`, `time`, `batch`) VALUES
(1, '2026-04-17-000001', 'App\\Database\\Migrations\\CreateTamboresTable', 'default', 'App', 1776779676, 1),
(2, '2026-04-21-000001', 'App\\Database\\Migrations\\CreateRequisicionesCompraTable', 'default', 'App', 1776779681, 2),
(3, '2026-04-21-000002', 'App\\Database\\Migrations\\AddUnidadBaseAndItemProveedorCompra', 'default', 'App', 1776799102, 3),
(4, '2026-04-22-000001', 'App\\Database\\Migrations\\MergeUnidadEmpaqueIntoUnidadCompra', 'default', 'App', 1777059242, 4),
(5, '2026-04-23-000001', 'App\\Database\\Migrations\\CreateInventarioCapasSystem', 'default', 'App', 1777059242, 4),
(6, '2026-04-24-000001', 'App\\Database\\Migrations\\CreateProduccionInsumosDetalle', 'default', 'App', 1777059242, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimiento_inventario`
--

CREATE TABLE `movimiento_inventario` (
  `id_movimiento_inventario` int NOT NULL,
  `tipo_movimiento` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `fecha_movimiento` date DEFAULT NULL,
  `descripcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `referencia_tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `item_general_id` int DEFAULT NULL COMMENT 'ID del producto o materia prima afectada',
  `bodega_id` int DEFAULT NULL COMMENT 'ID de la bodega donde ocurrió el movimiento',
  `referencia_id` int DEFAULT NULL COMMENT 'ID de la tabla origen (ej: ID de la Orden, Factura o Traspaso)',
  `costo_unitario` decimal(15,2) DEFAULT NULL COMMENT 'Costo unitario en el instante exacto del movimiento',
  `saldo_anterior` decimal(15,2) DEFAULT NULL COMMENT 'Cantidad en bodega antes del movimiento',
  `saldo_nuevo` decimal(15,2) DEFAULT NULL COMMENT 'Cantidad en bodega después del movimiento',
  `responsable` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nombre de la persona responsable del movimiento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `movimiento_inventario`
--

INSERT INTO `movimiento_inventario` (`id_movimiento_inventario`, `tipo_movimiento`, `cantidad`, `fecha_movimiento`, `descripcion`, `referencia_tipo`, `item_general_id`, `bodega_id`, `referencia_id`, `costo_unitario`, `saldo_anterior`, `saldo_nuevo`, `responsable`) VALUES
(6, 'Entrada', 120.00, '2025-01-10', 'Compra de materiales para producción de pintura', 'COMPRA-2025-001', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'SALIDA', 251.89, '2026-04-04', 'Consumo por orden de producción #16', 'ORDEN_PRODUCCION', 31, 1, 16, 7000.00, 300.00, 48.11, NULL),
(8, 'SALIDA', 1.01, '2026-04-04', 'Consumo por orden de producción #16', 'ORDEN_PRODUCCION', 32, 1, 16, 11000.00, 5.00, 3.99, NULL),
(9, 'SALIDA', 1.76, '2026-04-04', 'Consumo por orden de producción #16', 'ORDEN_PRODUCCION', 33, 1, 16, 34050.00, 20.00, 18.24, NULL),
(10, 'SALIDA', 2.77, '2026-04-04', 'Consumo por orden de producción #16', 'ORDEN_PRODUCCION', 34, 1, 16, 27144.00, 5.00, 2.23, NULL),
(11, 'SALIDA', 2.52, '2026-04-04', 'Consumo por orden de producción #16', 'ORDEN_PRODUCCION', 35, 1, 16, 12691.00, 3.00, 0.48, NULL),
(12, 'SALIDA', 81.35, '2026-04-04', 'Consumo por orden de producción #16', 'ORDEN_PRODUCCION', 36, 1, 16, 4372.00, 100.00, 18.65, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas_credito`
--

CREATE TABLE `notas_credito` (
  `id_nota_credito` int NOT NULL,
  `numero` varchar(20) NOT NULL,
  `facturas_id` int NOT NULL,
  `clientes_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `estado` enum('Activa','Anulada') DEFAULT 'Activa',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `notas_credito`
--

INSERT INTO `notas_credito` (`id_nota_credito`, `numero`, `facturas_id`, `clientes_id`, `usuario_id`, `fecha`, `monto`, `motivo`, `estado`, `creado_en`) VALUES
(1, 'NC-001', 1, 1, NULL, '2026-01-15', 50000.00, 'Devolución 2 galones por defecto de color', 'Activa', '2026-03-19 14:38:34'),
(2, 'NC-002', 1, 1, NULL, '2026-01-20', 25000.00, 'Ajuste por flete — registrada por error', 'Anulada', '2026-03-19 14:38:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_compra`
--

CREATE TABLE `ordenes_compra` (
  `id_orden` int UNSIGNED NOT NULL,
  `numero` varchar(20) NOT NULL,
  `proveedor_id` int NOT NULL,
  `bodegas_id` int NOT NULL,
  `fecha` date NOT NULL,
  `fecha_esperada` date DEFAULT NULL,
  `estado` enum('Borrador','Enviada','Recibida','Cancelada') DEFAULT 'Borrador',
  `total` decimal(12,2) DEFAULT '0.00',
  `observaciones` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_compra_detalle`
--

CREATE TABLE `ordenes_compra_detalle` (
  `id_detalle` int UNSIGNED NOT NULL,
  `ordenes_compra_id` int UNSIGNED NOT NULL,
  `item_proveedor_id` int NOT NULL,
  `item_general_id` int DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unit` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `cantidad_recibida` decimal(10,2) DEFAULT '0.00',
  `recibido_en` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_cliente`
--

CREATE TABLE `pagos_cliente` (
  `id_pagos_cliente` int NOT NULL,
  `fecha_pago` date DEFAULT NULL,
  `monto` decimal(7,1) DEFAULT NULL,
  `metodo_pago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` enum('pago_total','abono') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pago_total',
  `numero_referencia` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `observaciones` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `clientes_id` int DEFAULT NULL,
  `facturas_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `pagos_cliente`
--

INSERT INTO `pagos_cliente` (`id_pagos_cliente`, `fecha_pago`, `monto`, `metodo_pago`, `tipo`, `numero_referencia`, `observaciones`, `clientes_id`, `facturas_id`, `creado_en`, `usuario_id`) VALUES
(1, '2025-01-15', 750000.0, 'transferencia', 'pago_total', 'TRF-20250115-001', 'Pago total factura 89211291', 2, 2, '2026-03-07 14:04:50', NULL),
(2, '2025-11-20', 175000.0, 'nequi', 'abono', 'NEQ-20251120-033', 'Primer abono FAC-20', 1, 1, '2026-03-07 14:04:50', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preparaciones`
--

CREATE TABLE `preparaciones` (
  `id_preparaciones` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `observaciones` text,
  `estado` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=PENDIENTE, 1=EN_PROCESO, 2=COMPLETADA, 3=CANCELADA',
  `item_general_id` int DEFAULT NULL,
  `unidad_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Volcado de datos para la tabla `preparaciones`
--

INSERT INTO `preparaciones` (`id_preparaciones`, `fecha_creacion`, `fecha_inicio`, `fecha_fin`, `cantidad`, `observaciones`, `estado`, `item_general_id`, `unidad_id`) VALUES
(7, '2026-03-07 08:10:42', NULL, NULL, 20.00, NULL, 2, 1, 2),
(8, '2026-03-21 15:14:49', NULL, NULL, 1.00, NULL, 1, 1, 1),
(9, '2026-03-21 15:14:50', NULL, NULL, 9.00, NULL, 3, 1, 2),
(10, '2026-03-21 15:49:17', NULL, NULL, 1.00, NULL, 0, 1, 1),
(11, '2026-03-21 15:49:17', NULL, NULL, 45.00, NULL, 0, 1, 3),
(12, '2026-03-28 18:02:09', NULL, NULL, 2.00, NULL, 0, 1, 1),
(13, '2026-03-28 18:02:10', NULL, NULL, 10.00, NULL, 2, 1, 3),
(14, '2026-04-04 04:05:10', NULL, NULL, 2.00, NULL, 0, 1, 1),
(15, '2026-04-04 04:12:23', NULL, NULL, 200.00, NULL, 0, 1, 4),
(16, '2026-04-04 17:37:23', NULL, NULL, 100.00, NULL, 2, 1, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preparaciones_costos_indirectos`
--

CREATE TABLE `preparaciones_costos_indirectos` (
  `id` int NOT NULL,
  `preparaciones_id` int NOT NULL,
  `costos_indirectos_id` int DEFAULT NULL,
  `valor_aplicado` decimal(15,2) DEFAULT '0.00',
  `nombre` varchar(255) NOT NULL DEFAULT '',
  `categoria` varchar(100) NOT NULL DEFAULT 'otros'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `preparaciones_costos_indirectos`
--

INSERT INTO `preparaciones_costos_indirectos` (`id`, `preparaciones_id`, `costos_indirectos_id`, `valor_aplicado`, `nombre`, `categoria`) VALUES
(1, 14, NULL, 500000.00, 'Agua', 'servicios'),
(2, 15, NULL, 20000.00, 'Luz', 'servicios'),
(3, 16, NULL, 50000.00, 'Luz', 'servicios');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preparaciones_has_item_general`
--

CREATE TABLE `preparaciones_has_item_general` (
  `preparaciones_id_preparaciones` int NOT NULL,
  `item_general_id` int NOT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `porcentajes` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Volcado de datos para la tabla `preparaciones_has_item_general`
--

INSERT INTO `preparaciones_has_item_general` (`preparaciones_id_preparaciones`, `item_general_id`, `cantidad`, `porcentajes`) VALUES
(7, 31, 251.89, 74),
(7, 32, 1.01, 0),
(7, 33, 1.76, 1),
(7, 34, 2.77, 1),
(7, 35, 2.52, 1),
(7, 36, 81.35, 24),
(8, 31, 4.76, 9),
(8, 32, 0.56, 1),
(8, 33, 0.97, 2),
(8, 34, 1.52, 3),
(8, 35, 1.39, 3),
(8, 36, 44.74, 83),
(9, 31, 3.89, 9),
(9, 32, 0.45, 1),
(9, 33, 0.79, 2),
(9, 34, 1.25, 3),
(9, 35, 1.13, 3),
(9, 36, 36.61, 83),
(10, 31, 4.76, 9),
(10, 32, 0.56, 1),
(10, 33, 0.97, 2),
(10, 34, 1.52, 3),
(10, 35, 1.39, 3),
(10, 36, 44.74, 83),
(11, 31, 3.89, 9),
(11, 32, 0.45, 1),
(11, 33, 0.79, 2),
(11, 34, 1.25, 3),
(11, 35, 1.13, 3),
(11, 36, 36.61, 83),
(12, 31, 8.65, 9),
(12, 32, 1.01, 1),
(12, 33, 1.76, 2),
(12, 34, 2.77, 3),
(12, 35, 2.52, 3),
(12, 36, 81.35, 83),
(13, 31, 0.86, 9),
(13, 32, 0.10, 1),
(13, 33, 0.18, 2),
(13, 34, 0.28, 3),
(13, 35, 0.25, 3),
(13, 36, 8.14, 83),
(14, 31, 8.65, 9),
(14, 32, 1.01, 1),
(14, 33, 1.76, 2),
(14, 34, 2.77, 3),
(14, 35, 2.52, 3),
(14, 36, 81.35, 83),
(15, 31, 8.65, 9),
(15, 32, 1.01, 1),
(15, 33, 1.76, 2),
(15, 34, 2.77, 3),
(15, 35, 2.52, 3),
(15, 36, 81.35, 83),
(16, 31, 251.89, 74),
(16, 32, 1.01, 0),
(16, 33, 1.76, 1),
(16, 34, 2.77, 1),
(16, 35, 2.52, 1),
(16, 36, 81.35, 24);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preparacion_consumo_capas`
--

CREATE TABLE `preparacion_consumo_capas` (
  `id` int NOT NULL,
  `preparacion_id` int NOT NULL,
  `capa_id` int NOT NULL,
  `item_general_id` int NOT NULL,
  `cantidad_consumida` decimal(15,4) NOT NULL,
  `costo_unitario` decimal(15,4) NOT NULL,
  `costo_total` decimal(15,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `produccion_insumos_detalle`
--

CREATE TABLE `produccion_insumos_detalle` (
  `id` int NOT NULL,
  `preparacion_id` int NOT NULL,
  `item_general_id` int NOT NULL,
  `proveedor_id` int DEFAULT NULL,
  `bodega_id` int DEFAULT NULL,
  `cantidad` decimal(15,4) NOT NULL,
  `costo_unitario` decimal(15,4) NOT NULL,
  `subtotal` decimal(15,4) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor`
--

CREATE TABLE `proveedor` (
  `id_proveedor` int NOT NULL,
  `nombre_encargado` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nombre_empresa` varchar(27) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `numero_documento` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefono` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Volcado de datos para la tabla `proveedor`
--

INSERT INTO `proveedor` (`id_proveedor`, `nombre_encargado`, `nombre_empresa`, `numero_documento`, `direccion`, `telefono`, `email`) VALUES
(23, 'MARTHA PINO VILLA', 'COLARQUIM', '800226277-6', 'Cl. 110 #75A-620 Bodega 14, Riomar', '3135730324', 'servicioalclientebq@colarquim.com'),
(24, 'PMA', 'PMA', '1004914866', '', '', ''),
(25, 'LILIANA HERRERA', 'CONQUIMICA', '890919549', '', '3113676010', ''),
(26, 'Carlos Pérez', 'RECIEND', '1', '', '', ''),
(27, 'María Gómez', 'PROQUIMICOS', '1', '', '', ''),
(28, 'Carlos Rodríguez', 'PROCESOS Y DISOLVENTES', '1', '', '', ''),
(29, 'María Gómez', 'EVER POL', '1', '', '', ''),
(30, 'DIANA PEREZ', 'BRENTANG', '10001914855', '', '', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `remisiones`
--

CREATE TABLE `remisiones` (
  `id_remisiones` int UNSIGNED NOT NULL,
  `numero` varchar(20) NOT NULL,
  `cliente_id` int NOT NULL,
  `fecha_remision` date NOT NULL,
  `estado` enum('Pendiente','Facturada','Anulada') NOT NULL DEFAULT 'Pendiente',
  `direccion_entrega` varchar(255) DEFAULT NULL,
  `observaciones` text,
  `facturas_id` int DEFAULT NULL,
  `movimiento_inventario_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `remisiones`
--

INSERT INTO `remisiones` (`id_remisiones`, `numero`, `cliente_id`, `fecha_remision`, `estado`, `direccion_entrega`, `observaciones`, `facturas_id`, `movimiento_inventario_id`, `creado_en`) VALUES
(1, 'REM-2025-0001', 1, '2025-11-10', 'Facturada', 'Calle 45 #32-10, Barranquilla', 'Entrega materiales FAC-20', 1, 6, '2026-03-07 14:04:50'),
(2, 'REM-2025-0002', 2, '2025-01-12', 'Facturada', 'Carrera 21 #55-22, Cartagena', 'Entrega completa factura 89211291', 2, NULL, '2026-03-07 14:04:50'),
(3, 'REM-2025-0003', 1, '2025-03-15', 'Pendiente', 'Calle 45 #32-10, Barranquilla', 'Despacho pendiente de firma', NULL, NULL, '2026-03-07 14:04:50'),
(7, 'REM-2026-0003', 1, '2026-03-21', 'Pendiente', 'Calle 45 #32-10, Barranquilla', NULL, NULL, NULL, '2026-03-21 17:03:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `remisiones_detalle`
--

CREATE TABLE `remisiones_detalle` (
  `id_detalle` int UNSIGNED NOT NULL,
  `remisiones_id` int UNSIGNED NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `remisiones_detalle`
--

INSERT INTO `remisiones_detalle` (`id_detalle`, `remisiones_id`, `descripcion`, `cantidad`, `precio_unit`, `subtotal`) VALUES
(1, 1, 'Pintura base agua blanca 4L', 2.00, 85000.00, 170000.00),
(2, 1, 'Rodillos premium 9\"', 5.00, 8400.00, 42000.00),
(3, 2, 'Pintura esmalte negro mate 1L', 3.00, 52000.00, 156000.00),
(4, 2, 'Thinner acrílico 1/4', 4.00, 18000.00, 72000.00),
(5, 3, 'Pintura exterior mate 4L', 4.00, 92000.00, 368000.00),
(6, 7, 'BARNIZ TRANSPARENTE BRILLANTE', 1.00, 2000.00, 2000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `requisiciones_compra`
--

CREATE TABLE `requisiciones_compra` (
  `id_requisicion` int UNSIGNED NOT NULL,
  `preparacion_id` int UNSIGNED NOT NULL,
  `item_general_id` int UNSIGNED NOT NULL,
  `item_proveedor_id` int UNSIGNED DEFAULT NULL,
  `proveedor_id` int UNSIGNED DEFAULT NULL,
  `cantidad_necesaria` decimal(10,4) NOT NULL,
  `cantidad_disponible` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `cantidad_solicitada` decimal(10,4) NOT NULL,
  `precio_unitario` decimal(14,2) DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADA','CONVERTIDA','CANCELADA') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `orden_compra_id` int UNSIGNED DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tambores`
--

CREATE TABLE `tambores` (
  `id_tambor` int NOT NULL,
  `numero_tambor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `item_general_id` int NOT NULL,
  `bodegas_id` int NOT NULL,
  `cantidad_inicial` decimal(10,2) NOT NULL,
  `cantidad_actual` decimal(10,2) NOT NULL,
  `estado` tinyint DEFAULT '0' COMMENT '0=cerrado 1=abierto 2=vacío',
  `fecha_ingreso` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tambores`
--

INSERT INTO `tambores` (`id_tambor`, `numero_tambor`, `item_general_id`, `bodegas_id`, `cantidad_inicial`, `cantidad_actual`, `estado`, `fecha_ingreso`) VALUES
(1, '1', 134, 2, 50.00, 50.00, 0, '2026-04-17'),
(2, '2', 134, 2, 50.00, 50.00, 0, '2026-04-17'),
(3, '3', 135, 2, 50.00, 50.00, 0, '2026-04-17'),
(4, '4', 136, 2, 50.00, 50.00, 0, '2026-04-17'),
(5, '5', 137, 2, 50.00, 50.00, 0, '2026-04-17'),
(6, '6', 138, 2, 50.00, 50.00, 0, '2026-04-17'),
(7, '8', 139, 2, 50.00, 50.00, 0, '2026-04-17'),
(8, '9', 140, 2, 50.00, 50.00, 0, '2026-04-17'),
(9, '10', 141, 2, 50.00, 50.00, 0, '2026-04-17'),
(10, '10A', 194, 2, 10.00, 10.00, 0, '2026-04-17'),
(11, '10B', 194, 2, 10.00, 10.00, 0, '2026-04-17'),
(12, '10C', 194, 2, 10.00, 10.00, 0, '2026-04-17'),
(13, '10D', 194, 2, 10.00, 10.00, 0, '2026-04-17'),
(14, '10E', 194, 2, 10.00, 10.00, 0, '2026-04-17'),
(15, '10F', 194, 2, 10.00, 10.00, 0, '2026-04-17'),
(16, '11', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(17, '12', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(18, '13', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(19, '14', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(20, '15', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(21, '16', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(22, '17', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(23, '18', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(24, '19', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(25, '20', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(26, '21', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(27, '22', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(28, '23', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(29, '24', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(30, '25', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(31, '26', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(32, '27', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(33, '28', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(34, '29', 142, 2, 50.00, 50.00, 0, '2026-04-17'),
(35, '30', 143, 18, 50.00, 50.00, 0, '2026-04-17'),
(36, '30B', 143, 18, 50.00, 50.00, 0, '2026-04-17'),
(37, '31', 144, 18, 50.00, 50.00, 0, '2026-04-17'),
(38, '32', 145, 18, 50.00, 50.00, 0, '2026-04-17'),
(39, '33', 146, 18, 50.00, 50.00, 0, '2026-04-17'),
(40, '34', 147, 18, 50.00, 50.00, 0, '2026-04-17'),
(41, '35', 189, 18, 50.00, 50.00, 0, '2026-04-17'),
(42, '36', 148, 18, 50.00, 50.00, 0, '2026-04-17'),
(43, '37', 149, 18, 50.00, 50.00, 0, '2026-04-17'),
(44, '38', 150, 18, 50.00, 50.00, 0, '2026-04-17'),
(45, '39', 151, 18, 50.00, 50.00, 0, '2026-04-17'),
(46, '40', 152, 18, 50.00, 50.00, 0, '2026-04-17'),
(47, '41', 134, 18, 50.00, 50.00, 0, '2026-04-17'),
(48, '42', 134, 18, 50.00, 50.00, 0, '2026-04-17'),
(49, '43', 153, 18, 50.00, 50.00, 0, '2026-04-17'),
(50, '44', 154, 18, 50.00, 50.00, 0, '2026-04-17'),
(51, '46', 156, 18, 50.00, 50.00, 0, '2026-04-17'),
(52, '47', 158, 18, 50.00, 50.00, 0, '2026-04-17'),
(53, '48', 159, 18, 50.00, 50.00, 0, '2026-04-17'),
(54, '49', 190, 18, 50.00, 50.00, 0, '2026-04-17'),
(55, '52', 159, 18, 50.00, 50.00, 0, '2026-04-17'),
(56, '66', 174, 18, 50.00, 50.00, 0, '2026-04-17'),
(57, '78', 219, 18, 50.00, 50.00, 0, '2026-04-17'),
(58, '93', 163, 18, 50.00, 50.00, 0, '2026-04-17'),
(59, '93B', 163, 18, 50.00, 50.00, 0, '2026-04-17'),
(60, '93C', 163, 18, 50.00, 50.00, 0, '2026-04-17'),
(61, '93D', 163, 18, 50.00, 50.00, 0, '2026-04-17'),
(62, '116', 172, 18, 50.00, 50.00, 0, '2026-04-17'),
(63, '132', 167, 18, 50.00, 50.00, 0, '2026-04-17'),
(64, '139', 185, 18, 50.00, 50.00, 0, '2026-04-17'),
(65, '143', 183, 18, 50.00, 50.00, 0, '2026-04-17'),
(66, '150', 193, 18, 50.00, 50.00, 0, '2026-04-17'),
(67, '152', 162, 18, 50.00, 50.00, 0, '2026-04-17'),
(68, '154', 156, 18, 50.00, 50.00, 0, '2026-04-17'),
(69, '154B', 156, 18, 50.00, 50.00, 0, '2026-04-17'),
(70, '154C', 156, 18, 50.00, 50.00, 0, '2026-04-17'),
(71, '167', 162, 18, 50.00, 50.00, 0, '2026-04-17'),
(72, '177', 187, 18, 50.00, 50.00, 0, '2026-04-17'),
(73, '208', 170, 18, 50.00, 50.00, 0, '2026-04-17'),
(74, '215', 173, 18, 50.00, 50.00, 0, '2026-04-17'),
(75, '216', 136, 18, 50.00, 50.00, 0, '2026-04-17'),
(76, '217', 171, 18, 50.00, 50.00, 0, '2026-04-17'),
(77, '220', 171, 18, 50.00, 50.00, 0, '2026-04-17'),
(78, '221', 184, 18, 50.00, 50.00, 0, '2026-04-17'),
(79, '222', 184, 18, 50.00, 50.00, 0, '2026-04-17'),
(80, '223', 169, 18, 50.00, 50.00, 0, '2026-04-17'),
(81, '224', 158, 18, 50.00, 50.00, 0, '2026-04-17'),
(82, '225', 158, 18, 50.00, 50.00, 0, '2026-04-17'),
(83, '232', 168, 18, 50.00, 50.00, 0, '2026-04-17'),
(84, '233', 168, 18, 50.00, 50.00, 0, '2026-04-17'),
(85, '236', 175, 18, 50.00, 50.00, 0, '2026-04-17'),
(86, '238', 160, 18, 50.00, 50.00, 0, '2026-04-17'),
(87, '242', 179, 18, 50.00, 50.00, 0, '2026-04-17'),
(88, '47B', 155, 18, 50.00, 50.00, 0, '2026-04-17'),
(89, 'ETH-18-1', 161, 18, 50.00, 50.00, 0, '2026-04-17'),
(90, 'ETH-18-2', 161, 18, 50.00, 50.00, 0, '2026-04-17'),
(91, 'ETH-18-3', 161, 18, 50.00, 50.00, 0, '2026-04-17'),
(92, 'CES-18-1', 191, 18, 50.00, 50.00, 0, '2026-04-17'),
(93, 'NGN-18-1', 192, 18, 50.00, 50.00, 0, '2026-04-17'),
(94, 'PNC-18-1', 165, 18, 50.00, 50.00, 0, '2026-04-17'),
(95, 'XPS-18-1', 166, 18, 50.00, 50.00, 0, '2026-04-17'),
(96, '132B', 167, 18, 50.00, 50.00, 0, '2026-04-17'),
(97, '132C', 167, 18, 50.00, 50.00, 0, '2026-04-17'),
(98, '132D', 167, 18, 50.00, 50.00, 0, '2026-04-17'),
(99, '132E', 167, 18, 50.00, 50.00, 0, '2026-04-17'),
(100, '132F', 167, 18, 50.00, 50.00, 0, '2026-04-17'),
(101, '232B', 164, 18, 50.00, 50.00, 0, '2026-04-17'),
(102, '232C', 164, 18, 50.00, 50.00, 0, '2026-04-17'),
(103, '232D', 164, 18, 50.00, 50.00, 0, '2026-04-17'),
(104, '221C', 184, 18, 50.00, 50.00, 0, '2026-04-17'),
(105, 'ALC-18-1', 186, 18, 50.00, 50.00, 0, '2026-04-17'),
(106, 'ALC-18-2', 186, 18, 50.00, 50.00, 0, '2026-04-17'),
(107, 'BPU-18-1', 177, 18, 50.00, 50.00, 0, '2026-04-17'),
(108, 'BPU-18-2', 177, 18, 50.00, 50.00, 0, '2026-04-17'),
(109, 'VBG-18-1', 178, 18, 50.00, 50.00, 0, '2026-04-17'),
(110, 'VBG-18-2', 178, 18, 50.00, 50.00, 0, '2026-04-17'),
(111, 'RBL-18-1', 181, 18, 50.00, 50.00, 0, '2026-04-17'),
(112, 'RNJ-18-1', 182, 18, 50.00, 50.00, 0, '2026-04-17'),
(113, 'FRJ-18-1', 180, 18, 50.00, 50.00, 0, '2026-04-17'),
(114, '76', 162, 19, 50.00, 50.00, 0, '2026-04-17'),
(115, '77', 162, 19, 50.00, 50.00, 0, '2026-04-17'),
(116, '78M', 162, 19, 50.00, 50.00, 0, '2026-04-17'),
(117, '83', 162, 19, 50.00, 50.00, 0, '2026-04-17'),
(118, '81', 209, 19, 50.00, 50.00, 0, '2026-04-17'),
(119, '95', 210, 19, 50.00, 50.00, 0, '2026-04-17'),
(120, '95B', 210, 19, 50.00, 50.00, 0, '2026-04-17'),
(121, '95C', 210, 19, 50.00, 50.00, 0, '2026-04-17'),
(122, '95D', 210, 19, 50.00, 50.00, 0, '2026-04-17'),
(123, '95E', 210, 19, 50.00, 50.00, 0, '2026-04-17'),
(124, '95F', 210, 19, 50.00, 50.00, 0, '2026-04-17'),
(125, '98', 208, 19, 50.00, 50.00, 0, '2026-04-17'),
(126, '99', 208, 19, 50.00, 50.00, 0, '2026-04-17'),
(127, '100', 208, 19, 50.00, 50.00, 0, '2026-04-17'),
(128, '100B', 208, 19, 50.00, 50.00, 0, '2026-04-17'),
(129, '101', 197, 19, 50.00, 50.00, 0, '2026-04-17'),
(130, '105', 205, 19, 50.00, 50.00, 0, '2026-04-17'),
(131, '105B', 205, 19, 50.00, 50.00, 0, '2026-04-17'),
(132, '105C', 205, 19, 50.00, 50.00, 0, '2026-04-17'),
(133, '105D', 205, 19, 50.00, 50.00, 0, '2026-04-17'),
(134, '108', 198, 19, 50.00, 50.00, 0, '2026-04-17'),
(135, '114', 200, 19, 50.00, 50.00, 0, '2026-04-17'),
(136, '115', 172, 19, 50.00, 50.00, 0, '2026-04-17'),
(137, '124', 172, 19, 50.00, 50.00, 0, '2026-04-17'),
(138, '128', 202, 19, 50.00, 50.00, 0, '2026-04-17'),
(139, '129', 199, 19, 50.00, 50.00, 0, '2026-04-17'),
(140, '132M', 167, 19, 50.00, 50.00, 0, '2026-04-17'),
(141, '135', 203, 19, 50.00, 50.00, 0, '2026-04-17'),
(142, '136', 203, 19, 50.00, 50.00, 0, '2026-04-17'),
(143, '136B', 203, 19, 50.00, 50.00, 0, '2026-04-17'),
(144, '137', 206, 19, 50.00, 50.00, 0, '2026-04-17'),
(145, '137B', 206, 19, 50.00, 50.00, 0, '2026-04-17'),
(146, '137C', 206, 19, 50.00, 50.00, 0, '2026-04-17'),
(147, '137D', 206, 19, 50.00, 50.00, 0, '2026-04-17'),
(148, '141', 171, 19, 50.00, 50.00, 0, '2026-04-17'),
(149, '149', 150, 19, 50.00, 50.00, 0, '2026-04-17'),
(150, 'ABR-19-1', 207, 19, 50.00, 50.00, 0, '2026-04-17'),
(151, 'ABR-19-2', 207, 19, 50.00, 50.00, 0, '2026-04-17'),
(152, 'ABR-19-3', 207, 19, 50.00, 50.00, 0, '2026-04-17'),
(153, 'CAT-19-1', 211, 19, 50.00, 50.00, 0, '2026-04-17'),
(154, 'EPX-19-1', 195, 19, 50.00, 50.00, 0, '2026-04-17'),
(155, 'PAG-19-1', 196, 19, 50.00, 50.00, 0, '2026-04-17'),
(156, 'PAG-19-2', 196, 19, 50.00, 50.00, 0, '2026-04-17'),
(157, 'SPH-19-1', 201, 19, 50.00, 50.00, 0, '2026-04-17'),
(158, 'TAS-19-1', 213, 19, 50.00, 50.00, 0, '2026-04-17'),
(159, 'VPC-19-1', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(160, 'VPC-19-2', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(161, 'VPC-19-3', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(162, 'VPC-19-4', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(163, 'VPC-19-5', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(164, 'VPC-19-6', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(165, 'VPC-19-7', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(166, 'VPC-19-8', 212, 19, 50.00, 50.00, 0, '2026-04-17'),
(167, 'ETH-P-01', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(168, 'ETH-P-02', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(169, 'ETH-P-03', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(170, 'ETH-P-04', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(171, 'ETH-P-05', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(172, 'ETH-P-06', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(173, 'ETH-P-07', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(174, 'ETH-P-08', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(175, 'ETH-P-09', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(176, 'ETH-P-10', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(177, 'ETH-P-11', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(178, 'ETH-P-12', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(179, 'ETH-P-13', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(180, 'ETH-P-14', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(181, 'ETH-P-15', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(182, 'ETH-P-16', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(183, 'ETH-P-17', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(184, 'ETH-P-18', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(185, 'ETH-P-19', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(186, 'ETH-P-20', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(187, 'ETH-P-21', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(188, 'ETH-P-22', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(189, 'ETH-P-23', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(190, 'ETH-P-24', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(191, 'ETH-P-25', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(192, 'ETH-P-26', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(193, 'ETH-P-27', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(194, 'ETH-P-28', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(195, 'ETH-P-29', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(196, 'ETH-P-30', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(197, 'ETH-P-31', 161, 21, 50.00, 50.00, 0, '2026-04-17'),
(198, '49', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(199, '186', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(200, '183', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(201, '169P', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(202, 'SKP-P-5', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(203, 'SKP-P-6', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(204, 'SKP-P-7', 214, 21, 50.00, 50.00, 0, '2026-04-17'),
(205, 'SKF-P-1', 215, 21, 50.00, 50.00, 0, '2026-04-17'),
(206, 'SKF-P-2', 215, 21, 50.00, 50.00, 0, '2026-04-17'),
(207, 'SKF-P-3', 215, 21, 50.00, 50.00, 0, '2026-04-17'),
(208, 'SKF-P-4', 215, 21, 50.00, 50.00, 0, '2026-04-17'),
(209, 'SKM-P-1', 216, 21, 50.00, 50.00, 0, '2026-04-17'),
(210, 'SKT-P-1', 217, 21, 50.00, 50.00, 0, '2026-04-17'),
(211, 'SKT-P-2', 217, 21, 50.00, 50.00, 0, '2026-04-17'),
(212, 'SKT-P-3', 217, 21, 50.00, 50.00, 0, '2026-04-17'),
(213, 'SKT-P-4', 217, 21, 50.00, 50.00, 0, '2026-04-17'),
(214, '6', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(215, '7', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(216, 'SLA-P-3', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(217, 'SLA-P-4', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(218, 'SLA-P-5', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(219, 'SLA-P-6', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(220, 'SLA-P-7', 137, 21, 50.00, 50.00, 0, '2026-04-17'),
(221, '199', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(222, '97', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(223, '262', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(224, 'FRJ-P-10', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(225, 'FRJ-P-9', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(226, 'FRJ-P-8', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(227, 'FRJ-P-7', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(228, 'FRJ-P-6', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(229, 'FRJ-P-5', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(230, 'FRJ-P-4', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(231, 'FRJ-P-3', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(232, 'FRJ-P-2', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(233, 'FRJ-P-1', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(234, 'FRJ-P-20', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(235, 'FRJ-P-19', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(236, 'FRJ-P-18', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(237, 'FRJ-P-17', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(238, 'FRJ-P-16', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(239, 'FRJ-P-15', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(240, 'FRJ-P-14', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(241, 'FRJ-P-13', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(242, 'FRJ-P-12', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(243, 'FRJ-P-11', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(244, 'FRJ-P-30', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(245, 'FRJ-P-29', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(246, 'FRJ-P-28', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(247, 'FRJ-P-27', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(248, 'FRJ-P-26', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(249, 'FRJ-P-25', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(250, 'FRJ-P-24', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(251, 'FRJ-P-23', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(252, 'FRJ-P-22', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(253, 'FRJ-P-21', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(254, 'FRJ-P-40', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(255, 'FRJ-P-39', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(256, 'FRJ-P-38', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(257, 'FRJ-P-37', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(258, 'FRJ-P-36', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(259, 'FRJ-P-35', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(260, 'FRJ-P-34', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(261, 'FRJ-P-33', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(262, 'FRJ-P-32', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(263, 'FRJ-P-31', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(264, 'FRJ-P-50', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(265, 'FRJ-P-49', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(266, 'FRJ-P-48', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(267, 'FRJ-P-47', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(268, 'FRJ-P-46', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(269, 'FRJ-P-45', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(270, 'FRJ-P-44', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(271, 'FRJ-P-43', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(272, 'FRJ-P-42', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(273, 'FRJ-P-41', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(274, 'FRJ-P-60', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(275, 'FRJ-P-59', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(276, 'FRJ-P-58', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(277, 'FRJ-P-57', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(278, 'FRJ-P-56', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(279, 'FRJ-P-55', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(280, 'FRJ-P-54', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(281, 'FRJ-P-53', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(282, 'FRJ-P-52', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(283, 'FRJ-P-51', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(284, 'FRJ-P-70', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(285, 'FRJ-P-69', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(286, 'FRJ-P-68', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(287, 'FRJ-P-67', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(288, 'FRJ-P-66', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(289, 'FRJ-P-65', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(290, 'FRJ-P-64', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(291, 'FRJ-P-63', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(292, 'FRJ-P-62', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(293, 'FRJ-P-61', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(294, 'FRJ-P-80', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(295, 'FRJ-P-79', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(296, 'FRJ-P-78', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(297, 'FRJ-P-77', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(298, 'FRJ-P-76', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(299, 'FRJ-P-75', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(300, 'FRJ-P-74', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(301, 'FRJ-P-73', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(302, 'FRJ-P-72', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(303, 'FRJ-P-71', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(304, 'FRJ-P-90', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(305, 'FRJ-P-89', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(306, 'FRJ-P-88', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(307, 'FRJ-P-87', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(308, 'FRJ-P-86', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(309, 'FRJ-P-85', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(310, 'FRJ-P-84', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(311, 'FRJ-P-83', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(312, 'FRJ-P-82', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(313, 'FRJ-P-81', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(314, 'FRJ-P-100', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(315, 'FRJ-P-99', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(316, 'FRJ-P-98', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(317, 'FRJ-P-97', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(318, 'FRJ-P-96', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(319, 'FRJ-P-95', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(320, 'FRJ-P-94', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(321, 'FRJ-P-93', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(322, 'FRJ-P-92', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(323, 'FRJ-P-91', 180, 21, 50.00, 50.00, 0, '2026-04-17'),
(351, 'MCH-P-1', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(352, 'MCH-P-2', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(353, 'MCH-P-3', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(354, 'MCH-P-4', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(355, 'MCH-P-5', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(356, 'MCH-P-6', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(357, 'MCH-P-7', 218, 21, 50.00, 50.00, 0, '2026-04-17'),
(358, 'SPL-P-1', 219, 21, 50.00, 50.00, 0, '2026-04-17'),
(359, 'SPL-P-2', 219, 21, 50.00, 50.00, 0, '2026-04-17'),
(360, 'LAC-P-1', 220, 21, 50.00, 50.00, 0, '2026-04-17'),
(361, 'SVB-P-1', 221, 21, 50.00, 50.00, 0, '2026-04-17'),
(362, 'NHS-P-1', 222, 21, 50.00, 50.00, 0, '2026-04-17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tambor_movimientos`
--

CREATE TABLE `tambor_movimientos` (
  `id_tambor_movimiento` int NOT NULL,
  `tambor_id` int NOT NULL,
  `tipo` tinyint DEFAULT NULL COMMENT '1=entrada 2=salida',
  `cantidad` decimal(10,2) DEFAULT NULL,
  `referencia_tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `fecha` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidad`
--

CREATE TABLE `unidad` (
  `id_unidad` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `estados` tinyint DEFAULT NULL,
  `escala` decimal(10,5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Volcado de datos para la tabla `unidad`
--

INSERT INTO `unidad` (`id_unidad`, `nombre`, `descripcion`, `estados`, `escala`) VALUES
(1, 'TAMBOR', '', 1, 50.00000),
(2, 'CUÑETE', '', 1, 5.00000),
(3, 'GALON', '', 1, 1.00000),
(4, '1/2 GALON', '', 1, 0.50000),
(5, '1/4 GALON', '', 1, 0.25000),
(6, '1/8 GALON', '', 1, 0.12500),
(7, '1/16 GALON', '', 1, 0.06250),
(8, '1/32 GALON', '', 1, 0.03125),
(9, 'KILO', '', 1, 1.00000),
(10, 'GRAMO', '', 1, 0.00100),
(11, 'LIBRA', '', 1, 0.45300),
(12, 'LITRO', '', 1, 0.26417),
(13, 'UNIDAD', NULL, NULL, 1.00000),
(14, 'CAJA', NULL, NULL, 1.00000),
(15, 'BULTO', NULL, NULL, 1.00000),
(16, 'CANECA', NULL, NULL, 1.00000);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuarios` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuarios`, `username`, `password`) VALUES
(2, 'root', '$2y$10$zcSxsrQHkHFxPddPk/.TFeeFceYqtUeb3wtlLSxfnDG4Ll5dL1Szu');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bodegas`
--
ALTER TABLE `bodegas`
  ADD PRIMARY KEY (`id_bodegas`),
  ADD KEY `fk_bodegas_instalaciones1_idx` (`instalaciones_id`);

--
-- Indices de la tabla `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_clientes`);

--
-- Indices de la tabla `costos_indirectos`
--
ALTER TABLE `costos_indirectos`
  ADD PRIMARY KEY (`id_costos_indirectos`);

--
-- Indices de la tabla `costos_item`
--
ALTER TABLE `costos_item`
  ADD PRIMARY KEY (`id_costos_item`),
  ADD KEY `item_general_id` (`item_general_id`);

--
-- Indices de la tabla `costos_produccion`
--
ALTER TABLE `costos_produccion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `fk_costos_produccion_preparaciones1_idx` (`preparaciones_id`);

--
-- Indices de la tabla `cotizaciones`
--
ALTER TABLE `cotizaciones`
  ADD PRIMARY KEY (`id_cotizaciones`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `facturas_id` (`facturas_id`);

--
-- Indices de la tabla `cotizaciones_detalle`
--
ALTER TABLE `cotizaciones_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `cotizaciones_id` (`cotizaciones_id`);

--
-- Indices de la tabla `detalle_facturas`
--
ALTER TABLE `detalle_facturas`
  ADD PRIMARY KEY (`id_detalle_facturas`),
  ADD UNIQUE KEY `id_detalle_facturas_UNIQUE` (`id_detalle_facturas`),
  ADD KEY `fk_detalle_facturas_facturas1_idx` (`facturas_id`),
  ADD KEY `fk_detalle_facturas_item_general1_idx` (`item_general_id`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id_empresa`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id_facturas`),
  ADD UNIQUE KEY `id_facturas_UNIQUE` (`id_facturas`),
  ADD KEY `fk_facturas_movimientos_inventario1_idx` (`movimiento_inventario_id`);

--
-- Indices de la tabla `facturas_detalle`
--
ALTER TABLE `facturas_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `facturas_id` (`facturas_id`);

--
-- Indices de la tabla `formulaciones`
--
ALTER TABLE `formulaciones`
  ADD PRIMARY KEY (`id_formulaciones`),
  ADD UNIQUE KEY `id_formulaciones_UNIQUE` (`id_formulaciones`),
  ADD KEY `fk_formulaciones_item_general1_idx` (`item_general_id`);

--
-- Indices de la tabla `gestiones_cobro`
--
ALTER TABLE `gestiones_cobro`
  ADD PRIMARY KEY (`id_gestion`),
  ADD KEY `fk_gestiones_factura` (`facturas_id`),
  ADD KEY `fk_gestiones_cliente` (`clientes_id`),
  ADD KEY `fk_gestiones_usuario` (`usuario_id`);

--
-- Indices de la tabla `historial_precios`
--
ALTER TABLE `historial_precios`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `item_proveedor_id` (`item_proveedor_id`);

--
-- Indices de la tabla `instalaciones`
--
ALTER TABLE `instalaciones`
  ADD PRIMARY KEY (`id_instalaciones`),
  ADD KEY `fk_instalaciones_empresa_idx` (`id_empresa`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id_inventario`),
  ADD KEY `fk_inventario_item_general1_idx` (`item_general_id`),
  ADD KEY `fk_inventario_movimientos_inventario1_idx` (`movimiento_inventario_id`),
  ADD KEY `fk_inventario_bodega` (`bodegas_id`);

--
-- Indices de la tabla `inventario_capas`
--
ALTER TABLE `inventario_capas`
  ADD PRIMARY KEY (`id_capa`),
  ADD KEY `idx_item_bodega` (`item_general_id`,`bodegas_id`,`estado`),
  ADD KEY `idx_proveedor` (`proveedor_id`),
  ADD KEY `idx_fecha` (`fecha_ingreso`),
  ADD KEY `bodegas_id` (`bodegas_id`);

--
-- Indices de la tabla `item_general`
--
ALTER TABLE `item_general`
  ADD PRIMARY KEY (`id_item_general`),
  ADD UNIQUE KEY `id_item_general_UNIQUE` (`id_item_general`),
  ADD KEY `fk_item_general_categoria1_idx` (`categoria_id`),
  ADD KEY `fk_item_general_unidad_id_idx` (`unidad_id`),
  ADD KEY `fk_item_almacenaje` (`unidad_almacenaje_id`);

--
-- Indices de la tabla `item_general_formulaciones`
--
ALTER TABLE `item_general_formulaciones`
  ADD PRIMARY KEY (`id_item_general_formulaciones`),
  ADD KEY `fk_item_especifico_has_formulaciones_formulaciones1_idx` (`formulaciones_id`),
  ADD KEY `fk_item_especifico_formulaciones_item_general1_idx` (`item_general_id`);

--
-- Indices de la tabla `item_proveedor`
--
ALTER TABLE `item_proveedor`
  ADD PRIMARY KEY (`id_item_proveedor`),
  ADD UNIQUE KEY `id_item_proveedor_UNIQUE` (`id_item_proveedor`),
  ADD KEY `fk_item_proveedor_proveedores1_idx` (`proveedor_id`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `movimiento_inventario`
--
ALTER TABLE `movimiento_inventario`
  ADD PRIMARY KEY (`id_movimiento_inventario`),
  ADD UNIQUE KEY `id_movimiento_inventario_UNIQUE` (`id_movimiento_inventario`),
  ADD KEY `fk_movimiento_item` (`item_general_id`),
  ADD KEY `fk_movimiento_bodega` (`bodega_id`);

--
-- Indices de la tabla `notas_credito`
--
ALTER TABLE `notas_credito`
  ADD PRIMARY KEY (`id_nota_credito`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `fk_notas_factura` (`facturas_id`),
  ADD KEY `fk_notas_cliente` (`clientes_id`),
  ADD KEY `fk_notas_usuario` (`usuario_id`);

--
-- Indices de la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  ADD PRIMARY KEY (`id_orden`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `proveedor_id` (`proveedor_id`),
  ADD KEY `bodegas_id` (`bodegas_id`);

--
-- Indices de la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `ordenes_compra_id` (`ordenes_compra_id`),
  ADD KEY `item_proveedor_id` (`item_proveedor_id`);

--
-- Indices de la tabla `pagos_cliente`
--
ALTER TABLE `pagos_cliente`
  ADD PRIMARY KEY (`id_pagos_cliente`),
  ADD UNIQUE KEY `id_pagos_cliente_UNIQUE` (`id_pagos_cliente`),
  ADD KEY `fk_pagos_cliente_clientes1_idx` (`clientes_id`),
  ADD KEY `fk_pagos_cliente_facturas1_idx` (`facturas_id`),
  ADD KEY `fk_pagos_usuario` (`usuario_id`);

--
-- Indices de la tabla `preparaciones`
--
ALTER TABLE `preparaciones`
  ADD PRIMARY KEY (`id_preparaciones`),
  ADD KEY `fk_preparaciones_item_general1_idx` (`item_general_id`),
  ADD KEY `fk_preparaciones_unidad1_idx` (`unidad_id`);

--
-- Indices de la tabla `preparaciones_costos_indirectos`
--
ALTER TABLE `preparaciones_costos_indirectos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `preparaciones_id` (`preparaciones_id`),
  ADD KEY `costos_indirectos_id` (`costos_indirectos_id`);

--
-- Indices de la tabla `preparaciones_has_item_general`
--
ALTER TABLE `preparaciones_has_item_general`
  ADD PRIMARY KEY (`preparaciones_id_preparaciones`,`item_general_id`),
  ADD KEY `fk_preparaciones_has_item_general_item_general1_idx` (`item_general_id`),
  ADD KEY `fk_preparaciones_has_item_general_preparaciones1_idx` (`preparaciones_id_preparaciones`);

--
-- Indices de la tabla `preparacion_consumo_capas`
--
ALTER TABLE `preparacion_consumo_capas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_preparacion` (`preparacion_id`),
  ADD KEY `idx_capa` (`capa_id`);

--
-- Indices de la tabla `produccion_insumos_detalle`
--
ALTER TABLE `produccion_insumos_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pid_insumos` (`preparacion_id`),
  ADD KEY `idx_item_insumos` (`item_general_id`),
  ADD KEY `idx_prov_insumos` (`proveedor_id`);

--
-- Indices de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  ADD PRIMARY KEY (`id_proveedor`),
  ADD UNIQUE KEY `id_proveedor_UNIQUE` (`id_proveedor`);

--
-- Indices de la tabla `remisiones`
--
ALTER TABLE `remisiones`
  ADD PRIMARY KEY (`id_remisiones`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `facturas_id` (`facturas_id`),
  ADD KEY `movimiento_inventario_id` (`movimiento_inventario_id`);

--
-- Indices de la tabla `remisiones_detalle`
--
ALTER TABLE `remisiones_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `remisiones_id` (`remisiones_id`);

--
-- Indices de la tabla `requisiciones_compra`
--
ALTER TABLE `requisiciones_compra`
  ADD PRIMARY KEY (`id_requisicion`),
  ADD KEY `preparacion_id` (`preparacion_id`),
  ADD KEY `estado` (`estado`);

--
-- Indices de la tabla `tambores`
--
ALTER TABLE `tambores`
  ADD PRIMARY KEY (`id_tambor`),
  ADD KEY `fk_tambores_item` (`item_general_id`),
  ADD KEY `fk_tambores_bodega` (`bodegas_id`);

--
-- Indices de la tabla `tambor_movimientos`
--
ALTER TABLE `tambor_movimientos`
  ADD PRIMARY KEY (`id_tambor_movimiento`),
  ADD KEY `fk_tambor_mov_tambor` (`tambor_id`);

--
-- Indices de la tabla `unidad`
--
ALTER TABLE `unidad`
  ADD PRIMARY KEY (`id_unidad`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuarios`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bodegas`
--
ALTER TABLE `bodegas`
  MODIFY `id_bodegas` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `categoria`
--
ALTER TABLE `categoria`
  MODIFY `id_categoria` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_clientes` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `costos_indirectos`
--
ALTER TABLE `costos_indirectos`
  MODIFY `id_costos_indirectos` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `costos_item`
--
ALTER TABLE `costos_item`
  MODIFY `id_costos_item` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=178;

--
-- AUTO_INCREMENT de la tabla `costos_produccion`
--
ALTER TABLE `costos_produccion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cotizaciones`
--
ALTER TABLE `cotizaciones`
  MODIFY `id_cotizaciones` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `cotizaciones_detalle`
--
ALTER TABLE `cotizaciones_detalle`
  MODIFY `id_detalle` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `detalle_facturas`
--
ALTER TABLE `detalle_facturas`
  MODIFY `id_detalle_facturas` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id_facturas` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `facturas_detalle`
--
ALTER TABLE `facturas_detalle`
  MODIFY `id_detalle` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `formulaciones`
--
ALTER TABLE `formulaciones`
  MODIFY `id_formulaciones` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de la tabla `gestiones_cobro`
--
ALTER TABLE `gestiones_cobro`
  MODIFY `id_gestion` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `historial_precios`
--
ALTER TABLE `historial_precios`
  MODIFY `id_historial` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `instalaciones`
--
ALTER TABLE `instalaciones`
  MODIFY `id_instalaciones` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id_inventario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=275;

--
-- AUTO_INCREMENT de la tabla `inventario_capas`
--
ALTER TABLE `inventario_capas`
  MODIFY `id_capa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT de la tabla `item_general`
--
ALTER TABLE `item_general`
  MODIFY `id_item_general` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT de la tabla `item_general_formulaciones`
--
ALTER TABLE `item_general_formulaciones`
  MODIFY `id_item_general_formulaciones` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=385;

--
-- AUTO_INCREMENT de la tabla `item_proveedor`
--
ALTER TABLE `item_proveedor`
  MODIFY `id_item_proveedor` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `movimiento_inventario`
--
ALTER TABLE `movimiento_inventario`
  MODIFY `id_movimiento_inventario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `notas_credito`
--
ALTER TABLE `notas_credito`
  MODIFY `id_nota_credito` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  MODIFY `id_orden` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  MODIFY `id_detalle` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `pagos_cliente`
--
ALTER TABLE `pagos_cliente`
  MODIFY `id_pagos_cliente` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `preparaciones`
--
ALTER TABLE `preparaciones`
  MODIFY `id_preparaciones` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `preparaciones_costos_indirectos`
--
ALTER TABLE `preparaciones_costos_indirectos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `preparacion_consumo_capas`
--
ALTER TABLE `preparacion_consumo_capas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `produccion_insumos_detalle`
--
ALTER TABLE `produccion_insumos_detalle`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  MODIFY `id_proveedor` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `remisiones`
--
ALTER TABLE `remisiones`
  MODIFY `id_remisiones` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `remisiones_detalle`
--
ALTER TABLE `remisiones_detalle`
  MODIFY `id_detalle` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `requisiciones_compra`
--
ALTER TABLE `requisiciones_compra`
  MODIFY `id_requisicion` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tambores`
--
ALTER TABLE `tambores`
  MODIFY `id_tambor` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=363;

--
-- AUTO_INCREMENT de la tabla `tambor_movimientos`
--
ALTER TABLE `tambor_movimientos`
  MODIFY `id_tambor_movimiento` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `unidad`
--
ALTER TABLE `unidad`
  MODIFY `id_unidad` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuarios` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bodegas`
--
ALTER TABLE `bodegas`
  ADD CONSTRAINT `fk_bodegas_instalaciones1` FOREIGN KEY (`instalaciones_id`) REFERENCES `instalaciones` (`id_instalaciones`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `costos_item`
--
ALTER TABLE `costos_item`
  ADD CONSTRAINT `costos_item_ibfk_1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `costos_produccion`
--
ALTER TABLE `costos_produccion`
  ADD CONSTRAINT `fk_costos_produccion_preparaciones` FOREIGN KEY (`preparaciones_id`) REFERENCES `preparaciones` (`id_preparaciones`);

--
-- Filtros para la tabla `cotizaciones`
--
ALTER TABLE `cotizaciones`
  ADD CONSTRAINT `cotizaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_clientes`),
  ADD CONSTRAINT `cotizaciones_ibfk_2` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`);

--
-- Filtros para la tabla `cotizaciones_detalle`
--
ALTER TABLE `cotizaciones_detalle`
  ADD CONSTRAINT `cotizaciones_detalle_ibfk_1` FOREIGN KEY (`cotizaciones_id`) REFERENCES `cotizaciones` (`id_cotizaciones`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalle_facturas`
--
ALTER TABLE `detalle_facturas`
  ADD CONSTRAINT `fk_detalle_facturas_facturas1` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`),
  ADD CONSTRAINT `fk_detalle_facturas_item_general1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`);

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `fk_facturas_movimientos_inventario1` FOREIGN KEY (`movimiento_inventario_id`) REFERENCES `movimiento_inventario` (`id_movimiento_inventario`);

--
-- Filtros para la tabla `facturas_detalle`
--
ALTER TABLE `facturas_detalle`
  ADD CONSTRAINT `facturas_detalle_ibfk_1` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`) ON DELETE CASCADE;

--
-- Filtros para la tabla `formulaciones`
--
ALTER TABLE `formulaciones`
  ADD CONSTRAINT `fk_formulaciones_item_general1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Filtros para la tabla `gestiones_cobro`
--
ALTER TABLE `gestiones_cobro`
  ADD CONSTRAINT `fk_gestiones_cliente` FOREIGN KEY (`clientes_id`) REFERENCES `clientes` (`id_clientes`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_gestiones_factura` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_gestiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE SET NULL;

--
-- Filtros para la tabla `historial_precios`
--
ALTER TABLE `historial_precios`
  ADD CONSTRAINT `historial_precios_ibfk_1` FOREIGN KEY (`item_proveedor_id`) REFERENCES `item_proveedor` (`id_item_proveedor`);

--
-- Filtros para la tabla `instalaciones`
--
ALTER TABLE `instalaciones`
  ADD CONSTRAINT `fk_instalaciones_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `fk_inventario_bodega` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`),
  ADD CONSTRAINT `fk_inventario_item_general1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_inventario_movimientos_inventario1` FOREIGN KEY (`movimiento_inventario_id`) REFERENCES `movimiento_inventario` (`id_movimiento_inventario`);

--
-- Filtros para la tabla `inventario_capas`
--
ALTER TABLE `inventario_capas`
  ADD CONSTRAINT `inventario_capas_ibfk_1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`),
  ADD CONSTRAINT `inventario_capas_ibfk_2` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`),
  ADD CONSTRAINT `inventario_capas_ibfk_3` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id_proveedor`);

--
-- Filtros para la tabla `item_general`
--
ALTER TABLE `item_general`
  ADD CONSTRAINT `fk_item_almacenaje` FOREIGN KEY (`unidad_almacenaje_id`) REFERENCES `unidad` (`id_unidad`);

--
-- Filtros para la tabla `movimiento_inventario`
--
ALTER TABLE `movimiento_inventario`
  ADD CONSTRAINT `fk_movimiento_bodega` FOREIGN KEY (`bodega_id`) REFERENCES `bodegas` (`id_bodegas`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_movimiento_item` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `notas_credito`
--
ALTER TABLE `notas_credito`
  ADD CONSTRAINT `fk_notas_cliente` FOREIGN KEY (`clientes_id`) REFERENCES `clientes` (`id_clientes`),
  ADD CONSTRAINT `fk_notas_factura` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`),
  ADD CONSTRAINT `fk_notas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE SET NULL;

--
-- Filtros para la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  ADD CONSTRAINT `ordenes_compra_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id_proveedor`),
  ADD CONSTRAINT `ordenes_compra_ibfk_2` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`);

--
-- Filtros para la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  ADD CONSTRAINT `ordenes_compra_detalle_ibfk_1` FOREIGN KEY (`ordenes_compra_id`) REFERENCES `ordenes_compra` (`id_orden`) ON DELETE CASCADE,
  ADD CONSTRAINT `ordenes_compra_detalle_ibfk_2` FOREIGN KEY (`item_proveedor_id`) REFERENCES `item_proveedor` (`id_item_proveedor`);

--
-- Filtros para la tabla `pagos_cliente`
--
ALTER TABLE `pagos_cliente`
  ADD CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`);

--
-- Filtros para la tabla `preparaciones_costos_indirectos`
--
ALTER TABLE `preparaciones_costos_indirectos`
  ADD CONSTRAINT `preparaciones_costos_indirectos_ibfk_1` FOREIGN KEY (`preparaciones_id`) REFERENCES `preparaciones` (`id_preparaciones`),
  ADD CONSTRAINT `preparaciones_costos_indirectos_ibfk_2` FOREIGN KEY (`costos_indirectos_id`) REFERENCES `costos_indirectos` (`id_costos_indirectos`);

--
-- Filtros para la tabla `preparacion_consumo_capas`
--
ALTER TABLE `preparacion_consumo_capas`
  ADD CONSTRAINT `preparacion_consumo_capas_ibfk_1` FOREIGN KEY (`preparacion_id`) REFERENCES `preparaciones` (`id_preparaciones`),
  ADD CONSTRAINT `preparacion_consumo_capas_ibfk_2` FOREIGN KEY (`capa_id`) REFERENCES `inventario_capas` (`id_capa`);

--
-- Filtros para la tabla `produccion_insumos_detalle`
--
ALTER TABLE `produccion_insumos_detalle`
  ADD CONSTRAINT `produccion_insumos_detalle_item_general_id_foreign` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`),
  ADD CONSTRAINT `produccion_insumos_detalle_preparacion_id_foreign` FOREIGN KEY (`preparacion_id`) REFERENCES `preparaciones` (`id_preparaciones`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `remisiones`
--
ALTER TABLE `remisiones`
  ADD CONSTRAINT `remisiones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_clientes`),
  ADD CONSTRAINT `remisiones_ibfk_2` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`),
  ADD CONSTRAINT `remisiones_ibfk_3` FOREIGN KEY (`movimiento_inventario_id`) REFERENCES `movimiento_inventario` (`id_movimiento_inventario`);

--
-- Filtros para la tabla `remisiones_detalle`
--
ALTER TABLE `remisiones_detalle`
  ADD CONSTRAINT `remisiones_detalle_ibfk_1` FOREIGN KEY (`remisiones_id`) REFERENCES `remisiones` (`id_remisiones`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tambores`
--
ALTER TABLE `tambores`
  ADD CONSTRAINT `fk_tambores_bodega` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_tambores_item` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tambor_movimientos`
--
ALTER TABLE `tambor_movimientos`
  ADD CONSTRAINT `fk_tambor_mov_tambor` FOREIGN KEY (`tambor_id`) REFERENCES `tambores` (`id_tambor`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
