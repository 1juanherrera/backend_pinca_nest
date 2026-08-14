-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: gestorpincadb
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bodegas`
--

DROP TABLE IF EXISTS `bodegas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bodegas` (
  `id_bodegas` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `estado` tinyint DEFAULT NULL COMMENT '0 inactiva 1 activa',
  `instalaciones_id` int NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_bodegas`),
  KEY `fk_bodegas_instalaciones1_idx` (`instalaciones_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_bodegas_instalaciones1` FOREIGN KEY (`instalaciones_id`) REFERENCES `instalaciones` (`id_instalaciones`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bodegas`
--

LOCK TABLES `bodegas` WRITE;
/*!40000 ALTER TABLE `bodegas` DISABLE KEYS */;
INSERT INTO `bodegas` VALUES (1,'Bodega principal','BODEGA INSUMOS, MATERIAS PRIMAS Y PRODUCTOS',1,1,NULL),(2,'Bodega 1','Aditivos técnicos, impermeabilizantes de alto desempeño y maquinaria pesada.',1,2,NULL),(3,'Juan Mina','Punto estratégico en la Vía Cordialidad, orientado al manejo de inventarios y distribución regional, con conexiones hacia rutas intermunicipales.',1,3,NULL),(8,'Laboratorio','Área de bodega con acondicionamiento tipo laboratorio',1,1,NULL),(15,'Centro de insumos','Área destinada al almacenamiento y distribución de insumos.',1,1,NULL),(16,'Depósito especializado','Espacio seguro para almacenamiento bajo condiciones controladas.',0,1,NULL),(18,'Bodega 2','Resinas base, solventes y una amplia gama de pinturas para acabados horneables.',1,2,NULL),(19,'Bodega 3','Estación de colorimetría con pastas pigmentadas, anticorrosivos y productos listos para despacho.',1,2,NULL),(21,'Patio','Almacenamiento masivo de solventes industriales, aglutinantes y selladores por volumen.',1,2,NULL);
/*!40000 ALTER TABLE `bodegas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'ESMALTE',NULL),(2,'PASTA',NULL),(3,'ANTICORROSIVO',NULL),(4,'BARNIZ',NULL),(5,'VINILO',NULL),(6,'EPOXICA',NULL),(7,'LACA',NULL);
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id_clientes` int NOT NULL AUTO_INCREMENT,
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
  `credito_usado` decimal(12,2) DEFAULT '0.00' COMMENT 'Suma de saldos pendientes activos',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_clientes`),
  KEY `idx_clientes_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Carlos Mendoza','Distribuidora Andina S.A.S',900123456,'Calle 45 #32-10, Barranquilla',NULL,30,3014567890,'c.mendoza@andina.com',2,1,30,5000000.00,125000.00,NULL),(2,'Juliana Pérez','Soluciones del Caribe Ltda',801987654,'Carrera 21 #55-22, Cartagena',NULL,30,3157894321,'juliana.perez@caribe.com',1,2,60,10000000.00,0.00,NULL),(3,'Mauricio Torres','Pinturas Torres & Cía',1023456789,'Av. Murillo #12-80, Barranquilla',NULL,30,3001122334,'m.torres@ptorres.com',2,1,30,0.00,0.00,NULL),(21,NULL,'Cliente Soft Delete Test 6a04d3f18d3e0',999591882,NULL,NULL,30,NULL,NULL,2,1,30,0.00,0.00,'2026-05-13 19:41:38'),(23,NULL,'Cliente Soft Delete Test 6a04d42031ae0',999146893,NULL,NULL,30,NULL,NULL,2,1,30,0.00,0.00,'2026-05-13 19:42:25');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_sistema`
--

DROP TABLE IF EXISTS `configuracion_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_sistema` (
  `id_configuracion` int unsigned NOT NULL AUTO_INCREMENT,
  `grupo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `clave` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `valor` json DEFAULT NULL,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'string',
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id_configuracion`),
  UNIQUE KEY `clave` (`clave`),
  KEY `grupo` (`grupo`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_sistema`
--

LOCK TABLES `configuracion_sistema` WRITE;
/*!40000 ALTER TABLE `configuracion_sistema` DISABLE KEYS */;
INSERT INTO `configuracion_sistema` VALUES (1,'tributaria','iva_default','19','number','Porcentaje IVA general (%) aplicado por defecto en facturas y compras.','2026-05-25 16:05:32','seed'),(2,'tributaria','retencion_fuente_pct','2.5','number','Retención en la fuente por compra (%) — varía por concepto y régimen.','2026-05-25 16:05:32','seed'),(3,'tributaria','retencion_iva_pct','15','number','ReteIVA: porcentaje del IVA pagado que se retiene al proveedor (%).','2026-05-25 16:05:32','seed'),(4,'tributaria','retencion_ica_default','11.04','number','ReteICA por mil — default Barranquilla. Ajustar por ciudad/actividad.','2026-05-25 16:05:32','seed'),(5,'tributaria','aplicar_iva_por_default','true','boolean','Si true, los formularios de compra activan el toggle IVA al abrirse.','2026-05-25 16:05:32','seed'),(6,'umbrales','stock_critico_dias','7','number','Días restantes de stock para considerar una MP \"crítica\" (rojo en dashboard / inventario).','2026-05-25 16:05:32','seed'),(7,'umbrales','stock_warning_dias','30','number','Días restantes para \"advertencia\" (amarillo). Por encima → \"ok\" (verde).','2026-05-25 16:05:32','seed'),(8,'umbrales','mora_warning_dias','30','number','Días de mora desde los cuales una factura entra en alerta amarilla.','2026-05-25 16:05:32','seed'),(9,'umbrales','mora_critica_dias','60','number','Días de mora desde los cuales una factura entra en alerta roja (crítica).','2026-05-25 16:05:32','seed'),(10,'umbrales','margen_minimo_pct','10','number','Margen (%) por debajo del cual el dashboard marca rentabilidad en rojo.','2026-05-25 16:05:32','seed'),(11,'umbrales','margen_objetivo_pct','20','number','Margen (%) objetivo: por encima la rentabilidad se muestra en verde.','2026-05-25 16:05:32','seed'),(12,'seguridad','jwt_expiracion_horas','8','number','Horas de validez del JWT desde su emisión. Tras este tiempo el usuario debe re-loguearse.','2026-05-25 16:05:32','seed'),(13,'seguridad','max_intentos_login','5','number','Cantidad máxima de intentos de login fallidos antes de bloquear la IP temporalmente.','2026-05-25 16:05:32','seed'),(14,'seguridad','ventana_intentos_segundos','900','number','Ventana en segundos durante la cual se cuentan los intentos fallidos (default 900 = 15 min).','2026-05-25 16:05:32','seed'),(15,'seguridad','password_min_caracteres','8','number','Longitud mínima requerida para contraseñas nuevas.','2026-05-25 16:05:32','seed'),(16,'financiero','margen_utilidad_default_pct','50','number','Margen de utilidad por defecto (%) cuando un costo no tiene `porcentaje_utilidad` explícito.','2026-05-25 16:05:32','seed'),(17,'comercial','dias_vencimiento_factura','30','number','Días desde la emisión hasta el vencimiento por default al crear/convertir una factura.','2026-05-25 16:05:32','seed'),(18,'comercial','dias_credito_default','30','number','Plazo de pago por default sugerido al crear un cliente nuevo.','2026-05-25 16:05:32','seed'),(19,'notificaciones','limit_default','30','number','Cantidad de notificaciones a devolver por defecto en la query.','2026-05-25 16:05:32','seed'),(20,'notificaciones','limit_maximo','100','number','Tope superior absoluto para evitar payloads excesivos.','2026-05-25 16:05:32','seed'),(21,'notificaciones','dias_alerta_vencimiento','3','number','Días previos al vencimiento de una factura para empezar a notificar.','2026-05-25 16:05:32','seed'),(22,'paginacion','page_size_default','10','number','Cantidad de filas por página default en tablas listables.','2026-07-17 20:12:33','root'),(23,'paginacion','max_per_page','200','number','Tope máximo permitido para `?per_page=` en endpoints paginados.','2026-07-17 20:12:33','root'),(24,'apariencia','avatar_palette','[{\"key\": \"default\", \"grad\": null, \"name\": \"Por rol\", \"preview\": \"from-zinc-400  to-zinc-600\"}, {\"key\": \"violet\", \"grad\": \"from-violet-500  to-purple-600\", \"name\": \"Violeta\", \"preview\": \"from-violet-500 to-purple-600\"}, {\"key\": \"blue\", \"grad\": \"from-blue-500    to-cyan-600\", \"name\": \"Azul\", \"preview\": \"from-blue-500   to-cyan-600\"}, {\"key\": \"emerald\", \"grad\": \"from-emerald-500 to-teal-600\", \"name\": \"Esmeralda\", \"preview\": \"from-emerald-500 to-teal-600\"}, {\"key\": \"amber\", \"grad\": \"from-amber-500   to-orange-600\", \"name\": \"Ámbar\", \"preview\": \"from-amber-500  to-orange-600\"}, {\"key\": \"rose\", \"grad\": \"from-rose-500    to-pink-600\", \"name\": \"Rosa\", \"preview\": \"from-rose-500   to-pink-600\"}, {\"key\": \"slate\", \"grad\": \"from-slate-600   to-zinc-800\", \"name\": \"Pizarra\", \"preview\": \"from-slate-600  to-zinc-800\"}, {\"key\": \"indigo\", \"grad\": \"from-indigo-500  to-fuchsia-600\", \"name\": \"Índigo\", \"preview\": \"from-indigo-500 to-fuchsia-600\"}]','json','Paleta de gradientes que cada usuario puede elegir para su avatar. Array JSON: [{key, name, grad, preview}].','2026-05-25 16:05:32','seed'),(27,'umbrales','ventana_consumo_dias','30','number','DÃ­as hacia atrÃ¡s para medir el consumo de MP y proyectar los dÃ­as de stock restante (debe alinear con los umbrales de stock).','2026-07-23 13:17:24','seed'),(28,'umbrales','oc_demora_dias','14','number','DÃ­as que una OC Enviada puede estar sin recibir antes de marcarse como demorada (alerta de seguimiento a proveedor).','2026-07-23 13:17:24','seed'),(29,'seguridad','refresh_token_dias','7','number','DuraciÃ³n del refresh token (sesiÃ³n recordada). Al vencer, el usuario debe re-loguearse.','2026-07-23 13:17:24','seed'),(30,'nomina','nomina_smmlv','1750905','number','Salario mÃ­nimo mensual legal vigente (SMMLV). Usado para decidir si aplica auxilio de transporte (salario <= 2 SMMLV).','2026-07-24 14:54:20','root'),(31,'nomina','nomina_auxilio_transporte','249095','number','Auxilio de transporte mensual. Se paga proporcional a los dÃ­as trabajados a quien gane <= 2 SMMLV.','2026-07-24 14:54:20','root'),(32,'nomina','nomina_pct_salud','4','number','Porcentaje de deducciÃ³n de salud a cargo del empleado (sobre el salario devengado, sin auxilio de transporte).','2026-07-24 14:54:20','root'),(33,'nomina','nomina_pct_pension','4','number','Porcentaje de deducciÃ³n de pensiÃ³n a cargo del empleado (sobre el salario devengado, sin auxilio de transporte).','2026-07-24 14:54:20','root');
/*!40000 ALTER TABLE `configuracion_sistema` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costos_indirectos`
--

DROP TABLE IF EXISTS `costos_indirectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `costos_indirectos` (
  `id_costos_indirectos` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `categoria` enum('servicios','mano_de_obra','instalaciones','otros') NOT NULL,
  `valor_mensual` decimal(15,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_actualizacion` date DEFAULT NULL,
  PRIMARY KEY (`id_costos_indirectos`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costos_indirectos`
--

LOCK TABLES `costos_indirectos` WRITE;
/*!40000 ALTER TABLE `costos_indirectos` DISABLE KEYS */;
/*!40000 ALTER TABLE `costos_indirectos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costos_indirectos_item`
--

DROP TABLE IF EXISTS `costos_indirectos_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `costos_indirectos_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_general_id` int NOT NULL,
  `costos_indirectos_id` int NOT NULL,
  `valor_asignado` decimal(15,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cii_item_costo` (`item_general_id`,`costos_indirectos_id`),
  KEY `idx_cii_costo` (`costos_indirectos_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costos_indirectos_item`
--

LOCK TABLES `costos_indirectos_item` WRITE;
/*!40000 ALTER TABLE `costos_indirectos_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `costos_indirectos_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costos_item`
--

DROP TABLE IF EXISTS `costos_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `costos_item` (
  `id_costos_item` int NOT NULL AUTO_INCREMENT,
  `item_general_id` int NOT NULL,
  `costo_unitario` decimal(18,2) DEFAULT NULL,
  `costo_mp_galon` decimal(10,0) DEFAULT NULL,
  `costo_cunete` decimal(10,0) NOT NULL,
  `costo_tambor` decimal(10,0) NOT NULL,
  `periodo` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `metodo_calculo` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
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
  `porcentaje_utilidad` decimal(10,0) DEFAULT NULL,
  PRIMARY KEY (`id_costos_item`),
  KEY `item_general_id` (`item_general_id`),
  CONSTRAINT `costos_item_ibfk_1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=298 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costos_item`
--

LOCK TABLES `costos_item` WRITE;
/*!40000 ALTER TABLE `costos_item` DISABLE KEYS */;
INSERT INTO `costos_item` VALUES (1,1,0.00,2000,0,0,NULL,'MANUAL','2025-06-07',0,4200.00,350.00,140,153,50,2000.00,0,600,NULL,20),(2,31,7000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(3,32,11000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(4,33,34050.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(5,34,27144.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(6,35,12691.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(7,36,4372.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(8,37,11466.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(9,38,16300.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(10,39,17000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(11,40,4400.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(12,41,14300.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(13,42,40.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(14,43,1550.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(15,44,4617.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(19,48,5400.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(21,50,12215.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(23,52,14152.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(25,54,12718.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(27,56,11447.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(30,59,722.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(31,60,715.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(32,61,4300.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(34,63,8000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(35,64,8000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(37,66,22700.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(38,67,43900.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(39,68,37300.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(40,69,22700.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(42,71,19500.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(43,72,33500.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(44,73,37200.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(45,74,21850.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(46,75,10400.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(47,76,8000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(48,77,11466.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(49,78,13000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(51,80,2900.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(52,81,17000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(54,83,4617.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(55,84,22700.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(56,85,22700.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(57,86,11000.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(58,2,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,212,20000.00,0,600,NULL,75),(59,3,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,398,170000.00,0,600,NULL,NULL),(60,4,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,440,0.00,0,600,NULL,NULL),(61,5,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,50,0.00,0,600,NULL,NULL),(62,6,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,397,0.00,0,600,NULL,NULL),(63,7,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,396,0.00,0,600,NULL,NULL),(64,8,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,712,0.00,0,600,NULL,NULL),(65,9,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,616,0.00,0,600,NULL,NULL),(66,10,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,711,0.00,0,600,NULL,NULL),(67,11,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,50,0.00,0,600,NULL,NULL),(68,12,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,599,0.00,0,600,NULL,NULL),(69,13,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,578,0.00,0,600,NULL,NULL),(70,14,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,100,0.00,0,600,NULL,NULL),(71,15,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,100,0.00,0,600,NULL,NULL),(72,16,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,212,0.00,0,600,NULL,NULL),(73,17,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,213,0.00,0,600,NULL,NULL),(74,18,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,100,0.00,0,600,NULL,NULL),(75,19,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,3600.00,350.00,140,153,50,0.00,0,600,NULL,NULL),(76,20,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,328,0.00,0,150,NULL,NULL),(77,21,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,345,0.00,0,150,NULL,NULL),(78,22,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,488,0.00,0,150,NULL,NULL),(79,23,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,119,0.00,0,150,NULL,NULL),(80,24,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,961,0.00,0,150,NULL,NULL),(81,25,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,1018,0.00,0,150,NULL,NULL),(82,26,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,874,0.00,0,150,NULL,NULL),(83,27,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,851,0.00,0,150,NULL,NULL),(84,28,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,833,0.00,0,150,NULL,NULL),(85,29,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,748,0.00,0,150,NULL,NULL),(86,30,0.00,0,0,0,NULL,'MANUAL','2025-06-07',0,0.00,0.00,0,0,376,0.00,0,150,NULL,NULL),(87,87,4372.00,0,0,0,NULL,'MANUAL','2025-06-10',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(88,88,4400.00,0,0,0,NULL,'MANUAL','2025-06-10',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(92,92,16300.00,0,0,0,NULL,'MANUAL','2025-06-10',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(93,93,14152.00,0,0,0,NULL,'MANUAL','2025-06-10',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(96,96,11447.00,0,0,0,NULL,'MANUAL','2025-06-10',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(108,100,8000.00,0,0,0,NULL,'MANUAL','2025-06-15',0,0.00,0.00,0,0,0,0.00,0,0,NULL,NULL),(147,133,0.00,0,0,0,NULL,'Manual','2026-01-16',0,0.00,0.00,0,0,213,0.00,1,0,1,NULL),(164,223,0.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL),(165,224,0.00,0,0,0,'2026-04','Manual','2026-04-18',0,0.00,0.00,0,0,50,0.00,NULL,0,1,NULL),(167,231,5378.00,0,0,0,'2026-04','Manual','2026-04-22',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(168,232,2000.00,0,0,0,'2026-04','Manual','2026-04-22',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(169,233,2000.00,0,0,0,'2026-04','Manual','2026-04-22',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(171,235,1942.53,0,0,0,'2026-04','PROMEDIO_PONDERADO','2026-08-11',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(172,236,1000.00,0,0,0,'2026-04','Manual','2026-04-22',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(176,241,2000.00,0,0,0,'2026-04','Manual','2026-04-22',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(177,242,2000.00,0,0,0,'2026-04','Manual','2026-04-22',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(178,275,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,213,0.00,0,0,1,NULL),(179,276,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,200,0.00,0,0,1,NULL),(180,277,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,100,0.00,0,0,1,NULL),(181,278,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(182,279,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,0,0.00,0,0,1,NULL),(183,280,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(184,281,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(185,282,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,100,0.00,0,0,1,NULL),(186,283,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,200,0.00,0,0,1,NULL),(187,284,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(188,285,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,25,0.00,0,0,1,NULL),(189,286,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,25,0.00,0,0,1,NULL),(190,287,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(191,288,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(192,289,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,100,0.00,0,0,1,NULL),(193,290,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,4800.00,350.00,500,0,100,0.00,0,2000,1,40),(194,291,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(195,292,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,100,0.00,0,0,1,NULL),(196,293,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(197,294,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(198,295,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,15,0.00,0,0,1,NULL),(199,296,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,100,0.00,0,0,1,NULL),(200,297,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,5,0.00,0,0,1,NULL),(201,298,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,4,0.00,0,0,1,NULL),(202,299,0.00,0,0,0,'2026-05','Manual','2026-05-07',0,0.00,0.00,0,0,50,0.00,0,0,1,NULL),(203,230,5714.94,NULL,0,0,NULL,'PROMEDIO_PONDERADO','2026-08-11',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL),(204,300,5040.00,0,0,0,'2026-05','PROMED','2026-05-27',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(205,301,7620.00,0,0,0,'2026-05','PROMED','2026-05-17',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(206,302,0.00,0,0,0,'2026-05','Catálo','2026-05-16',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(207,351,0.00,0,0,0,'2026-05','Catálo','2026-05-30',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(208,352,0.00,0,0,0,'2026-05','Catálo','2026-05-30',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(209,353,0.00,0,0,0,'2026-05','Catálo','2026-05-30',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(210,354,0.00,0,0,0,'2026-06','Manual','2026-06-27',0,0.00,0.00,0,0,40,0.00,NULL,0,1,50),(211,355,0.00,0,0,0,'2026-07','Catálo','2026-07-02',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(212,356,0.00,0,0,0,'2026-07','Catálo','2026-07-02',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(213,357,0.00,0,0,0,'2026-07','Catálo','2026-07-02',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(214,358,0.00,0,0,0,'2026-07','Catálo','2026-07-02',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(215,359,0.00,0,0,0,'2026-07','Catálo','2026-07-02',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(216,360,0.00,0,0,0,'2026-07','Catálo','2026-07-02',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(293,459,0.00,0,0,0,'2026-07','CatÃ¡logo','2026-07-27',0,0.00,0.00,0,0,1,0.00,NULL,0,1,NULL),(294,461,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,100,NULL,NULL,NULL,1,NULL),(295,462,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,100,NULL,NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `costos_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costos_produccion`
--

DROP TABLE IF EXISTS `costos_produccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `costos_produccion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `costo_unitario` mediumint DEFAULT NULL,
  `costo_mp_galon` tinyint DEFAULT NULL,
  `periodo` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `metodo_calculo` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
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
  `preparaciones_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_costos_produccion_preparaciones1_idx` (`preparaciones_id`),
  CONSTRAINT `fk_costos_produccion_preparaciones` FOREIGN KEY (`preparaciones_id`) REFERENCES `preparaciones` (`id_preparaciones`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costos_produccion`
--

LOCK TABLES `costos_produccion` WRITE;
/*!40000 ALTER TABLE `costos_produccion` DISABLE KEYS */;
/*!40000 ALTER TABLE `costos_produccion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costos_snapshot`
--

DROP TABLE IF EXISTS `costos_snapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `costos_snapshot` (
  `id_costos_snapshot` int unsigned NOT NULL AUTO_INCREMENT,
  `item_general_id` int NOT NULL COMMENT 'FK a item_general',
  `fecha` date NOT NULL COMMENT 'Fecha del snapshot (YYYY-MM-DD)',
  `estado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'completo | incompleto al momento del snapshot',
  `volumen_base` decimal(15,4) NOT NULL DEFAULT '1.0000',
  `costo_mp_total` decimal(15,2) DEFAULT NULL COMMENT 'NULL si producto incompleto',
  `costo_mp_por_unidad` decimal(15,2) DEFAULT NULL,
  `costo_empaque_mod` decimal(15,2) NOT NULL DEFAULT '0.00',
  `costo_total` decimal(15,2) DEFAULT NULL,
  `porcentaje_utilidad` decimal(5,2) NOT NULL DEFAULT '0.00',
  `precio_venta_calc` decimal(15,2) DEFAULT NULL,
  `mps_total` int NOT NULL DEFAULT '0',
  `mps_cubiertas` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_costos_snapshot`),
  UNIQUE KEY `uq_snapshot_item_fecha` (`item_general_id`,`fecha`),
  KEY `item_general_id_fecha` (`item_general_id`,`fecha`),
  KEY `fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costos_snapshot`
--

LOCK TABLES `costos_snapshot` WRITE;
/*!40000 ALTER TABLE `costos_snapshot` DISABLE KEYS */;
INSERT INTO `costos_snapshot` VALUES (5,16,'2026-07-15','completo',212.0000,3128782.69,14758.41,4843.00,19601.41,50.00,29402.11,15,15,'2026-07-15 20:56:40'),(6,18,'2026-07-15','completo',100.0000,1673917.15,16739.17,4843.00,21582.17,50.00,32373.26,15,15,'2026-07-15 20:56:40'),(7,288,'2026-07-15','incompleto',50.0000,NULL,NULL,0.00,NULL,50.00,NULL,18,15,'2026-07-15 20:56:40'),(8,14,'2026-07-15','incompleto',100.0000,NULL,NULL,4843.00,NULL,50.00,NULL,15,14,'2026-07-15 20:56:40'),(9,15,'2026-07-15','incompleto',100.0000,NULL,NULL,4843.00,NULL,50.00,NULL,12,11,'2026-07-15 20:56:40'),(10,17,'2026-07-15','completo',213.0000,3132613.69,14707.11,4843.00,19550.11,50.00,29325.16,15,15,'2026-07-15 20:56:40'),(11,19,'2026-07-15','incompleto',50.0000,NULL,NULL,4843.00,NULL,50.00,NULL,13,12,'2026-07-15 20:56:40'),(12,1,'2026-07-15','completo',50.0000,926350.40,18527.01,5443.00,23970.01,20.00,28764.01,6,6,'2026-07-15 20:56:40'),(13,354,'2026-07-15','completo',40.0000,1500571.60,37514.29,0.00,37514.29,50.00,56271.44,2,2,'2026-07-15 20:56:40'),(14,295,'2026-07-15','incompleto',15.0000,NULL,NULL,0.00,NULL,50.00,NULL,14,13,'2026-07-15 20:56:40'),(15,290,'2026-07-15','completo',100.0000,4222390.70,42223.91,7650.00,49873.91,40.00,69823.47,13,13,'2026-07-15 20:56:40'),(16,292,'2026-07-15','incompleto',100.0000,NULL,NULL,0.00,NULL,50.00,NULL,15,14,'2026-07-15 20:56:40'),(17,291,'2026-07-15','incompleto',50.0000,NULL,NULL,0.00,NULL,50.00,NULL,14,13,'2026-07-15 20:56:40'),(18,293,'2026-07-15','incompleto',50.0000,NULL,NULL,0.00,NULL,50.00,NULL,11,10,'2026-07-15 20:56:40'),(19,294,'2026-07-15','incompleto',50.0000,NULL,NULL,0.00,NULL,50.00,NULL,12,11,'2026-07-15 20:56:40'),(20,296,'2026-07-15','completo',100.0000,3603143.65,36031.44,0.00,36031.44,50.00,54047.15,14,14,'2026-07-15 20:56:40'),(21,224,'2026-07-15','completo',50.0000,1961223.65,39224.47,0.00,39224.47,50.00,58836.71,6,6,'2026-07-15 20:56:40'),(22,11,'2026-07-15','completo',50.0000,1093365.23,21867.30,4843.00,26710.30,50.00,40065.46,14,14,'2026-07-15 20:56:40'),(23,281,'2026-07-15','completo',50.0000,1048346.73,20966.93,0.00,20966.93,50.00,31450.40,13,13,'2026-07-15 20:56:40'),(24,9,'2026-07-15','incompleto',616.0000,NULL,NULL,4843.00,NULL,50.00,NULL,16,14,'2026-07-15 20:56:40'),(25,277,'2026-07-15','incompleto',100.0000,NULL,NULL,0.00,NULL,50.00,NULL,13,12,'2026-07-15 20:56:40'),(26,2,'2026-07-15','completo',212.0000,3888823.54,18343.51,4843.00,23186.51,75.00,40576.39,16,16,'2026-07-15 20:56:40'),(27,284,'2026-07-15','incompleto',50.0000,NULL,NULL,0.00,NULL,50.00,NULL,15,14,'2026-07-15 20:56:40'),(28,285,'2026-07-15','completo',25.0000,437381.63,17495.27,0.00,17495.27,50.00,26242.90,14,14,'2026-07-15 20:56:40'),(29,10,'2026-07-15','incompleto',711.0000,NULL,NULL,4843.00,NULL,50.00,NULL,15,14,'2026-07-15 20:56:40'),(30,283,'2026-07-15','completo',200.0000,4366582.54,21832.91,0.00,21832.91,50.00,32749.37,15,15,'2026-07-15 20:56:40'),(31,3,'2026-07-15','incompleto',398.0000,NULL,NULL,4843.00,NULL,50.00,NULL,11,10,'2026-07-15 20:56:40'),(32,289,'2026-07-15','completo',100.0000,2301558.63,23015.59,0.00,23015.59,50.00,34523.38,10,10,'2026-07-15 20:56:40'),(33,287,'2026-07-15','completo',50.0000,1920834.89,38416.70,0.00,38416.70,50.00,57625.05,9,9,'2026-07-15 20:56:40'),(34,286,'2026-07-15','completo',25.0000,485186.52,19407.46,0.00,19407.46,50.00,29111.19,13,13,'2026-07-15 20:56:40'),(35,297,'2026-07-15','completo',5.0000,184449.62,36889.92,0.00,36889.92,50.00,55334.89,7,7,'2026-07-15 20:56:40'),(36,298,'2026-07-15','completo',4.0000,133609.42,33402.35,0.00,33402.35,50.00,50103.53,8,8,'2026-07-15 20:56:40'),(37,299,'2026-07-15','completo',50.0000,2292540.03,45850.80,0.00,45850.80,50.00,68776.20,11,11,'2026-07-15 20:56:40'),(38,8,'2026-07-15','incompleto',712.0000,NULL,NULL,4843.00,NULL,50.00,NULL,16,14,'2026-07-15 20:56:40'),(39,12,'2026-07-15','incompleto',599.0000,NULL,NULL,4843.00,NULL,50.00,NULL,11,9,'2026-07-15 20:56:40'),(40,282,'2026-07-15','incompleto',100.0000,NULL,NULL,0.00,NULL,50.00,NULL,14,13,'2026-07-15 20:56:40'),(41,6,'2026-07-15','incompleto',397.0000,NULL,NULL,4843.00,NULL,50.00,NULL,10,9,'2026-07-15 20:56:40'),(42,4,'2026-07-15','incompleto',440.0000,NULL,NULL,4843.00,NULL,50.00,NULL,14,12,'2026-07-15 20:56:40'),(43,5,'2026-07-15','incompleto',50.0000,NULL,NULL,4843.00,NULL,50.00,NULL,9,8,'2026-07-15 20:56:40'),(44,13,'2026-07-15','incompleto',578.0000,NULL,NULL,4843.00,NULL,50.00,NULL,10,9,'2026-07-15 20:56:40'),(45,7,'2026-07-15','incompleto',396.0000,NULL,NULL,4843.00,NULL,50.00,NULL,13,10,'2026-07-15 20:56:40'),(46,278,'2026-07-15','completo',50.0000,1170983.43,23419.67,0.00,23419.67,50.00,35129.50,6,6,'2026-07-15 20:56:40'),(47,25,'2026-07-15','incompleto',1018.0000,NULL,NULL,150.00,NULL,50.00,NULL,8,7,'2026-07-15 20:56:40'),(48,21,'2026-07-15','incompleto',345.0000,NULL,NULL,150.00,NULL,50.00,NULL,8,7,'2026-07-15 20:56:40'),(49,29,'2026-07-15','completo',748.0000,7152391.64,9562.02,150.00,9712.02,50.00,14568.03,6,6,'2026-07-15 20:56:40'),(50,23,'2026-07-15','completo',119.0000,1950103.70,16387.43,150.00,16537.43,50.00,24806.14,8,8,'2026-07-15 20:56:40'),(51,28,'2026-07-15','incompleto',833.0000,NULL,NULL,150.00,NULL,50.00,NULL,8,7,'2026-07-15 20:56:40'),(52,20,'2026-07-15','completo',328.0000,3100043.86,9451.35,150.00,9601.35,50.00,14402.03,7,7,'2026-07-15 20:56:40'),(53,275,'2026-07-15','completo',213.0000,1713063.28,8042.55,0.00,8042.55,50.00,12063.83,17,17,'2026-07-15 20:56:40'),(54,276,'2026-07-15','completo',200.0000,1971986.34,9859.93,0.00,9859.93,50.00,14789.90,16,16,'2026-07-15 20:56:40'),(55,280,'2026-07-15','completo',50.0000,717806.98,14356.14,0.00,14356.14,50.00,21534.21,18,18,'2026-07-15 20:56:40'),(56,133,'2026-07-15','completo',213.0000,3454636.16,16218.95,0.00,16218.95,50.00,24328.42,22,22,'2026-07-15 20:56:40');
/*!40000 ALTER TABLE `costos_snapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizaciones`
--

DROP TABLE IF EXISTS `cotizaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizaciones` (
  `id_cotizaciones` int unsigned NOT NULL AUTO_INCREMENT,
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
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_cotizaciones`),
  UNIQUE KEY `numero` (`numero`),
  KEY `cliente_id` (`cliente_id`),
  KEY `facturas_id` (`facturas_id`),
  KEY `idx_cotizaciones_deleted_at` (`deleted_at`),
  CONSTRAINT `cotizaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_clientes`),
  CONSTRAINT `cotizaciones_ibfk_2` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizaciones`
--

LOCK TABLES `cotizaciones` WRITE;
/*!40000 ALTER TABLE `cotizaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotizaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizaciones_detalle`
--

DROP TABLE IF EXISTS `cotizaciones_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizaciones_detalle` (
  `id_detalle` int unsigned NOT NULL AUTO_INCREMENT,
  `cotizaciones_id` int unsigned NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id_detalle`),
  KEY `cotizaciones_id` (`cotizaciones_id`),
  CONSTRAINT `cotizaciones_detalle_ibfk_1` FOREIGN KEY (`cotizaciones_id`) REFERENCES `cotizaciones` (`id_cotizaciones`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizaciones_detalle`
--

LOCK TABLES `cotizaciones_detalle` WRITE;
/*!40000 ALTER TABLE `cotizaciones_detalle` DISABLE KEYS */;
INSERT INTO `cotizaciones_detalle` VALUES (1,1,'Pintura base agua blanca 4L',2.00,85000.00,0.00,170000.00),(2,1,'Sellador multiusos 3.6L',1.00,88000.00,0.00,88000.00),(3,1,'Rodillos premium 9\"',5.00,8400.00,0.00,42000.00),(4,3,'Pintura exterior mate 4L',4.00,92000.00,0.00,368000.00),(5,3,'Lija al agua grano 220',20.00,7600.00,0.00,152000.00),(6,4,'Pintura epóxica 4L',6.00,125000.00,5.00,712500.00),(7,4,'Catalizador epóxico 1L',6.00,45000.00,0.00,270000.00),(8,5,'Thinner acrílico galón',5.00,50000.00,0.00,250000.00);
/*!40000 ALTER TABLE `cotizaciones_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_facturas`
--

DROP TABLE IF EXISTS `detalle_facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_facturas` (
  `id_detalle_facturas` int NOT NULL AUTO_INCREMENT,
  `cantidad` tinyint DEFAULT NULL,
  `precio_unitario` decimal(7,1) DEFAULT NULL,
  `subtotal` decimal(7,1) DEFAULT NULL,
  `facturas_id` int DEFAULT NULL,
  `item_general_id` int DEFAULT NULL,
  PRIMARY KEY (`id_detalle_facturas`),
  UNIQUE KEY `id_detalle_facturas_UNIQUE` (`id_detalle_facturas`),
  KEY `fk_detalle_facturas_facturas1_idx` (`facturas_id`),
  KEY `fk_detalle_facturas_item_general1_idx` (`item_general_id`),
  CONSTRAINT `fk_detalle_facturas_facturas1` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`),
  CONSTRAINT `fk_detalle_facturas_item_general1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_facturas`
--

LOCK TABLES `detalle_facturas` WRITE;
/*!40000 ALTER TABLE `detalle_facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa`
--

DROP TABLE IF EXISTS `empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa` (
  `id_empresa` int NOT NULL AUTO_INCREMENT,
  `nit` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `razon_social` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ciudad` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefono` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `celular` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pagina_web` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `locale` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'es-CO',
  `moneda` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'COP',
  `logo_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id_empresa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa`
--

LOCK TABLES `empresa` WRITE;
/*!40000 ALTER TABLE `empresa` DISABLE KEYS */;
INSERT INTO `empresa` VALUES (1,'901314182','PINTURAS INDUSTRIALES DEL CARIBE S.A.S','Comercio al por mayor de materiales de construcción, artículos de ferretería, pinturas, productos de vidrio, equipo y materiales de fontanería y calefacción. - 4663','Barranquilla','Calle 99 # 6-59','3019794729','+57 3019794729','https://pinca.com.co/','pinca.sas@hotmail.com','es-CO','COP','/uploads/empresa/logo_default.png');
/*!40000 ALTER TABLE `empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factories`
--

DROP TABLE IF EXISTS `factories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(31) NOT NULL,
  `uid` varchar(31) NOT NULL,
  `class` varchar(63) NOT NULL,
  `icon` varchar(31) NOT NULL,
  `summary` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `uid` (`uid`),
  KEY `deleted_at_id` (`deleted_at`,`id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factories`
--

LOCK TABLES `factories` WRITE;
/*!40000 ALTER TABLE `factories` DISABLE KEYS */;
/*!40000 ALTER TABLE `factories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id_facturas` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
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
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_facturas`),
  UNIQUE KEY `id_facturas_UNIQUE` (`id_facturas`),
  UNIQUE KEY `uq_facturas_numero` (`numero`),
  KEY `fk_facturas_movimientos_inventario1_idx` (`movimiento_inventario_id`),
  KEY `idx_facturas_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_facturas_movimientos_inventario1` FOREIGN KEY (`movimiento_inventario_id`) REFERENCES `movimiento_inventario` (`id_movimiento_inventario`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas_detalle`
--

DROP TABLE IF EXISTS `facturas_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas_detalle` (
  `id_detalle` int unsigned NOT NULL AUTO_INCREMENT,
  `facturas_id` int NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id_detalle`),
  KEY `facturas_id` (`facturas_id`),
  CONSTRAINT `facturas_detalle_ibfk_1` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas_detalle`
--

LOCK TABLES `facturas_detalle` WRITE;
/*!40000 ALTER TABLE `facturas_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formulaciones`
--

DROP TABLE IF EXISTS `formulaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formulaciones` (
  `id_formulaciones` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `estado` tinyint DEFAULT NULL COMMENT '0 inactiva\\n1 activa',
  `defecto` tinyint DEFAULT '0' COMMENT '1 por defecto',
  `version_actual` int NOT NULL DEFAULT '1',
  `item_general_id` int DEFAULT NULL,
  PRIMARY KEY (`id_formulaciones`),
  UNIQUE KEY `id_formulaciones_UNIQUE` (`id_formulaciones`),
  KEY `fk_formulaciones_item_general1_idx` (`item_general_id`),
  CONSTRAINT `fk_formulaciones_item_general1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formulaciones`
--

LOCK TABLES `formulaciones` WRITE;
/*!40000 ALTER TABLE `formulaciones` DISABLE KEYS */;
INSERT INTO `formulaciones` VALUES (1,'PREPARACION BARNIZ TRANSPARENTE BRILLANTE',NULL,1,1,2,1),(2,'PREPARACION ESMALTE BLANCO',NULL,1,1,5,2),(3,'PREPARACION ESMALTE CAOBA',NULL,1,1,1,3),(4,'PREPARACION ESMALTE NEGRO MATE',NULL,1,1,1,4),(5,'PREPARACION ESMALTE ROJO FIESTA',NULL,1,1,2,5),(6,'PREPARACION ESMALTE NEGRO BRILLANTE',NULL,1,1,1,6),(7,'PREPARACION ESMALTE VERDE ESMERALDA',NULL,1,1,1,7),(8,'PREPARACION ESMALTE GRIS PLATA',NULL,1,1,1,8),(9,'PREPARACION ESMALTE AZUL ESPAÑOL',NULL,1,1,1,9),(10,'PREPARACION ESMALTE BLANCO MATE',NULL,1,1,1,10),(11,'PREPARACION ESMALTE AMARILLO',NULL,1,1,2,11),(12,'PREPARACION ESMALTE NARANJA',NULL,1,1,1,12),(13,'PREPARACION ESMALTE TABACO',NULL,1,1,1,13),(14,'PREPARACION ANTICORROSIVO GRIS',NULL,1,1,2,14),(15,'PREPARACION ANTICORROSIVO NEGRO',NULL,1,1,2,15),(16,'PREPARACION ANTICORROSIVO AMARILLO',NULL,1,1,1,16),(17,'PREPARACION ANTICORROSIVO ROJO',NULL,1,1,1,17),(18,'PREPARACION ANTICORROSIVO BLANCO',NULL,1,1,2,18),(19,'PREPARACION ANTICORROSIVO VERDE',NULL,1,1,2,19),(20,'PREPARACION PASTA ESMALTE VERDE ENTONADOR',NULL,1,1,1,20),(21,'PREPARACION PASTA ESMALTE AZUL ENTONADOR',NULL,1,1,1,21),(22,'PREPARACION PASTA ESMALTE NEGRO',NULL,1,1,1,22),(23,'PREPARACION PASTA ESMALTE ROJO CARMIN 57:1',NULL,1,1,1,23),(24,'PREPARACION PASTA ESMALTE NARANJA',NULL,1,1,1,24),(25,'PREPARACION PASTA ESMALTE AMARILLO',NULL,1,1,1,25),(26,'PREPARACION PASTA ESMALTE CAOBA',NULL,1,1,1,26),(27,'PREPARACION PASTA ESMALTE AMARILLO OXIDO',NULL,1,1,1,27),(28,'PREPARACION PASTA ESMALTE ROJO OXIDO',NULL,1,1,1,28),(29,'PREPARACION PASTA ESMALTE BLANCO',NULL,1,1,1,29),(30,'PREPARACION PASTA ESMALTE TABACO',NULL,1,1,1,30),(31,'FORMULACION VINILO T1 BLANCO',NULL,1,1,1,133),(32,'FORMULACION EPOXICA TRANSPARENTE',NULL,1,1,1,224),(33,'FORMULACION VINILO BLANCO TIPO 2',NULL,1,1,1,275),(34,'FORMULACION VINILO BLANCO TIPO 3',NULL,1,1,1,276),(35,'FORMULACION ESMALTE AZUL REAL',NULL,1,1,1,277),(36,'FORMULACION LACA CATALIZADA BRILLANTE',NULL,1,1,1,278),(37,'FORMULACION PASTA OCRE PARA VINILO',NULL,1,1,1,279),(38,'FORMULACION VINILO OCRE T1',NULL,1,1,1,280),(39,'FORMULACION ESMALTE AMARILLO CATERPILLAR',NULL,1,1,1,281),(40,'FORMULACION ESMALTE NEGRO',NULL,1,1,1,282),(41,'FORMULACION ESMALTE BLANCO T1',NULL,1,1,1,283),(42,'FORMULACION ESMALTE BLANCO 4X1',NULL,1,1,1,284),(43,'FORMULACION ESMALTE BLANCO ECONOMICO JJ',NULL,1,1,1,285),(44,'FORMULACION ESMALTE ECONOMICO BLANCO JH',NULL,1,1,1,286),(45,'FORMULACION ESMALTE DORADO',NULL,1,1,1,287),(46,'FORMULACION ANTICORROSIVO CROMATO ZN',NULL,1,1,1,288),(47,'FORMULACION ESMALTE DE ALUMINIO',NULL,1,1,1,289),(48,'FORMULACION EPOXICA BLANCO',NULL,1,1,9,290),(49,'FORMULACION EPOXICA NEGRA',NULL,1,1,1,291),(50,'FORMULACION EPOXICA GRIS',NULL,1,1,1,292),(51,'FORMULACION EPOXICA NEGRA RESINA 100%',NULL,1,1,1,293),(52,'FORMULACION EPOXICA POLIAMIDA VERDE',NULL,1,1,1,294),(53,'FORMULACION EPOXICA AZUL',NULL,1,1,1,295),(54,'FORMULACION EPOXICA ROJO OXIDO',NULL,1,1,1,296),(55,'FORMULACION ESM EPOXI SILICATO BLANCO',NULL,1,1,1,297),(56,'FORMULACION ESM EPOXI SILICATO VERDE',NULL,1,1,1,298),(57,'FORMULACION ESMALTE EPOXICO AMARILLO',NULL,1,1,2,299),(68,'PREPARACION CATALIZADOR EPOXICO',NULL,1,1,1,354),(98,'FORMULACION VINILO T2 ECONOMICO',NULL,1,1,1,461),(99,'FORMULACION VINILO T1 COMERCIAL',NULL,1,1,1,462);
/*!40000 ALTER TABLE `formulaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formulaciones_versiones`
--

DROP TABLE IF EXISTS `formulaciones_versiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formulaciones_versiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formulacion_id` int NOT NULL,
  `version_num` int NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `ingredientes` json NOT NULL,
  `notas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_formulacion_version` (`formulacion_id`,`version_num`),
  KEY `idx_fv_formulacion` (`formulacion_id`),
  CONSTRAINT `formulaciones_versiones_formulacion_id_foreign` FOREIGN KEY (`formulacion_id`) REFERENCES `formulaciones` (`id_formulaciones`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formulaciones_versiones`
--

LOCK TABLES `formulaciones_versiones` WRITE;
/*!40000 ALTER TABLE `formulaciones_versiones` DISABLE KEYS */;
INSERT INTO `formulaciones_versiones` VALUES (1,1,1,'PREPARACIÓN BARNIZ TRANSPARENTE BIRILLANTE',NULL,'[{\"cantidad\": \"932.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"3.72\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"METIL ETIL CETOXIMA\", \"item_general_id\": \"32\"}, {\"cantidad\": \"6.52\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"10.25\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"9.32\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"301.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(2,2,1,'PREPARACION ESMALTE BLANCO',NULL,'[{\"cantidad\": \"914.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"425.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"293.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"2.63\", \"porcentaje\": null, \"item_codigo\": \"SOZ016\", \"item_nombre\": \"OCTOATO DE ZINC AL 16%\", \"item_general_id\": \"38\"}, {\"cantidad\": \"16.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"14.20\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"470.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"4.70\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"5.20\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"9.37\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"14.72\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"13.40\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"197.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}, {\"cantidad\": \"200.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(3,3,1,'PREPARACION ESMALTE CAOBA',NULL,'[{\"cantidad\": \"775.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"103.00\", \"porcentaje\": null, \"item_codigo\": \"PAS026\", \"item_nombre\": \"PASTA ESMALTE CAOBA\", \"item_general_id\": \"26\"}, {\"cantidad\": \"8.70\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"290.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"3.30\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"5.78\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"9.10\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"8.26\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"113.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}, {\"cantidad\": \"114.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(4,4,1,'PREPARACION ESMALTE NEGRO MATE',NULL,'[{\"cantidad\": \"775.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"224.00\", \"porcentaje\": null, \"item_codigo\": \"CTA011\", \"item_nombre\": \"MICROTALC C 20\", \"item_general_id\": \"47\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"MSI006\", \"item_nombre\": \"CELITE 499\", \"item_general_id\": \"48\"}, {\"cantidad\": \"12.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"ORGANOCLAY BK 884\", \"item_general_id\": \"81\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"125.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"8.70\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"290.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.90\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"3.35\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"5.86\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"9.21\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"8.37\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"227.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(5,5,1,'PREPARACIÓN ESMALTE ROJO FIESTA',NULL,'[{\"cantidad\": \"775.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"36.56\", \"porcentaje\": null, \"item_codigo\": \"PE1033\", \"item_nombre\": \"PASTA ESMALTE ROJO 57:1\", \"item_general_id\": \"50\"}, {\"cantidad\": \"79.40\", \"porcentaje\": null, \"item_codigo\": \"PAS024\", \"item_nombre\": \"PASTA ESMALTE NARANJA\", \"item_general_id\": \"24\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"200.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"3.33\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"5.83\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"9.16\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"8.32\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"227.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(6,6,1,'PREPARACION ESMALTE NEGRO BRILLANTE',NULL,'[{\"cantidad\": \"775.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"125.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"5.70\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"190.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.90\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"3.35\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"5.86\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"9.21\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"8.37\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"227.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(7,7,1,'PREPARACION ESMALTE VERDE ESMERALDA',NULL,'[{\"cantidad\": \"775.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"62.00\", \"porcentaje\": null, \"item_codigo\": \"PE1010\", \"item_nombre\": \"PASTA AMARILLO CROMO MEDIO\", \"item_general_id\": \"52\"}, {\"cantidad\": \"10.40\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}, {\"cantidad\": \"108.00\", \"porcentaje\": null, \"item_codigo\": \"PE1040\", \"item_nombre\": \"PASTA VERDE FTALO\", \"item_general_id\": \"54\"}, {\"cantidad\": \"6.20\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"205.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.10\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"3.46\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"6.05\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"9.51\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"8.65\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"113.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}, {\"cantidad\": \"114.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(8,8,1,'PREPARACION ESMALTE GRIS PLATA',NULL,'[{\"cantidad\": \"425.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"251.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"2.63\", \"porcentaje\": null, \"item_codigo\": \"SOZ016\", \"item_nombre\": \"OCTOATO DE ZINC AL 16%\", \"item_general_id\": \"38\"}, {\"cantidad\": \"16.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"3.30\", \"porcentaje\": null, \"item_codigo\": \"PAS027\", \"item_nombre\": \"PASTA ESMALTE AMARILLO OXIDO\", \"item_general_id\": \"27\"}, {\"cantidad\": \"17.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"14.20\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"470.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"4.70\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"5.20\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"9.37\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"14.72\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"13.40\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"197.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}, {\"cantidad\": \"200.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(9,9,1,'PREPARACION ESMALTE AZUL ESPAÑOL',NULL,'[{\"cantidad\": \"225.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"56.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"0.70\", \"porcentaje\": null, \"item_codigo\": \"SOZ016\", \"item_nombre\": \"OCTOATO DE ZINC AL 16%\", \"item_general_id\": \"38\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"168.00\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}, {\"cantidad\": \"11.20\", \"porcentaje\": null, \"item_codigo\": \"PE1033\", \"item_nombre\": \"PASTA ESMALTE ROJO 57:1\", \"item_general_id\": \"50\"}, {\"cantidad\": \"9.70\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"323.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"3.23\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"5.40\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"9.45\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"14.86\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"13.51\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"197.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}, {\"cantidad\": \"165.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(10,10,1,'PREPARACION ESMALTE BLANCO MATE',NULL,'[{\"cantidad\": \"1173.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"288.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"435.00\", \"porcentaje\": null, \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"84.00\", \"porcentaje\": null, \"item_codigo\": \"MSI006\", \"item_nombre\": \"CELITE 499\", \"item_general_id\": \"48\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ016\", \"item_nombre\": \"OCTOATO DE ZINC AL 16%\", \"item_general_id\": \"38\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"14.30\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"477.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"4.80\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"4.69\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"8.20\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"12.90\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"11.70\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"433.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(11,11,1,'PREPARACION ESMALTE AMARILLO',NULL,'[{\"cantidad\": \"1033.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"294.70\", \"porcentaje\": null, \"item_codigo\": \"PE1010\", \"item_nombre\": \"PASTA AMARILLO CROMO MEDIO\", \"item_general_id\": \"52\"}, {\"cantidad\": \"11.13\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"371.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"3.70\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"4.72\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"8.26\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"13.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"11.81\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"391.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(12,12,1,'PREPARACION ESMALTE NARANJA',NULL,'[{\"cantidad\": \"1033.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"PAS024\", \"item_nombre\": \"PASTA ESMALTE NARANJA\", \"item_general_id\": \"24\"}, {\"cantidad\": \"77.00\", \"porcentaje\": null, \"item_codigo\": \"PE1010\", \"item_nombre\": \"PASTA AMARILLO CROMO MEDIO\", \"item_general_id\": \"52\"}, {\"cantidad\": \"11.00\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"363.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"3.66\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"4.64\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"8.13\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"12.77\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"11.61\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"391.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(13,13,1,'PREPARACION ESMALTE TABACO',NULL,'[{\"cantidad\": \"1033.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"190.00\", \"porcentaje\": null, \"item_codigo\": \"PAS030\", \"item_nombre\": \"PASTA ESMALTE TABACO\", \"item_general_id\": \"30\"}, {\"cantidad\": \"11.00\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"363.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"3.60\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"4.50\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"7.90\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"12.40\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"11.30\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"391.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(14,14,1,'PREPARACION ANTICORROSIVO GRIS',NULL,'[{\"cantidad\": \"1056.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"186.00\", \"porcentaje\": null, \"item_codigo\": \"PED007\", \"item_nombre\": \"DIOXIDO DE TITANIO SULFATO 2196\", \"item_general_id\": \"77\"}, {\"cantidad\": \"848.00\", \"porcentaje\": null, \"item_codigo\": \"CTA025\", \"item_nombre\": \"MICROTALC C 20\", \"item_general_id\": \"59\"}, {\"cantidad\": \"70.00\", \"porcentaje\": null, \"item_codigo\": \"CCC004\", \"item_nombre\": \"CARBONATO DE CALCIO HI WHITE\", \"item_general_id\": \"60\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"17.80\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"593.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"5.93\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"4.30\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"7.40\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"11.60\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"10.60\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"550.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(15,15,1,'PREPARACION ANTICORROSIVO NEGRO',NULL,'[{\"cantidad\": \"256.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"37.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"2.30\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"46.00\", \"porcentaje\": null, \"item_codigo\": \"CCC004\", \"item_nombre\": \"CARBONATO DE CALCIO HI WHITE\", \"item_general_id\": \"60\"}, {\"cantidad\": \"132.00\", \"porcentaje\": null, \"item_codigo\": \"CTA025\", \"item_nombre\": \"MICROTALC C 20\", \"item_general_id\": \"59\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"AAS012\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"79\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"3.70\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"123.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"1.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"2.80\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"89.60\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(16,16,1,'PREPARACION ANTICORROSIVO AMARILLO',NULL,'[{\"cantidad\": \"274.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"47.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"220.00\", \"porcentaje\": null, \"item_codigo\": \"CTA025\", \"item_nombre\": \"MICROTALC C 20\", \"item_general_id\": \"59\"}, {\"cantidad\": \"18.00\", \"porcentaje\": null, \"item_codigo\": \"CCC004\", \"item_nombre\": \"CARBONATO DE CALCIO HI WHITE\", \"item_general_id\": \"60\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"6.50\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"4.80\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"160.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"1.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"1.92\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"2.74\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"142.60\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(17,17,1,'PREPARACION ANTICORROSIVO ROJO',NULL,'[{\"cantidad\": \"274.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"58.00\", \"porcentaje\": null, \"item_codigo\": \"PER030\", \"item_nombre\": \"OXIDO DE HIERRO ROJO R-5530\", \"item_general_id\": \"64\"}, {\"cantidad\": \"220.00\", \"porcentaje\": null, \"item_codigo\": \"CTA025\", \"item_nombre\": \"MICROTALC C 20\", \"item_general_id\": \"59\"}, {\"cantidad\": \"18.00\", \"porcentaje\": null, \"item_codigo\": \"CCC004\", \"item_nombre\": \"CARBONATO DE CALCIO HI WHITE\", \"item_general_id\": \"60\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"6.50\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"4.70\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"155.60\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.55\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"1.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"1.92\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"2.74\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"142.60\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(18,18,1,'PREPARACION ANTICORROSIVO BLANCO',NULL,'[{\"cantidad\": \"1056.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"165.00\", \"porcentaje\": null, \"item_codigo\": \"PED007\", \"item_nombre\": \"DIOXIDO DE TITANIO SULFATO 2196\", \"item_general_id\": \"77\"}, {\"cantidad\": \"230.00\", \"porcentaje\": null, \"item_codigo\": \"CTA020\", \"item_nombre\": \"MICROTALC 20\", \"item_general_id\": \"65\"}, {\"cantidad\": \"688.00\", \"porcentaje\": null, \"item_codigo\": \"CCC004\", \"item_nombre\": \"CARBONATO DE CALCIO HI WHITE\", \"item_general_id\": \"60\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ016\", \"item_nombre\": \"OCTOATO DE ZINC AL 16%\", \"item_general_id\": \"38\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"17.55\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"585.26\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"5.85\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"4.30\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"7.40\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"11.60\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"10.60\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"550.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(19,19,1,'PREPARACION ANTICORROSIVO VERDE',NULL,'[{\"cantidad\": \"256.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"36.00\", \"porcentaje\": null, \"item_codigo\": \"PED007\", \"item_nombre\": \"DIOXIDO DE TITANIO SULFATO 2196\", \"item_general_id\": \"77\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL 15:3\", \"item_general_id\": \"96\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"2.30\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"46.00\", \"porcentaje\": null, \"item_codigo\": \"CCC004\", \"item_nombre\": \"CARBONATO DE CALCIO HI WHITE\", \"item_general_id\": \"60\"}, {\"cantidad\": \"132.00\", \"porcentaje\": null, \"item_codigo\": \"CTA025\", \"item_nombre\": \"MICROTALC C 20\", \"item_general_id\": \"59\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"3.90\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"130.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"AET004\", \"item_nombre\": \"SULFATO DE MAGNESIO\", \"item_general_id\": \"43\"}, {\"cantidad\": \"1.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"2.80\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"89.60\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(20,20,1,'PREPARACION PASTA ESMALTE VERDE ENTONADOR',NULL,'[{\"cantidad\": \"186.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"METIL ETIL CETOXIMA\", \"item_general_id\": \"32\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"ADI002\", \"item_nombre\": \"TROYSPERSE CD1\", \"item_general_id\": \"66\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"PEV053\", \"item_nombre\": \"PIGMENTO VERDE FTALO 7\", \"item_general_id\": \"67\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"76.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(21,21,1,'PREPARACION PASTA ESMALTE AZUL ENTONADOR',NULL,'[{\"cantidad\": \"186.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"METIL ETIL CETOXIMA\", \"item_general_id\": \"32\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"AAS012\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"79\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"52.00\", \"porcentaje\": null, \"item_codigo\": \"PEA041\", \"item_nombre\": \"PIGMENTO AZUL FTALO 15;3\", \"item_general_id\": \"68\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"ADI010\", \"item_nombre\": \"EDAPLAN 918\", \"item_general_id\": \"97\"}, {\"cantidad\": \"76.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(22,22,1,'PREPARACION PASTA ESMALTE NEGRO',NULL,'[{\"cantidad\": \"242.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"3.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"9.00\", \"porcentaje\": null, \"item_codigo\": \"ADI010\", \"item_nombre\": \"EDAPLAN 918\", \"item_general_id\": \"97\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"59.00\", \"porcentaje\": null, \"item_codigo\": \"PEN081\", \"item_nombre\": \"POW CARBON BLACK CHEMO\", \"item_general_id\": \"71\"}, {\"cantidad\": \"150.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 / VARSOL\", \"item_general_id\": \"83\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(23,23,1,'PREPARACION PASTA ESMALTE ROJO CARMIN 57:1',NULL,'[{\"cantidad\": \"55.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"0.25\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"2.80\", \"porcentaje\": null, \"item_codigo\": \"ADI011\", \"item_nombre\": \"CHEMOSPERSE 77\", \"item_general_id\": \"85\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"24.00\", \"porcentaje\": null, \"item_codigo\": \"PER031\", \"item_nombre\": \"PIGMENTO ROJO CARMIN 57:1\", \"item_general_id\": \"72\"}, {\"cantidad\": \"34.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(24,24,1,'PREPARACION PASTA ESMALTE NARANJA',NULL,'[{\"cantidad\": \"332.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"9.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"3.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"ADI011\", \"item_nombre\": \"CHEMOSPERSE 77\", \"item_general_id\": \"85\"}, {\"cantidad\": \"18.90\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"408.00\", \"porcentaje\": null, \"item_codigo\": \"PEN023\", \"item_nombre\": \"PIGMENTO NARANJA MOLIBDENO\", \"item_general_id\": \"73\"}, {\"cantidad\": \"150.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(25,25,1,'PREPARACION PASTA ESMALTE AMARILLO',NULL,'[{\"cantidad\": \"332.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"9.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"3.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"18.90\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"465.00\", \"porcentaje\": null, \"item_codigo\": \"PEA011\", \"item_nombre\": \"PIGMENTO MARILLO DE CROMO AL 73\", \"item_general_id\": \"74\"}, {\"cantidad\": \"150.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"ADI010\", \"item_nombre\": \"EDAPLAN 915\", \"item_general_id\": \"84\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(26,26,1,'PREPARACION PASTA ESMALTE CAOBA',NULL,'[{\"cantidad\": \"295.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"3.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"ADI010\", \"item_nombre\": \"EDAPLAN 918\", \"item_general_id\": \"97\"}, {\"cantidad\": \"18.90\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"340.00\", \"porcentaje\": null, \"item_codigo\": \"PEC081\", \"item_nombre\": \"PIGMENTO OXIFERR CAOBA MARRON M 4781\", \"item_general_id\": \"75\"}, {\"cantidad\": \"173.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(27,27,1,'PREPARACION PASTA ESMALTE AMARILLO OXIDO',NULL,'[{\"cantidad\": \"295.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"3.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"18.90\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"340.00\", \"porcentaje\": null, \"item_codigo\": \"PEA013\", \"item_nombre\": \"PIGMENTO OXIFERR AMARILLO Y-4011\", \"item_general_id\": \"76\"}, {\"cantidad\": \"150.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"ADI010\", \"item_nombre\": \"EDAPLAN 915\", \"item_general_id\": \"84\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(28,28,1,'PREPARACION PASTA ESMALTE ROJO OXIDO',NULL,'[{\"cantidad\": \"295.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SAM023\", \"item_nombre\": \"METANOL\", \"item_general_id\": \"80\"}, {\"cantidad\": \"3.10\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"17.00\", \"porcentaje\": null, \"item_codigo\": \"ADI010\", \"item_nombre\": \"EDAPLAN 918\", \"item_general_id\": \"97\"}, {\"cantidad\": \"18.90\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"340.00\", \"porcentaje\": null, \"item_codigo\": \"PER030\", \"item_nombre\": \"PIGMENTO OXIFERR ROJO R-5530\", \"item_general_id\": \"100\"}, {\"cantidad\": \"150.00\", \"porcentaje\": null, \"item_codigo\": \"SAA011\", \"item_nombre\": \"DISOLVENTE 2232 #3\", \"item_general_id\": \"36\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(29,29,1,'PREPARACION PASTA ESMALTE BLANCO',NULL,'[{\"cantidad\": \"213.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"22.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"ADI002\", \"item_nombre\": \"TROYSPERSE CD1\", \"item_general_id\": \"66\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}, {\"cantidad\": \"441.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"63.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(30,30,1,'PREPARACION PASTA ESMALTE TABACO',NULL,'[{\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"ADIMON 84\", \"item_general_id\": \"86\"}, {\"cantidad\": \"185.00\", \"porcentaje\": null, \"item_codigo\": \"PET080\", \"item_nombre\": \"OXIFER TABACO R-4370\", \"item_general_id\": \"78\"}, {\"cantidad\": \"134.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"ADI002\", \"item_nombre\": \"TROYSPERSE CD1\", \"item_general_id\": \"66\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"AAS005\", \"item_nombre\": \"BENTOCLAY BP 184\", \"item_general_id\": \"39\"}, {\"cantidad\": \"7.00\", \"porcentaje\": null, \"item_codigo\": \"AHU002\", \"item_nombre\": \"LECITINA DE SOYA\", \"item_general_id\": \"61\"}, {\"cantidad\": \"33.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SAA022\", \"item_nombre\": \"ETANOL AL 96%\", \"item_general_id\": \"40\"}]','Versión inicial (backfill automático)','sistema','2026-05-13 16:48:39'),(31,1,2,'PREPARACIÓN BARNIZ TRANSPARENTE BIRILLANTE',NULL,'[{\"cantidad\": \"115.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"66.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(32,2,2,'PREPARACION ESMALTE BLANCO',NULL,'[{\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.28\", \"porcentaje\": null, \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"0.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"0.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.35\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(33,5,2,'PREPARACIÓN ESMALTE ROJO FIESTA',NULL,'[{\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"18.00\", \"porcentaje\": null, \"item_codigo\": \"PAS023\", \"item_nombre\": \"PASTA ESMALTE ROJO CARMIN 57:1\", \"item_general_id\": \"23\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"METIL ETIL CETOXIMA\", \"item_general_id\": \"32\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(34,11,2,'PREPARACION ESMALTE AMARILLO',NULL,'[{\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"16.00\", \"porcentaje\": null, \"item_codigo\": \"PEA011\", \"item_nombre\": \"PIGMENTO MARILLO DE CROMO AL 73\", \"item_general_id\": \"74\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.75\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(35,14,2,'PREPARACION ANTICORROSIVO GRIS',NULL,'[{\"cantidad\": \"160.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"120.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"65.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(36,15,2,'PREPARACION ANTICORROSIVO NEGRO',NULL,'[{\"cantidad\": \"210.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"130.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"38.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"45.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(37,18,2,'PREPARACION ANTICORROSIVO BLANCO',NULL,'[{\"cantidad\": \"160.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"55.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"52.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(38,19,2,'PREPARACION ANTICORROSIVO VERDE',NULL,'[{\"cantidad\": \"95.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.30\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"66.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"33.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','Reemplazo de ingredientes via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(39,31,1,'FORMULACION VINILO T1 BLANCO',NULL,'[{\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"MP-246\", \"item_nombre\": \"TPF\", \"item_general_id\": \"246\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"MP-247\", \"item_nombre\": \"NONIL TERGITOL\", \"item_general_id\": \"247\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"MP-250\", \"item_nombre\": \"DIETILEN GLICOL\", \"item_general_id\": \"250\"}, {\"cantidad\": \"95.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"200.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"80.00\", \"porcentaje\": null, \"item_codigo\": \"MP-253\", \"item_nombre\": \"CAOLIN\", \"item_general_id\": \"253\"}, {\"cantidad\": \"80.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"MP-254\", \"item_nombre\": \"TEXANOL\", \"item_general_id\": \"254\"}, {\"cantidad\": \"170.00\", \"porcentaje\": null, \"item_codigo\": \"MP-255\", \"item_nombre\": \"ACRONAL\", \"item_general_id\": \"255\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-256\", \"item_nombre\": \"BACTERICIDA\", \"item_general_id\": \"256\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"127.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-257\", \"item_nombre\": \"AMONIACO\", \"item_general_id\": \"257\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"MP-258\", \"item_nombre\": \"HISOL ASOCIATIVO\", \"item_general_id\": \"258\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-259\", \"item_nombre\": \"FUNGICIDA\", \"item_general_id\": \"259\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"MP-260\", \"item_nombre\": \"ACEITE DE PINO\", \"item_general_id\": \"260\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(40,32,1,'FORMULACION EPOXICA TRANSPARENTE',NULL,'[{\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"VAR001\", \"item_nombre\": \"UFI PRETHOX\", \"item_general_id\": \"142\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"MP-269\", \"item_nombre\": \"ACETATO N-PROPILO\", \"item_general_id\": \"269\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(41,33,1,'FORMULACION VINILO BLANCO TIPO 2',NULL,'[{\"cantidad\": \"0.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"MP-246\", \"item_nombre\": \"TPF\", \"item_general_id\": \"246\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"2.60\", \"porcentaje\": null, \"item_codigo\": \"MP-247\", \"item_nombre\": \"NONIL TERGITOL\", \"item_general_id\": \"247\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"MP-250\", \"item_nombre\": \"DIETILEN GLICOL\", \"item_general_id\": \"250\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"MP-254\", \"item_nombre\": \"TEXANOL\", \"item_general_id\": \"254\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"400.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"MP-253\", \"item_nombre\": \"CAOLIN\", \"item_general_id\": \"253\"}, {\"cantidad\": \"80.00\", \"porcentaje\": null, \"item_codigo\": \"MP-255\", \"item_nombre\": \"ACRONAL\", \"item_general_id\": \"255\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-257\", \"item_nombre\": \"AMONIACO\", \"item_general_id\": \"257\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-256\", \"item_nombre\": \"BACTERICIDA\", \"item_general_id\": \"256\"}, {\"cantidad\": \"3.30\", \"porcentaje\": null, \"item_codigo\": \"MP-258\", \"item_nombre\": \"HISOL ASOCIATIVO\", \"item_general_id\": \"258\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"MP-260\", \"item_nombre\": \"ACEITE DE PINO\", \"item_general_id\": \"260\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(42,34,1,'FORMULACION VINILO BLANCO TIPO 3',NULL,'[{\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.40\", \"porcentaje\": null, \"item_codigo\": \"MP-246\", \"item_nombre\": \"TPF\", \"item_general_id\": \"246\"}, {\"cantidad\": \"2.20\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-247\", \"item_nombre\": \"NONIL TERGITOL\", \"item_general_id\": \"247\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"425.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"MP-253\", \"item_nombre\": \"CAOLIN\", \"item_general_id\": \"253\"}, {\"cantidad\": \"36.00\", \"porcentaje\": null, \"item_codigo\": \"MP-250\", \"item_nombre\": \"DIETILEN GLICOL\", \"item_general_id\": \"250\"}, {\"cantidad\": \"2.40\", \"porcentaje\": null, \"item_codigo\": \"MP-255\", \"item_nombre\": \"ACRONAL\", \"item_general_id\": \"255\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-256\", \"item_nombre\": \"BACTERICIDA\", \"item_general_id\": \"256\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-257\", \"item_nombre\": \"AMONIACO\", \"item_general_id\": \"257\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-258\", \"item_nombre\": \"HISOL ASOCIATIVO\", \"item_general_id\": \"258\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"MP-260\", \"item_nombre\": \"ACEITE DE PINO\", \"item_general_id\": \"260\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(43,35,1,'FORMULACION ESMALTE AZUL REAL',NULL,'[{\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"130.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"METIL ETIL CETOXIMA\", \"item_general_id\": \"32\"}, {\"cantidad\": \"0.30\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(44,36,1,'FORMULACION LACA CATALIZADA BRILLANTE',NULL,'[{\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"RES004\", \"item_nombre\": \"RESINA CORTA R4\", \"item_general_id\": \"162\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"VAR001\", \"item_nombre\": \"UFI PRETHOX\", \"item_general_id\": \"142\"}, {\"cantidad\": \"55.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"12.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"0.30\", \"porcentaje\": null, \"item_codigo\": \"MP-262\", \"item_nombre\": \"TROYSSOL 366\", \"item_general_id\": \"262\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(45,37,1,'FORMULACION PASTA OCRE PARA VINILO',NULL,'[{\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-247\", \"item_nombre\": \"NONIL TERGITOL\", \"item_general_id\": \"247\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"MP-246\", \"item_nombre\": \"TPF\", \"item_general_id\": \"246\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"MP-256\", \"item_nombre\": \"BACTERICIDA\", \"item_general_id\": \"256\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"MP-250\", \"item_nombre\": \"DIETILEN GLICOL\", \"item_general_id\": \"250\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"0.30\", \"porcentaje\": null, \"item_codigo\": \"MP-258\", \"item_nombre\": \"HISOL ASOCIATIVO\", \"item_general_id\": \"258\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(46,38,1,'FORMULACION VINILO OCRE T1',NULL,'[{\"cantidad\": \"80.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"0.70\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"MP-247\", \"item_nombre\": \"NONIL TERGITOL\", \"item_general_id\": \"247\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"MP-246\", \"item_nombre\": \"TPF\", \"item_general_id\": \"246\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"18.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"MP-255\", \"item_nombre\": \"ACRONAL\", \"item_general_id\": \"255\"}, {\"cantidad\": \"2.10\", \"porcentaje\": null, \"item_codigo\": \"MP-250\", \"item_nombre\": \"DIETILEN GLICOL\", \"item_general_id\": \"250\"}, {\"cantidad\": \"0.70\", \"porcentaje\": null, \"item_codigo\": \"MP-254\", \"item_nombre\": \"TEXANOL\", \"item_general_id\": \"254\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"MP-256\", \"item_nombre\": \"BACTERICIDA\", \"item_general_id\": \"256\"}, {\"cantidad\": \"0.90\", \"porcentaje\": null, \"item_codigo\": \"MP-257\", \"item_nombre\": \"AMONIACO\", \"item_general_id\": \"257\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"MP-248\", \"item_nombre\": \"MECELLOSE\", \"item_general_id\": \"248\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"MP-260\", \"item_nombre\": \"ACEITE DE PINO\", \"item_general_id\": \"260\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"MP-249\", \"item_nombre\": \"ANTIESPUMANTE\", \"item_general_id\": \"249\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"MP-258\", \"item_nombre\": \"HISOL ASOCIATIVO\", \"item_general_id\": \"258\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(47,39,1,'FORMULACION ESMALTE AMARILLO CATERPILLAR',NULL,'[{\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"22.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(48,40,1,'FORMULACION ESMALTE NEGRO',NULL,'[{\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"24.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"AAN002\", \"item_nombre\": \"METIL ETIL CETOXIMA\", \"item_general_id\": \"32\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(49,41,1,'FORMULACION ESMALTE BLANCO T1',NULL,'[{\"cantidad\": \"180.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.28\", \"porcentaje\": null, \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"200.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"185.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"3.50\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.80\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(50,42,1,'FORMULACION ESMALTE BLANCO 4X1',NULL,'[{\"cantidad\": \"80.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.90\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.85\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}, {\"cantidad\": \"0.10\", \"porcentaje\": null, \"item_codigo\": \"PHI011\", \"item_nombre\": \"PASTA VIOLETA\", \"item_general_id\": \"204\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(51,43,1,'FORMULACION ESMALTE BLANCO ECONOMICO JJ',NULL,'[{\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.70\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.09\", \"porcentaje\": null, \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"9.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.90\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"6.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"0.30\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"11.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"17.50\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"0.25\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.35\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.25\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(52,44,1,'FORMULACION ESMALTE ECONOMICO BLANCO JH',NULL,'[{\"cantidad\": \"46.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.09\", \"porcentaje\": null, \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"10.20\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"7.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"16.00\", \"porcentaje\": null, \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"7.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"0.32\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(53,45,1,'FORMULACION ESMALTE DORADO',NULL,'[{\"cantidad\": \"105.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"39.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"1.40\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"6.40\", \"porcentaje\": null, \"item_codigo\": \"MP-263\", \"item_nombre\": \"POLVO PERLADO VERDOSO\", \"item_general_id\": \"263\"}, {\"cantidad\": \"1.60\", \"porcentaje\": null, \"item_codigo\": \"MP-264\", \"item_nombre\": \"POLVO PERLADO RICO EN ORO\", \"item_general_id\": \"264\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(54,46,1,'FORMULACION ANTICORROSIVO CROMATO ZN',NULL,'[{\"cantidad\": \"35.00\", \"porcentaje\": null, \"item_codigo\": \"MP-265\", \"item_nombre\": \"RESINA 000\", \"item_general_id\": \"265\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"6.50\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"MP-267\", \"item_nombre\": \"PIGMENTO CROMATO DE ZINC\", \"item_general_id\": \"267\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"38.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"38.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"MP-266\", \"item_nombre\": \"RESINA MALEICA AL 60%\", \"item_general_id\": \"266\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"MP-265\", \"item_nombre\": \"RESINA 000\", \"item_general_id\": \"265\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.60\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(55,47,1,'FORMULACION ESMALTE DE ALUMINIO',NULL,'[{\"cantidad\": \"210.00\", \"porcentaje\": null, \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"1.40\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.75\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"2.90\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"28.00\", \"porcentaje\": null, \"item_codigo\": \"MP-268\", \"item_nombre\": \"PIGMENTO ALUMINIO 22 NL\", \"item_general_id\": \"268\"}, {\"cantidad\": \"69.00\", \"porcentaje\": null, \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"2.60\", \"porcentaje\": null, \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(56,48,1,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"120.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"78.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"150.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"25.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"4.50\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"18.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(57,49,1,'FORMULACION EPOXICA NEGRA',NULL,'[{\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"1.30\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"80.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"32.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"9.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"7.60\", \"porcentaje\": null, \"item_codigo\": \"VAR001\", \"item_nombre\": \"UFI PRETHOX\", \"item_general_id\": \"142\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"MP-269\", \"item_nombre\": \"ACETATO N-PROPILO\", \"item_general_id\": \"269\"}, {\"cantidad\": \"14.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(58,50,1,'FORMULACION EPOXICA GRIS',NULL,'[{\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"68.00\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"165.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"2.40\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"60.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"VAR001\", \"item_nombre\": \"UFI PRETHOX\", \"item_general_id\": \"142\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"MP-269\", \"item_nombre\": \"ACETATO N-PROPILO\", \"item_general_id\": \"269\"}, {\"cantidad\": \"30.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(59,51,1,'FORMULACION EPOXICA NEGRA RESINA 100%',NULL,'[{\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"MP-274\", \"item_nombre\": \"RESINA EPOXICA 100%\", \"item_general_id\": \"274\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"1.80\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"2.20\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"70.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-269\", \"item_nombre\": \"ACETATO N-PROPILO\", \"item_general_id\": \"269\"}, {\"cantidad\": \"1.00\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"32.00\", \"porcentaje\": null, \"item_codigo\": \"PAS022\", \"item_nombre\": \"PASTA ESMALTE NEGRO\", \"item_general_id\": \"22\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(60,52,1,'FORMULACION EPOXICA POLIAMIDA VERDE',NULL,'[{\"cantidad\": \"76.30\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"1.40\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"3.80\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"16.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"10.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"17.50\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"26.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"1.90\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(61,53,1,'FORMULACION EPOXICA AZUL',NULL,'[{\"cantidad\": \"13.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"0.25\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.75\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"12.00\", \"porcentaje\": null, \"item_codigo\": \"PE1021\", \"item_nombre\": \"PASTA ESMALTE AZUL FTALO 15:3\", \"item_general_id\": \"56\"}, {\"cantidad\": \"22.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"VAR001\", \"item_nombre\": \"UFI PRETHOX\", \"item_general_id\": \"142\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"3.50\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"0.05\", \"porcentaje\": null, \"item_codigo\": \"MP-271\", \"item_nombre\": \"BYK 066N NIVELANTE\", \"item_general_id\": \"271\"}, {\"cantidad\": \"0.23\", \"porcentaje\": null, \"item_codigo\": \"MP-272\", \"item_nombre\": \"BYK 108 ANTIESPUMANTE\", \"item_general_id\": \"272\"}, {\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(62,54,1,'FORMULACION EPOXICA ROJO OXIDO',NULL,'[{\"cantidad\": \"120.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"MP-272\", \"item_nombre\": \"BYK 108 ANTIESPUMANTE\", \"item_general_id\": \"272\"}, {\"cantidad\": \"2.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"22.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"PER030\", \"item_nombre\": \"OXIDO DE HIERRO ROJO R-5530\", \"item_general_id\": \"64\"}, {\"cantidad\": \"2.00\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"100.00\", \"porcentaje\": null, \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"50.00\", \"porcentaje\": null, \"item_codigo\": \"MP-251\", \"item_nombre\": \"CARBONATO DE CALCIO\", \"item_general_id\": \"251\"}, {\"cantidad\": \"40.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"28.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"16.00\", \"porcentaje\": null, \"item_codigo\": \"MP-269\", \"item_nombre\": \"ACETATO N-PROPILO\", \"item_general_id\": \"269\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(63,55,1,'FORMULACION ESM EPOXI SILICATO BLANCO',NULL,'[{\"cantidad\": \"5.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"0.25\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"2.90\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"11.30\", \"porcentaje\": null, \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(64,56,1,'FORMULACION ESM EPOXI SILICATO VERDE',NULL,'[{\"cantidad\": \"4.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"0.16\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.40\", \"porcentaje\": null, \"item_codigo\": \"MP-273\", \"item_nombre\": \"PIGMENTO VERDE OXIDO CROMO\", \"item_general_id\": \"273\"}, {\"cantidad\": \"0.20\", \"porcentaje\": null, \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.20\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"0.80\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"9.20\", \"porcentaje\": null, \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(65,57,1,'FORMULACION ESMALTE EPOXICO AMARILLO',NULL,'[{\"cantidad\": \"55.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"20.00\", \"porcentaje\": null, \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"1.50\", \"porcentaje\": null, \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"cantidad\": \"28.00\", \"porcentaje\": null, \"item_codigo\": \"PEA011\", \"item_nombre\": \"PIGMENTO MARILLO DE CROMO AL 73\", \"item_general_id\": \"74\"}, {\"cantidad\": \"34.00\", \"porcentaje\": null, \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"3.00\", \"porcentaje\": null, \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"cantidad\": \"15.00\", \"porcentaje\": null, \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"8.00\", \"porcentaje\": null, \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"0.50\", \"porcentaje\": null, \"item_codigo\": \"MP-262\", \"item_nombre\": \"TROYSSOL 366\", \"item_general_id\": \"262\"}]','VersiÃ³n inicial via fase3_formulaciones.sql (2026-05-13)','sistema','2026-05-13 20:43:51'),(76,48,2,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"10.00\", \"porcentaje\": \"0\", \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}, {\"cantidad\": \"10.00\", \"porcentaje\": \"0\", \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"120.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"40.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"1.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}]','Edición de formulación','root','2026-05-30 20:15:36'),(77,48,3,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"10.00\", \"porcentaje\": \"0\", \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"120.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"40.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"1.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Edición de formulación','root','2026-05-30 20:16:22'),(78,48,4,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"10.00\", \"porcentaje\": \"0\", \"item_codigo\": \"VAR009\", \"item_nombre\": \"ETHYL SILICATO\", \"item_general_id\": \"161\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"120.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"40.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"1.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Edición de formulación','root','2026-05-30 20:16:51'),(79,48,5,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"40.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"1.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Edición de formulación','root','2026-05-30 20:20:01'),(80,48,6,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"40.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"1.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"DISPERSANTE BASE SOLVENTE\", \"item_general_id\": \"338\"}]','Edición de formulación','root','2026-05-30 20:23:48'),(81,48,7,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"DISPERSANTE BASE SOLVENTE\", \"item_general_id\": \"338\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"160.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"1.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Edición de formulación','root','2026-05-30 20:39:18'),(82,48,8,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"DISPERSANTE BASE SOLVENTE\", \"item_general_id\": \"338\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"160.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"10.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"25.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Edición de formulación','root','2026-05-30 20:41:26'),(83,48,9,'FORMULACION EPOXICA BLANCO',NULL,'[{\"cantidad\": \"4.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"BUTIL GLICOL\", \"item_general_id\": \"245\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"78.00\", \"porcentaje\": \"0\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"1.50\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"DISPERSANTE BASE SOLVENTE\", \"item_general_id\": \"338\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"18.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"CCC002\", \"item_nombre\": \"OMYACARB UF\", \"item_general_id\": \"57\"}, {\"cantidad\": \"160.00\", \"porcentaje\": \"0\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"cantidad\": \"150.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-252\", \"item_nombre\": \"TALCO TY 400\", \"item_general_id\": \"252\"}, {\"cantidad\": \"10.00\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"cantidad\": \"50.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Edición de formulación','root','2026-05-30 20:44:51'),(84,68,1,'PREPARACION CATALIZADOR EPOXICO',NULL,'[{\"cantidad\": \"60.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": \"ENDURECEDOR 100%\", \"item_general_id\": \"302\"}, {\"cantidad\": \"40.00\", \"porcentaje\": \"0\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}]','Versión inicial','root','2026-06-27 17:09:17'),(85,2,3,'PREPARACION ESMALTE BLANCO',NULL,'[{\"cantidad\": \"95.00\", \"porcentaje\": \"23\", \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.28\", \"porcentaje\": \"0\", \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"20.00\", \"porcentaje\": \"5\", \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"5.00\", \"porcentaje\": \"1\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"80.00\", \"porcentaje\": \"19\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"1\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.35\", \"porcentaje\": \"0\", \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}, {\"cantidad\": \"180.00\", \"porcentaje\": \"44\", \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"15.00\", \"porcentaje\": \"4\", \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Edición de formulación','root','2026-07-02 20:46:20'),(86,2,4,'PREPARACION ESMALTE BLANCO',NULL,'[{\"cantidad\": \"95.00\", \"porcentaje\": \"16\", \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.28\", \"porcentaje\": \"0\", \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"20.00\", \"porcentaje\": \"3\", \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"5.00\", \"porcentaje\": \"1\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"80.00\", \"porcentaje\": \"14\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"1\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.35\", \"porcentaje\": \"0\", \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}, {\"cantidad\": \"360.00\", \"porcentaje\": \"61\", \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"15.00\", \"porcentaje\": \"3\", \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Edición de formulación','root','2026-07-02 20:46:57'),(87,2,5,'PREPARACION ESMALTE BLANCO',NULL,'[{\"cantidad\": \"95.00\", \"porcentaje\": \"12\", \"item_codigo\": \"SIA040\", \"item_nombre\": \"AGUA\", \"item_general_id\": \"42\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"545124\", \"item_nombre\": \"ANTIPIEL\", \"item_general_id\": \"241\"}, {\"cantidad\": \"0.28\", \"porcentaje\": \"0\", \"item_codigo\": \"018273\", \"item_nombre\": \"AZUL ULTRAMAR\", \"item_general_id\": \"233\"}, {\"cantidad\": \"20.00\", \"porcentaje\": \"3\", \"item_codigo\": \"556115\", \"item_nombre\": \"CARBONATO UF\", \"item_general_id\": \"235\"}, {\"cantidad\": \"5.00\", \"porcentaje\": \"1\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"cantidad\": \"80.00\", \"porcentaje\": \"10\", \"item_codigo\": \"PED010\", \"item_nombre\": \"DIOXIDO DE TITANIO\", \"item_general_id\": \"37\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"AEM005\", \"item_nombre\": \"DISASTAB\", \"item_general_id\": \"41\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"cantidad\": \"3.00\", \"porcentaje\": \"0\", \"item_codigo\": \"521584\", \"item_nombre\": \"FOSFATO ZINC\", \"item_general_id\": \"236\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOC010\", \"item_nombre\": \"OCTOATO DE CALCIO AL 10%\", \"item_general_id\": \"35\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOC011\", \"item_nombre\": \"OCTOATO DE COBALTO AL 12%\", \"item_general_id\": \"33\"}, {\"cantidad\": \"2.00\", \"porcentaje\": \"0\", \"item_codigo\": \"SOZ024\", \"item_nombre\": \"OCTOATO DE ZIRCONIO AL 24%\", \"item_general_id\": \"34\"}, {\"cantidad\": \"0.35\", \"porcentaje\": \"0\", \"item_codigo\": \"545124\", \"item_nombre\": \"P-400\", \"item_general_id\": \"242\"}, {\"cantidad\": \"360.00\", \"porcentaje\": \"46\", \"item_codigo\": \"RAM014\", \"item_nombre\": \"RESINA MEDIA EN SOYA AL 50%\", \"item_general_id\": \"31\"}, {\"cantidad\": \"210.00\", \"porcentaje\": \"27\", \"item_codigo\": \"SAV010\", \"item_nombre\": \"VARSOL\", \"item_general_id\": \"44\"}]','Edición de formulación','root','2026-07-02 20:48:13'),(88,57,2,'FORMULACION ESMALTE EPOXICO AMARILLO',NULL,'[{\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"1\", \"texto\": null, \"cantidad\": \"55.00\", \"porcentaje\": \"33\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"2\", \"texto\": null, \"cantidad\": \"20.00\", \"porcentaje\": \"12\", \"item_codigo\": \"XIL21288\", \"item_nombre\": \"XILOL\", \"item_general_id\": \"225\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"3\", \"texto\": null, \"cantidad\": \"1.50\", \"porcentaje\": \"1\", \"item_codigo\": \"927163\", \"item_nombre\": \"CLEYTONE HY\", \"item_general_id\": \"232\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"4\", \"texto\": null, \"cantidad\": \"1.50\", \"porcentaje\": \"1\", \"item_codigo\": \"093816\", \"item_nombre\": \"DISPERSANTE\", \"item_general_id\": \"231\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"5\", \"texto\": null, \"cantidad\": \"0.50\", \"porcentaje\": \"0\", \"item_codigo\": \"PEA010\", \"item_nombre\": \"OXIDO DE HIERRO AMARILLO Y 4021\", \"item_general_id\": \"63\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"6\", \"texto\": null, \"cantidad\": \"28.00\", \"porcentaje\": \"17\", \"item_codigo\": \"PEA011\", \"item_nombre\": \"PIGMENTO MARILLO DE CROMO AL 73\", \"item_general_id\": \"74\"}, {\"nota\": null, \"tipo\": \"instruccion\", \"orden\": \"7\", \"texto\": \"Dispersar hasta molienda 7 U Hegman y agregar\", \"cantidad\": \"0.00\", \"porcentaje\": \"0\", \"item_codigo\": null, \"item_nombre\": null, \"item_general_id\": null}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"8\", \"texto\": null, \"cantidad\": \"34.00\", \"porcentaje\": \"20\", \"item_codigo\": \"NPSN CHINA\", \"item_nombre\": \"RESINA EPOXICA\", \"item_general_id\": \"226\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"9\", \"texto\": null, \"cantidad\": \"3.00\", \"porcentaje\": \"2\", \"item_codigo\": \"MP-261\", \"item_nombre\": \"BUTIL CELLOSOLVE\", \"item_general_id\": \"261\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"10\", \"texto\": null, \"cantidad\": \"15.00\", \"porcentaje\": \"9\", \"item_codigo\": null, \"item_nombre\": \"ISOBUTANOL\", \"item_general_id\": \"244\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"11\", \"texto\": null, \"cantidad\": \"8.00\", \"porcentaje\": \"5\", \"item_codigo\": \"MP-270\", \"item_nombre\": \"UREA FORMAL\", \"item_general_id\": \"270\"}, {\"nota\": null, \"tipo\": \"ingrediente\", \"orden\": \"12\", \"texto\": null, \"cantidad\": \"0.50\", \"porcentaje\": \"0\", \"item_codigo\": \"MP-271\", \"item_nombre\": \"BYK 066N NIVELANTE\", \"item_general_id\": \"271\"}]','Edición de formulación','root','2026-07-04 15:26:34');
/*!40000 ALTER TABLE `formulaciones_versiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gestiones_cobro`
--

DROP TABLE IF EXISTS `gestiones_cobro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gestiones_cobro` (
  `id_gestion` int NOT NULL AUTO_INCREMENT,
  `facturas_id` int NOT NULL,
  `clientes_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `tipo` enum('llamada','email','visita','whatsapp') NOT NULL,
  `resultado` varchar(255) DEFAULT NULL,
  `proxima_gestion` date DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_gestion`),
  KEY `fk_gestiones_factura` (`facturas_id`),
  KEY `fk_gestiones_cliente` (`clientes_id`),
  KEY `fk_gestiones_usuario` (`usuario_id`),
  CONSTRAINT `fk_gestiones_cliente` FOREIGN KEY (`clientes_id`) REFERENCES `clientes` (`id_clientes`) ON DELETE CASCADE,
  CONSTRAINT `fk_gestiones_factura` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`) ON DELETE CASCADE,
  CONSTRAINT `fk_gestiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gestiones_cobro`
--

LOCK TABLES `gestiones_cobro` WRITE;
/*!40000 ALTER TABLE `gestiones_cobro` DISABLE KEYS */;
INSERT INTO `gestiones_cobro` VALUES (1,1,1,NULL,'llamada','No contestó. Se dejó mensaje de voz.','2026-01-10','2026-03-19 14:38:34'),(2,1,1,NULL,'whatsapp','Prometió pagar la próxima semana.','2026-01-20','2026-03-19 14:38:34'),(3,1,1,NULL,'llamada','No cumplió. Nuevo compromiso para el 25.','2026-01-25','2026-03-19 14:38:34'),(4,1,1,NULL,'visita','No estaba el encargado. Se dejó comunicado.','2026-02-01','2026-03-19 14:38:34');
/*!40000 ALTER TABLE `gestiones_cobro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_precios`
--

DROP TABLE IF EXISTS `historial_precios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_precios` (
  `id_historial` int unsigned NOT NULL AUTO_INCREMENT,
  `item_proveedor_id` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `precio_con_iva` decimal(10,2) DEFAULT NULL,
  `fecha` date NOT NULL,
  `observacion` varchar(100) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `item_proveedor_id` (`item_proveedor_id`),
  CONSTRAINT `historial_precios_ibfk_1` FOREIGN KEY (`item_proveedor_id`) REFERENCES `item_proveedor` (`id_item_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_precios`
--

LOCK TABLES `historial_precios` WRITE;
/*!40000 ALTER TABLE `historial_precios` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_precios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instalaciones`
--

DROP TABLE IF EXISTS `instalaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instalaciones` (
  `id_instalaciones` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ciudad` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefono` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_empresa` int NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_instalaciones`),
  KEY `fk_instalaciones_empresa_idx` (`id_empresa`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_instalaciones_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instalaciones`
--

LOCK TABLES `instalaciones` WRITE;
/*!40000 ALTER TABLE `instalaciones` DISABLE KEYS */;
INSERT INTO `instalaciones` VALUES (1,'Sede Cordialidad','SEDE DE FABRICACIÓN DE PINTURAS',' BARRANQUILLA','Calle 99 # 6-59','3019794729',1,NULL),(2,'Sede Villa Olimpica','SEDE DE FABRICACIÓN DE PINTURAS','Galapa','','3019794729',1,NULL),(3,'Sede Juan Mina','SEDE DE FABRICACIÓN DE PINTURAS','Barranquilla','','3019794729',1,NULL);
/*!40000 ALTER TABLE `instalaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario` (
  `id_inventario` int NOT NULL AUTO_INCREMENT,
  `cantidad` decimal(5,2) DEFAULT NULL,
  `fecha_update` date DEFAULT NULL,
  `apartada` tinyint DEFAULT NULL,
  `item_general_id` int NOT NULL,
  `estado` tinyint DEFAULT NULL COMMENT '0 disponible\\r\\n1 No disponible',
  `movimiento_inventario_id` int DEFAULT NULL,
  `tipo` tinyint DEFAULT NULL COMMENT '1 ingreso\n2 egreso',
  `bodegas_id` int NOT NULL,
  PRIMARY KEY (`id_inventario`),
  KEY `fk_inventario_item_general1_idx` (`item_general_id`),
  KEY `fk_inventario_movimientos_inventario1_idx` (`movimiento_inventario_id`),
  KEY `fk_inventario_bodega` (`bodegas_id`),
  CONSTRAINT `fk_inventario_bodega` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`),
  CONSTRAINT `fk_inventario_item_general1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_inventario_movimientos_inventario1` FOREIGN KEY (`movimiento_inventario_id`) REFERENCES `movimiento_inventario` (`id_movimiento_inventario`)
) ENGINE=InnoDB AUTO_INCREMENT=361 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario`
--

LOCK TABLES `inventario` WRITE;
/*!40000 ALTER TABLE `inventario` DISABLE KEYS */;
INSERT INTO `inventario` VALUES (162,2.00,'2026-04-17',0,134,0,NULL,1,2),(163,1.00,'2026-04-17',0,135,0,NULL,1,2),(164,1.00,'2026-04-17',0,136,0,NULL,1,2),(165,1.00,'2026-04-17',0,137,0,NULL,1,2),(166,1.00,'2026-04-17',0,138,0,NULL,1,2),(167,1.00,'2026-04-17',0,139,0,NULL,1,2),(168,1.00,'2026-04-17',0,140,0,NULL,1,2),(169,1.00,'2026-04-17',0,141,0,NULL,1,2),(170,6.00,'2026-04-17',0,194,0,NULL,1,2),(171,9.00,'2026-05-16',0,142,0,NULL,1,2),(172,2.00,'2026-04-17',0,143,0,NULL,1,18),(173,1.00,'2026-04-17',0,144,0,NULL,1,18),(174,1.00,'2026-04-17',0,145,0,NULL,1,18),(175,1.00,'2026-04-17',0,146,0,NULL,1,18),(176,1.00,'2026-04-17',0,147,0,NULL,1,18),(177,1.00,'2026-04-17',0,189,0,NULL,1,18),(178,0.00,'2026-04-17',0,148,0,NULL,1,18),(179,1.00,'2026-04-17',0,149,0,NULL,1,18),(180,1.00,'2026-04-17',0,150,0,NULL,1,18),(181,1.00,'2026-04-17',0,151,0,NULL,1,18),(182,1.00,'2026-04-17',0,152,0,NULL,1,18),(183,2.00,'2026-04-17',0,134,0,NULL,1,18),(184,1.00,'2026-04-17',0,153,0,NULL,1,18),(185,0.00,'2026-04-17',0,154,0,NULL,1,18),(186,0.00,'2026-04-17',0,155,0,NULL,1,18),(187,4.00,'2026-04-17',0,156,0,NULL,1,18),(188,1.00,'2026-04-17',0,157,0,NULL,1,18),(189,1.00,'2026-04-17',0,158,0,NULL,1,18),(190,1.00,'2026-04-17',0,159,0,NULL,1,18),(191,1.00,'2026-04-17',0,160,0,NULL,1,18),(192,3.00,'2026-04-17',0,161,0,NULL,1,18),(193,1.00,'2026-04-17',0,190,0,NULL,1,18),(194,1.00,'2026-04-17',0,191,0,NULL,1,18),(195,2.00,'2026-04-17',0,162,0,NULL,1,18),(196,4.00,'2026-04-17',0,163,0,NULL,1,18),(197,1.00,'2026-04-17',0,219,0,NULL,1,18),(198,3.00,'2026-04-17',0,164,0,NULL,1,18),(199,1.00,'2026-04-17',0,192,0,NULL,1,18),(200,1.00,'2026-04-17',0,165,0,NULL,1,18),(201,1.00,'2026-04-17',0,166,0,NULL,1,18),(202,6.00,'2026-04-17',0,167,0,NULL,1,18),(203,6.00,'2026-04-17',0,168,0,NULL,1,18),(204,1.00,'2026-04-17',0,169,0,NULL,1,18),(205,0.00,'2026-04-17',0,170,0,NULL,1,18),(206,2.00,'2026-04-17',0,171,0,NULL,1,18),(207,1.00,'2026-04-17',0,172,0,NULL,1,18),(208,1.00,'2026-04-17',0,173,0,NULL,1,18),(209,1.00,'2026-04-17',0,136,0,NULL,1,18),(210,1.00,'2026-04-17',0,174,0,NULL,1,18),(211,1.00,'2026-04-17',0,175,0,NULL,1,18),(212,0.00,'2026-04-17',0,176,0,NULL,1,18),(213,2.00,'2026-04-17',0,177,0,NULL,1,18),(214,0.00,'2026-04-17',0,193,0,NULL,1,18),(215,2.00,'2026-04-17',0,178,0,NULL,1,18),(216,1.00,'2026-04-17',0,179,0,NULL,1,18),(217,1.00,'2026-04-17',0,180,0,NULL,1,18),(218,1.00,'2026-04-17',0,181,0,NULL,1,18),(219,1.00,'2026-04-17',0,182,0,NULL,1,18),(220,0.00,'2026-04-17',0,183,0,NULL,1,18),(221,3.00,'2026-04-17',0,184,0,NULL,1,18),(222,0.00,'2026-04-17',0,185,0,NULL,1,18),(223,2.00,'2026-04-17',0,186,0,NULL,1,18),(224,1.00,'2026-04-17',0,187,0,NULL,1,18),(225,0.00,'2026-04-17',0,188,0,NULL,1,18),(226,4.00,'2026-04-17',0,162,0,NULL,1,19),(227,1.00,'2026-04-17',0,195,0,NULL,1,19),(228,2.00,'2026-04-17',0,196,0,NULL,1,19),(229,1.00,'2026-04-17',0,197,0,NULL,1,19),(230,1.00,'2026-04-17',0,150,0,NULL,1,19),(231,2.00,'2026-04-17',0,172,0,NULL,1,19),(232,1.00,'2026-04-17',0,198,0,NULL,1,19),(233,1.00,'2026-04-17',0,199,0,NULL,1,19),(234,1.00,'2026-04-17',0,200,0,NULL,1,19),(235,1.00,'2026-04-17',0,201,0,NULL,1,19),(236,1.00,'2026-04-17',0,202,0,NULL,1,19),(237,3.00,'2026-04-17',0,203,0,NULL,1,19),(238,0.00,'2026-04-17',0,204,0,NULL,1,19),(239,0.00,'2026-04-17',0,171,0,NULL,1,19),(240,1.00,'2026-04-17',0,213,0,NULL,1,19),(241,4.00,'2026-04-17',0,205,0,NULL,1,19),(242,4.00,'2026-04-17',0,206,0,NULL,1,19),(243,3.00,'2026-04-17',0,207,0,NULL,1,19),(244,4.00,'2026-04-17',0,208,0,NULL,1,19),(245,1.00,'2026-04-17',0,209,0,NULL,1,19),(246,6.00,'2026-04-17',0,210,0,NULL,1,19),(247,1.00,'2026-04-17',0,211,0,NULL,1,19),(248,8.00,'2026-04-17',0,212,0,NULL,1,19),(249,31.00,'2026-08-10',0,161,0,NULL,1,21),(250,7.00,'2026-04-17',0,214,0,NULL,1,21),(251,4.00,'2026-04-17',0,215,0,NULL,1,21),(252,1.00,'2026-04-17',0,216,0,NULL,1,21),(253,4.00,'2026-04-17',0,217,0,NULL,1,21),(254,7.00,'2026-04-17',0,137,0,NULL,1,21),(255,113.00,'2026-04-17',0,180,0,NULL,1,21),(256,7.00,'2026-04-17',0,218,0,NULL,1,21),(257,2.00,'2026-04-17',0,219,0,NULL,1,21),(258,1.00,'2026-04-17',0,220,0,NULL,1,21),(259,1.00,'2026-04-17',0,221,0,NULL,1,21),(260,1.00,'2026-04-17',0,222,0,NULL,1,21),(285,0.00,'2026-06-27',0,354,1,NULL,1,1);
/*!40000 ALTER TABLE `inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario_capas`
--

DROP TABLE IF EXISTS `inventario_capas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario_capas` (
  `id_capa` int NOT NULL AUTO_INCREMENT,
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
  `estado` tinyint DEFAULT '1' COMMENT '1=activa, 0=agotada',
  PRIMARY KEY (`id_capa`),
  KEY `idx_item_bodega` (`item_general_id`,`bodegas_id`,`estado`),
  KEY `idx_proveedor` (`proveedor_id`),
  KEY `idx_fecha` (`fecha_ingreso`),
  KEY `bodegas_id` (`bodegas_id`),
  CONSTRAINT `inventario_capas_ibfk_1` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`),
  CONSTRAINT `inventario_capas_ibfk_2` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`),
  CONSTRAINT `inventario_capas_ibfk_3` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario_capas`
--

LOCK TABLES `inventario_capas` WRITE;
/*!40000 ALTER TABLE `inventario_capas` DISABLE KEYS */;
INSERT INTO `inventario_capas` VALUES (9,134,2,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(10,135,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(11,136,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(12,137,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(13,138,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(14,139,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(15,140,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(16,141,2,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(17,194,2,NULL,NULL,NULL,6.0000,6.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(18,142,2,NULL,NULL,NULL,19.0000,19.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(19,143,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(20,144,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(21,145,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(22,146,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(23,147,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(24,189,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(25,149,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(26,150,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(27,151,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(28,152,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(29,134,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(30,153,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(31,156,18,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(32,157,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(33,158,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(34,159,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(35,160,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(36,161,18,NULL,NULL,NULL,3.0000,3.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(37,190,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(38,191,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(39,162,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(40,163,18,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(41,219,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(42,164,18,NULL,NULL,NULL,3.0000,3.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(43,192,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(44,165,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(45,166,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(46,167,18,NULL,NULL,NULL,6.0000,6.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(47,168,18,NULL,NULL,NULL,6.0000,6.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(48,169,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(49,171,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(50,172,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(51,173,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(52,136,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(53,174,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(54,175,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(55,177,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(56,178,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(57,179,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(58,180,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(59,181,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(60,182,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(61,184,18,NULL,NULL,NULL,3.0000,3.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(62,186,18,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(63,187,18,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(64,162,19,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(65,195,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(66,196,19,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(67,197,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(68,150,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(69,172,19,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(70,198,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(71,199,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(72,200,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(73,201,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(74,202,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(75,203,19,NULL,NULL,NULL,3.0000,3.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(76,213,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(77,205,19,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(78,206,19,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(79,207,19,NULL,NULL,NULL,3.0000,3.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(80,208,19,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(81,209,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(82,210,19,NULL,NULL,NULL,6.0000,6.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(83,211,19,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(84,212,19,NULL,NULL,NULL,8.0000,8.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(85,161,21,NULL,NULL,NULL,31.0000,31.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(86,214,21,NULL,NULL,NULL,7.0000,7.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(87,215,21,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(88,216,21,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(89,217,21,NULL,NULL,NULL,4.0000,4.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(90,137,21,NULL,NULL,NULL,7.0000,7.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(91,180,21,NULL,NULL,NULL,113.0000,113.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(92,218,21,NULL,NULL,NULL,7.0000,7.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(93,219,21,NULL,NULL,NULL,2.0000,2.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(94,220,21,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(95,221,21,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1),(96,222,21,NULL,NULL,NULL,1.0000,1.0000,0.0000,NULL,1.000000,NULL,'2026-04-24 03:16:48',NULL,'Migración: saldo existente sin proveedor identificado',1);
/*!40000 ALTER TABLE `inventario_capas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_general`
--

DROP TABLE IF EXISTS `item_general`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_general` (
  `id_item_general` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` tinyint DEFAULT NULL COMMENT '0 productos\\n1 materia prima\\n2 Insumos',
  `categoria_id` int DEFAULT NULL,
  `viscosidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `p_g` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `p_kg` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `brillo_60` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `secado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cubrimiento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `molienda` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ph` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `poder_tintoreo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `unidad_id` int DEFAULT NULL,
  `costo_produccion` decimal(10,2) DEFAULT NULL,
  `precio_venta_manual` decimal(12,2) DEFAULT NULL,
  `precio_manual_activo` tinyint(1) DEFAULT '0',
  `unidad_almacenaje_id` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_item_general`),
  UNIQUE KEY `id_item_general_UNIQUE` (`id_item_general`),
  KEY `fk_item_general_categoria1_idx` (`categoria_id`),
  KEY `fk_item_general_unidad_id_idx` (`unidad_id`),
  KEY `fk_item_almacenaje` (`unidad_almacenaje_id`),
  KEY `idx_item_general_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_item_almacenaje` FOREIGN KEY (`unidad_almacenaje_id`) REFERENCES `unidad` (`id_unidad`)
) ENGINE=InnoDB AUTO_INCREMENT=468 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_general`
--

LOCK TABLES `item_general` WRITE;
/*!40000 ALTER TABLE `item_general` DISABLE KEYS */;
INSERT INTO `item_general` VALUES (1,'BARNIZ TRANSPARENTE BRILLANTE','BAR001',0,1,'95-100 KU','3,4+/-0,05 Kg','','STD','>=95','12 HORAS','','','','',5,0.00,56000.00,1,5,NULL),(2,'ESMALTE BLANCO','ESM002',0,1,'100-105 KU','3,6+/-0,05 Kg','','','>=90','12 HORAS','100+/-5 %','','','',4,7000.00,NULL,0,NULL,NULL),(3,'ESMALTE CAOBA','ESM003',0,1,'100-105 KU','3,6+/-0,05 Kg','',NULL,'>=90','6 HORAS','100+/-5%','7.5 H',NULL,NULL,3,11000.00,NULL,0,NULL,NULL),(4,'ESMALTE NEGRO MATE','ESM004',0,1,'105-110 KU','3,9+/-0,05 Kg','',NULL,'<=15','12 HORAS','100+/-5%','6 H',NULL,NULL,4,34050.00,NULL,0,NULL,NULL),(5,'ESMALTE ROJO FIESTA','ESM005',0,1,'100-105 KU','3,6+/-0,05 Kg','','','>= 90°','12 HORAS','100+/-5%','','','',1,27144.00,NULL,0,NULL,NULL),(6,'ESMALTE NEGRO BRILLANTE','ESM006',0,1,'100-105 KU','3.4+/-0.05 Kg','','','>= 90','12 HORAS','100+/-5%','','','',3,12691.00,NULL,0,NULL,NULL),(7,'ESMALTE VERDE ESMERALDA','ESM007',0,1,'100-105 KU','3.6+/-0,05 Kg','','','>=90','12 HORAS','100+/-5%','','','',1,4372.00,NULL,0,NULL,NULL),(8,'ESMALTE GRIS PLATA','ESM008',0,1,'100-105 KU','3,6+/-0,05 Kg','','','>=90','12 HORAS','100+/-5 %','','','',7,11466.00,NULL,0,NULL,NULL),(9,'ESMALTE AZUL ESPAÑOL','ESM009',0,1,'100-105 KU','3,6+/-0,05 Kg','',NULL,'>=90','12 HORAS','100+/-5 %','7.5 H',NULL,NULL,NULL,16300.00,NULL,0,NULL,NULL),(10,'ESMALTE BLANCO MATE','ESM010',0,1,'95-100','4,2 +/- 0,1 Kg','','','15','12 HORAS','100+/-5','','','',3,17000.00,NULL,0,NULL,NULL),(11,'ESMALTE AMARILLO','ESM011',0,1,'100-105 KU','3,6+/-0,05 Kg','',NULL,'>=90','12 HORAS','100+/-5','7.5 H',NULL,NULL,NULL,4400.00,NULL,0,NULL,NULL),(12,'ESMALTE NARANJA','ESM012',0,1,'100-105','3.5+/-0.05','',NULL,'>=90','12 HORAS','100+/-5','7.5 H',NULL,NULL,NULL,14300.00,NULL,0,NULL,NULL),(13,'ESMALTE TABACO','ESM013',0,1,'100-105KU','3.5+/-0.05','',NULL,'>=90','12 HORAS','100+/-5','7.5 H',NULL,NULL,NULL,40.00,NULL,0,NULL,NULL),(14,'ANTICORROSIVO GRIS','ANT014',0,3,'105-110 KU','4.2+/-0.05 Kg','',NULL,'MATE','6 HORAS','100+/-5','5,5',NULL,NULL,NULL,1550.00,NULL,0,NULL,NULL),(15,'ANTICORROSIVO NEGRO','ANT015',0,3,'105-110 KU','4.2+/-0.05 Kg','',NULL,'MATE','6 HORAS','100+/-5','5,5',NULL,NULL,NULL,4617.00,NULL,0,NULL,NULL),(16,'ANTICORROSIVO AMARILLO','ANT016',0,3,'105-110 KU','4.2+/-0.05 Kg','',NULL,'MATE','6 HORAS','100+/-5','5,5',NULL,NULL,NULL,8640.00,NULL,0,NULL,NULL),(17,'ANTICORROSIVO ROJO','ANT017',0,3,'105-110 KU','4.2+/-0.05 Kg','',NULL,'MATE','6 HORAS','100+/-5','5,5',NULL,NULL,NULL,14300.00,NULL,0,NULL,NULL),(18,'ANTICORROSIVO BLANCO','ANT018',0,3,'105-110 KU','4.2+/-0.05 Kg','',NULL,'MATE','6 HORAS','100+/-5','5,5',NULL,NULL,NULL,855.00,NULL,0,NULL,NULL),(19,'ANTICORROSIVO VERDE','ANT019',0,3,'105-110 KU','4.2+/-0.05 Kg','',NULL,'MATE','6 HORAS','100+/-5','5,5',NULL,NULL,NULL,5400.00,NULL,0,NULL,NULL),(20,'PASTA ESMALTE VERDE ENTONADOR','PAS020',0,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,8105.00,NULL,0,NULL,NULL),(21,'PASTA ESMALTE AZUL ENTONADOR','PAS021',0,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,12215.00,NULL,0,NULL,NULL),(22,'PASTA ESMALTE NEGRO','PAS022',2,2,'100 KU','4,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,19945.00,NULL,0,NULL,NULL),(23,'PASTA ESMALTE ROJO CARMIN 57:1','PAS023',0,2,'100 KU','5,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,14152.00,NULL,0,NULL,NULL),(24,'PASTA ESMALTE NARANJA','PAS024',2,2,'100 KU','5,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,11447.00,NULL,0,NULL,NULL),(25,'PASTA ESMALTE AMARILLO','PAS025',0,2,'100 KU','5,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,12718.00,NULL,0,NULL,NULL),(26,'PASTA ESMALTE CAOBA','PAS026',2,2,'100 KU','5,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,7742.00,NULL,0,NULL,NULL),(27,'PASTA ESMALTE AMARILLO OXIDO','PAS027',2,2,'100 KU','5,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,11447.00,NULL,0,NULL,NULL),(28,'PASTA ESMALTE ROJO OXIDO','PAS028',0,2,'100 KU','5,55','','STD',NULL,NULL,NULL,'>7H','-','STD',NULL,1690.00,NULL,0,NULL,NULL),(29,'PASTA ESMALTE BLANCO','PAS029',0,2,'120','5,78','','STD',NULL,NULL,NULL,'7,5','-','100 +/- 0.5 %',NULL,10303.00,NULL,0,NULL,NULL),(30,'PASTA ESMALTE TABACO','PAS030',2,2,'95-100','5.71-5.91','','STD',NULL,NULL,NULL,'7,5','-','STD',NULL,722.00,NULL,0,NULL,NULL),(31,'RESINA MEDIA EN SOYA AL 50%','RAM014',1,0,'','','','','','','','','','',0,715.00,NULL,0,NULL,NULL),(32,'METIL ETIL CETOXIMA','AAN002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4300.00,NULL,0,NULL,NULL),(33,'OCTOATO DE COBALTO AL 12%','SOC011',1,0,'','','','','','','','','','',0,4400.00,NULL,0,NULL,NULL),(34,'OCTOATO DE ZIRCONIO AL 24%','SOZ024',1,0,'','','','','','','','','','',0,8000.00,NULL,0,NULL,NULL),(35,'OCTOATO DE CALCIO AL 10%','SOC010',1,0,'','','','','','','','','','',0,8000.00,NULL,0,NULL,NULL),(36,'DISOLVENTE 2232 #3','SAA011',1,0,'','','','','','','','','','',0,1103.00,NULL,0,NULL,NULL),(37,'DIOXIDO DE TITANIO','PED010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22700.00,NULL,0,NULL,NULL),(38,'OCTOATO DE ZINC AL 16%','SOZ016',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,43900.00,NULL,0,NULL,NULL),(39,'BENTOCLAY BP 184','AAS005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,37300.00,NULL,0,NULL,NULL),(40,'ETANOL AL 96%','SAA022',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22700.00,NULL,0,NULL,NULL),(41,'DISASTAB','AEM005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,7000.00,NULL,0,NULL,NULL),(42,'AGUA','SIA040',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,19500.00,NULL,0,NULL,NULL),(43,'SULFATO DE MAGNESIO','AET004',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,33500.00,NULL,0,NULL,NULL),(44,'VARSOL','SAV010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,37200.00,NULL,0,NULL,NULL),(47,'[DUP->59] MICROTALC C 20','CTA011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,8000.00,NULL,0,NULL,'2026-05-30 14:45:21'),(48,'CELITE 499','MSI006',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,11466.00,NULL,0,NULL,NULL),(50,'PASTA ESMALTE ROJO 57:1','PE1033',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,17000.00,NULL,0,NULL,NULL),(52,'PASTA AMARILLO CROMO MEDIO','PE1010',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,17000.00,NULL,0,NULL,NULL),(54,'PASTA VERDE FTALO','PE1040',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4617.00,NULL,0,NULL,NULL),(56,'PASTA ESMALTE AZUL FTALO 15:3','PE1021',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22700.00,NULL,0,NULL,NULL),(57,'[MERGED→347] OMYACARB UF','CCC002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,11000.00,NULL,0,NULL,NULL),(59,'MICROTALC C 20','CTA025',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(60,'CARBONATO DE CALCIO HI WHITE','CCC004',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(61,'LECITINA DE SOYA','AHU002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(62,'[DUP->40] ETANOL AL 96%','SAM023',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'2026-05-30 14:45:21'),(63,'OXIDO DE HIERRO AMARILLO Y 4021','PEA010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(64,'OXIDO DE HIERRO ROJO R-5530','PER030',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(65,'[MERGED→59] MICROTALC 20','CTA020',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(66,'TROYSPERSE CD1','ADI002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(67,'PIGMENTO VERDE FTALO 7','PEV053',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(68,'PIGMENTO AZUL FTALO 15;3','PEA041',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(69,'EDAPLAN 918 / LANSPERSE SUV','ADI010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(71,'POW CARBON BLACK CHEMO','PEN081',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(72,'PIGMENTO ROJO CARMIN 57:1','PER031',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(73,'PIGMENTO NARANJA MOLIBDENO','PEN023',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(74,'PIGMENTO MARILLO DE CROMO AL 73','PEA011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(75,'PIGMENTO OXIFERR CAOBA MARRON M 4781','PEC081',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(76,'PIGMENTO OXIFERR AMARILLO Y-4011','PEA013',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(77,'DIOXIDO DE TITANIO SULFATO 2196','PED007',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(78,'OXIFER TABACO R-4370','PET080',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,8105.00,NULL,0,NULL,NULL),(79,'[DUP->39] BENTOCLAY BP 184','AAS012',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'2026-05-30 14:45:21'),(80,'METANOL','SAM023',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(81,'ORGANOCLAY BK 884','AAS005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(83,'DISOLVENTE 2232 / VARSOL','SAA011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(84,'EDAPLAN 915','ADI010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(85,'CHEMOSPERSE 77','ADI011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(86,'ADIMON 84','AAN002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,NULL),(87,'DISOLVENTE #3','SAA011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4372.00,NULL,0,NULL,NULL),(88,'ETANOL 96%','SAA022',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4400.00,NULL,0,NULL,NULL),(89,'[MERGED→36] DISOLVENTE 2232','SAA011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4372.00,NULL,0,NULL,NULL),(90,'[MERGED→87] DISOLVENTE 3','SAA011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4372.00,NULL,0,NULL,NULL),(92,'OCTOATO DE ZINC 16%','SOZ016',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,16300.00,NULL,0,NULL,NULL),(93,'PASTA ESMALTE AMARILLO CROMO MEDIO','PE1010',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,14152.00,NULL,0,NULL,NULL),(94,'[DUP->77] DIOXIDO DE TITANIO SULFATO 2196','PED010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,11466.00,NULL,0,NULL,'2026-05-30 14:45:21'),(95,'[MERGED→39] BENTOCLAY BP184','AAS005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,17000.00,NULL,0,NULL,NULL),(96,'PASTA ESMALTE AZUL 15:3','PE1021',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,11447.00,NULL,0,NULL,NULL),(97,'[MERGED→84] EDAPLAN 918','ADI010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22700.00,NULL,0,NULL,NULL),(98,'[DUP->97] EDAPLAN 918 / LANSPERSE SUV','ADI010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22700.00,NULL,0,NULL,'2026-05-30 14:54:46'),(99,'[DUP->85] CHEMOSPERSE 77','ADI010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22700.00,NULL,0,NULL,'2026-05-30 14:45:21'),(100,'PIGMENTO OXIFERR ROJO R-5530','PER030',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(133,'VINILO T1 BLANCO','EBT012',0,1,'','','','','','','','','','',NULL,1.00,NULL,0,NULL,NULL),(134,'SIKA WT-100 CO','SIK001',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(135,'POLASTOCRETE','SIK002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(136,'SIKA STABILIZER 4R CO','SIK003',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(137,'SIKALASTIC 851 R COMP A','SIK004',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(138,'PLASTIMENT TM 5-CO','SIK005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(139,'SARNACOL 2130','SIK006',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(140,'SIKAFUND MO-CO','SIK007',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(141,'RESINA ACRILICA MASFLEX','RES001',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(142,'UFI PRETHOX','VAR001',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(143,'RESINA NEGRA (POR IDENTIFICAR)','RES002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(144,'PASTA AZUL PHILAC','PHI001',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(145,'ADITIVO NEGRO (MUESTRA)','VAR002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(146,'SOLVENTE (POR IDENTIFICAR)','SAA099',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(147,'PROPIL MORENO','VAR003',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(148,'SILVACOL','VAR004',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(149,'HORNESABE BLANCO','HOR001',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(150,'HORNESABE BEIGE','HOR002',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(151,'HORNESABE ALEMANA','HOR003',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(152,'HORNESABE AMARILLO','HOR004',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(153,'SIKA FLOR CURATHANE','SIK008',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(154,'CAT PU','VAR005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(155,'SIKALASTIC 871 R COMP B','SIK009',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(156,'LODO EPOXÍCO / RESINA EN POLVO','VAR006',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(157,'CAT SKAUR 32','VAR007',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(158,'PU VDE','VAR008',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(159,'RESINAS FERROBAR 903','RES003',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(160,'SIKALASTIC 830 COMP B','SIK010',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(161,'ETHYL SILICATO','VAR009',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(162,'RESINA CORTA R4','RES004',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(163,'RESINA PU','RES005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(164,'PASTA ROJA PHILAC','PHI002',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(165,'PINTURA NEGRA COOKROT','VAR010',0,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(166,'XLOC PHILAC SOLVENTE','PHI003',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(167,'SIKA PLAY 169','SIK011',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(168,'SIKA FLUID 169','SIK012',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(169,'SIKAMANTO FLEX COMP A','SIK013',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(170,'LATEX PESANTE PARA TEJAS','VAR011',0,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(171,'PASTA CAOBA PHILAC','PHI004',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(172,'HORNESABE BCO','HOR005',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(173,'GROUP MORENO','VAR012',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(174,'SOLVENTE SUCIO SIKA','SIK014',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(175,'PROPILER RESINA COMP B','RES006',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(176,'SELLADOR NITRO','VAR013',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(177,'BINDA POLIURETANO','VAR014',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(178,'VINILO BEIGE','VAR015',0,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(179,'RESINA BEA EPOXICA','RES007',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(180,'FRUTA ROJA','PHI005',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(181,'RESINA BLANCA','RES008',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(182,'RESINA NARANJA','RES009',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(183,'MAFA LACA','VAR016',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(184,'SIKAPLAST REVOLVER CON AMOLRED','SIK015',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(185,'PASTA AMARILLA PHILAC','PHI006',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(186,'ALCONA CATANAS','VAR017',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(187,'SODA PH CONEXA AZL','VAR018',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(188,'CANALINOSE IBC','VAR019',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(189,'RESINA SIKA (MUESTRA)','SIK022',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(190,'INJEX HORENEM ADECRIL','VAR028',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(191,'CODO EPOXÍCO SIKA','VAR029',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(192,'NEGRO - NARANJA (POR IDENTIFICAR)','VAR031',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(193,'RASPER BASE BESS','VAR032',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(194,'ROJO IBC MASFLEX','VAR030',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(195,'EPOXICA (POR IDENTIFICAR)','VAR020',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(196,'PASTA AZUL CON GENA MORENO','PHI007',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(197,'HORNESABE DORADO','HOR006',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(198,'HORNESABE DORADO COBRE','HOR007',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(199,'HORNESABE VERDE ALBOA','HOR008',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(200,'HORNESABE AMARILLA','HOR009',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(201,'SPLANDER PHILAC','PHI008',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(202,'MICA INTERIOR PHILAC','PHI009',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(203,'PASTA MORADA CARVAJAL PHILAC','PHI010',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(204,'PASTA VIOLETA','PHI011',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(205,'GPS SIKA (MUESTRA)','SIK016',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(206,'XLOC PHILAC (POR ANALIZAR)','PHI012',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(207,'ANT BES AREPHE','VAR021',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(208,'MOLOC NARANJA','VAR022',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(209,'PASTA AZUL (TAMBOR LOP)','PHI013',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(210,'POLIESTER POP LUCY','VAR023',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(211,'CAT EPOXÍCO IBC','VAR024',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(212,'VINILO POP COLONIAL','VAR025',0,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(213,'TAMBOR AMARILLO SIKA (POR IDENTIFICAR)','SIK023',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(214,'SIKAPLAST REVOLVER','SIK017',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(215,'SIKA FULL REVOLVER','SIK018',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(216,'SIKA FILM','SIK019',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(217,'SIKA TRAFIC COMP A','SIK020',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(218,'MANCHA (COLORANTE)','PHI014',2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(219,'SPLANDER','VAR026',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(220,'LACANTE','VAR027',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(221,'SOLVENTE CON BORNELO','SAA030',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(222,'2N SIKA STABILIZER 100','SIK021',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,1,NULL),(223,'BARNIZ EPOXICO ','EP01',0,4,'','','','','','','','','','',2,NULL,NULL,0,NULL,NULL),(224,'EPOXICA TRANSPARENTE','EPTR91',0,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,0.00,NULL,0,NULL,NULL),(225,'XILOL','XIL21288',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(226,'RESINA EPOXICA','NPSN CHINA',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(230,'DISPERSANTE',NULL,2,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5000.00,NULL,0,9,NULL),(231,'DISPERSANTE','093816',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,5378.00,NULL,0,NULL,NULL),(232,'CLEYTONE HY','927163',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,2000.00,NULL,0,NULL,NULL),(233,'AZUL ULTRAMAR','018273',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,2000.00,NULL,0,NULL,NULL),(235,'CARBONATO UF','556115',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,20.00,NULL,0,NULL,NULL),(236,'FOSFATO ZINC','521584',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,1000.00,NULL,0,NULL,NULL),(241,'ANTIPIEL','545124',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,2000.00,NULL,0,NULL,NULL),(242,'P-400','545124',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,2000.00,NULL,0,NULL,NULL),(244,'ISOBUTANOL',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(245,'BUTIL GLICOL',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(246,'TPF','MP-246',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(247,'NONIL TERGITOL','MP-247',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(248,'MECELLOSE','MP-248',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(249,'ANTIESPUMANTE','MP-249',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(250,'DIETILEN GLICOL','MP-250',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(251,'CARBONATO DE CALCIO','MP-251',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(252,'TALCO TY 400','MP-252',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(253,'CAOLIN','MP-253',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(254,'TEXANOL','MP-254',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(255,'ACRONAL','MP-255',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(256,'BACTERICIDA','MP-256',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(257,'AMONIACO','MP-257',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(258,'HISOL ASOCIATIVO','MP-258',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(259,'FUNGICIDA','MP-259',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(260,'ACEITE DE PINO','MP-260',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(261,'BUTIL CELLOSOLVE','MP-261',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(262,'TROYSSOL 366','MP-262',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(263,'POLVO PERLADO VERDOSO','MP-263',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(264,'POLVO PERLADO RICO EN ORO','MP-264',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(265,'RESINA 000','MP-265',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(266,'RESINA MALEICA AL 60%','MP-266',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(267,'PIGMENTO CROMATO DE ZINC','MP-267',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(268,'PIGMENTO ALUMINIO 22 NL','MP-268',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(269,'ACETATO N-PROPILO','MP-269',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(270,'UREA FORMAL','MP-270',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(271,'BYK 066N NIVELANTE','MP-271',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(272,'BYK 108 ANTIESPUMANTE','MP-272',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(273,'PIGMENTO VERDE OXIDO CROMO','MP-273',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(274,'[MERGED→226] RESINA EPOXICA 100%','MP-274',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(275,'VINILO BLANCO TIPO 2','VIN275',0,5,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(276,'VINILO BLANCO TIPO 3','VIN276',0,5,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(277,'ESMALTE AZUL REAL','ESM277',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(278,'LACA CATALIZADA BRILLANTE','LAC278',0,7,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(279,'PASTA OCRE PARA VINILO','PAS279',2,2,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(280,'VINILO OCRE T1','VIN280',0,5,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(281,'ESMALTE AMARILLO CATERPILLAR','ESM281',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(282,'ESMALTE NEGRO','ESM282',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(283,'ESMALTE BLANCO T1','ESM283',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(284,'ESMALTE BLANCO 4X1','ESM284',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(285,'ESMALTE BLANCO ECONOMICO J.J','ESM285',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(286,'ESMALTE ECONOMICO BLANCO J.H','ESM286',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(287,'ESMALTE DORADO','ESM287',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(288,'ANTICORROSIVO CROMATO ZN VERDE','ANT288',0,3,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(289,'ESMALTE DE ALUMINIO','ESM289',0,1,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(290,'EPOXICA BLANCO','EPX290',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(291,'EPOXICA NEGRA','EPX291',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(292,'EPOXICA GRIS','EPX292',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(293,'EPOXICA NEGRA RESINA 100%','EPX293',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(294,'EPOXICA POLIAMIDA VERDE','EPX294',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(295,'EPOXICA AZUL','EPX295',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(296,'EPOXICA ROJO OXIDO','EPX296',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(297,'ESMALTE EPOXI SILICATO BLANCO','ESM297',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(298,'ESMALTE EPOXI SILICATO VERDE','ESM298',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(299,'ESMALTE EPOXICO AMARILLO','ESM299',0,6,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(300,'PVA RESIFLEX 610','PRE-193781',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,5040.00,NULL,0,9,NULL),(301,'PVA RESIFLEX F55M','PRE-192392',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,7620.00,NULL,0,9,NULL),(302,'ENDURECEDOR 100%',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(334,'COALESCENTE',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(335,'ESPESANTE ACRILICO ASOCIATIVO',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(336,'ESPESANTE CELULOSICO',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(337,'RESINA ACRILICA EXTERIORES',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(338,'DISPERSANTE BASE SOLVENTE','REF-76565',1,0,'','','1','','','','','','','',9,NULL,NULL,0,9,NULL),(339,'NIVELANTE',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(340,'ANTIESPUMANTE EPOXICOS',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(341,'AMARILLO CROMO MEDIO',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(342,'HUMECTANTE BASE AGUA',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(343,'HIDROFUGANTE MATE',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(344,'HIDROFUGANTE BRILLANTE',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(345,'BIOCIDA DA PLUS',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(346,'BIOCIDA DA ULTRA',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(347,'OMYACARB 15',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(348,'[MERGED→347] OMYACARB 4',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(349,'TALCO EXTRA',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(350,'TALCO EXTRA MEJORADO',NULL,1,0,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,NULL,NULL,0,9,NULL),(351,'CAOLIN BRITEX CALCINADO',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(352,'CARBONATO DE CALCIO ESTUCO M325','REF-6387',1,0,'','','','','','','','','','',NULL,0.00,NULL,0,9,NULL),(353,'CARBONATO DE CALCIO VINILO M600','REF-91618',1,0,'','','','','','','','','','',NULL,0.00,NULL,0,NULL,NULL),(354,'CATALIZADOR','C2102T',0,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,0.00,NULL,0,NULL,NULL),(355,'AZUL FTALOCIANINA V-316','REF-237',1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(356,'ACETATPO',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(357,'VARITA BLANCA',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(358,'VARITA NICRONIZADA',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(359,'PIGMENTO AMARILLO LIMÓN',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(360,'BENTOCLAY 188-B',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(459,'THINNER',NULL,1,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(460,'REGULADOR PH',NULL,1,0,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,9,NULL),(461,'VINILO T2 ECONOMICO','VIN461',0,5,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(462,'VINILO T1 COMERCIAL','VIN462',0,5,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `item_general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_general_formulaciones`
--

DROP TABLE IF EXISTS `item_general_formulaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_general_formulaciones` (
  `id_item_general_formulaciones` int NOT NULL AUTO_INCREMENT,
  `formulaciones_id` int NOT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `porcentaje` int DEFAULT NULL,
  `item_general_id` int DEFAULT NULL,
  `orden` smallint NOT NULL DEFAULT '0' COMMENT 'Secuencia de proceso (orden en que se agrega el ingrediente)',
  `tipo` enum('ingrediente','instruccion','fase') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'ingrediente',
  `texto` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nota` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id_item_general_formulaciones`),
  KEY `fk_item_especifico_has_formulaciones_formulaciones1_idx` (`formulaciones_id`),
  KEY `fk_item_especifico_formulaciones_item_general1_idx` (`item_general_id`),
  CONSTRAINT `fk_igf_formulaciones` FOREIGN KEY (`formulaciones_id`) REFERENCES `formulaciones` (`id_formulaciones`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_igf_item_general` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1478 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_general_formulaciones`
--

LOCK TABLES `item_general_formulaciones` WRITE;
/*!40000 ALTER TABLE `item_general_formulaciones` DISABLE KEYS */;
INSERT INTO `item_general_formulaciones` VALUES (22,3,775.00,NULL,31,1,'ingrediente',NULL,NULL),(23,3,103.00,NULL,26,2,'ingrediente',NULL,NULL),(24,3,8.70,NULL,41,3,'ingrediente',NULL,NULL),(25,3,290.00,NULL,42,4,'ingrediente',NULL,NULL),(26,3,3.00,NULL,236,5,'ingrediente',NULL,NULL),(27,3,3.30,NULL,86,6,'ingrediente',NULL,NULL),(28,3,5.78,NULL,33,7,'ingrediente',NULL,NULL),(29,3,9.10,NULL,34,8,'ingrediente',NULL,NULL),(30,3,8.26,NULL,35,9,'ingrediente',NULL,NULL),(31,3,113.00,NULL,36,10,'ingrediente',NULL,NULL),(32,3,114.00,NULL,44,11,'ingrediente',NULL,NULL),(33,4,775.00,NULL,31,1,'ingrediente',NULL,NULL),(34,4,224.00,NULL,59,2,'ingrediente',NULL,NULL),(35,4,40.00,NULL,48,3,'ingrediente',NULL,NULL),(36,4,12.00,NULL,39,4,'ingrediente',NULL,NULL),(37,4,6.00,NULL,40,5,'ingrediente',NULL,NULL),(38,4,125.00,NULL,22,6,'ingrediente',NULL,NULL),(39,4,8.70,NULL,41,7,'ingrediente',NULL,NULL),(40,4,290.00,NULL,42,8,'ingrediente',NULL,NULL),(41,4,2.90,NULL,236,9,'ingrediente',NULL,NULL),(42,4,3.35,NULL,86,10,'ingrediente',NULL,NULL),(43,4,5.86,NULL,33,11,'ingrediente',NULL,NULL),(44,4,9.21,NULL,34,12,'ingrediente',NULL,NULL),(45,4,8.37,NULL,35,13,'ingrediente',NULL,NULL),(46,4,227.00,NULL,44,14,'ingrediente',NULL,NULL),(58,6,775.00,NULL,31,1,'ingrediente',NULL,NULL),(59,6,125.00,NULL,22,2,'ingrediente',NULL,NULL),(60,6,5.70,NULL,41,3,'ingrediente',NULL,NULL),(61,6,190.00,NULL,42,4,'ingrediente',NULL,NULL),(62,6,1.90,NULL,236,5,'ingrediente',NULL,NULL),(63,6,3.35,NULL,86,6,'ingrediente',NULL,NULL),(64,6,5.86,NULL,33,7,'ingrediente',NULL,NULL),(65,6,9.21,NULL,34,8,'ingrediente',NULL,NULL),(66,6,8.37,NULL,35,9,'ingrediente',NULL,NULL),(67,6,227.00,NULL,44,10,'ingrediente',NULL,NULL),(68,7,775.00,NULL,31,1,'ingrediente',NULL,NULL),(69,7,62.00,NULL,52,2,'ingrediente',NULL,NULL),(70,7,10.40,NULL,56,3,'ingrediente',NULL,NULL),(71,7,108.00,NULL,54,4,'ingrediente',NULL,NULL),(72,7,6.20,NULL,41,5,'ingrediente',NULL,NULL),(73,7,205.00,NULL,42,6,'ingrediente',NULL,NULL),(74,7,2.10,NULL,236,7,'ingrediente',NULL,NULL),(75,7,3.46,NULL,86,8,'ingrediente',NULL,NULL),(76,7,6.05,NULL,33,9,'ingrediente',NULL,NULL),(77,7,9.51,NULL,34,10,'ingrediente',NULL,NULL),(78,7,8.65,NULL,35,11,'ingrediente',NULL,NULL),(79,7,113.00,NULL,36,12,'ingrediente',NULL,NULL),(80,7,114.00,NULL,44,13,'ingrediente',NULL,NULL),(81,8,425.00,NULL,31,1,'ingrediente',NULL,NULL),(82,8,251.00,NULL,37,2,'ingrediente',NULL,NULL),(83,8,2.63,NULL,92,3,'ingrediente',NULL,NULL),(84,8,16.00,NULL,39,4,'ingrediente',NULL,NULL),(85,8,8.00,NULL,40,5,'ingrediente',NULL,NULL),(86,8,3.30,NULL,27,6,'ingrediente',NULL,NULL),(87,8,17.00,NULL,22,7,'ingrediente',NULL,NULL),(88,8,14.20,NULL,41,8,'ingrediente',NULL,NULL),(89,8,470.00,NULL,42,9,'ingrediente',NULL,NULL),(90,8,4.70,NULL,236,10,'ingrediente',NULL,NULL),(91,8,5.20,NULL,86,11,'ingrediente',NULL,NULL),(92,8,9.37,NULL,33,12,'ingrediente',NULL,NULL),(93,8,14.72,NULL,34,13,'ingrediente',NULL,NULL),(94,8,13.40,NULL,35,14,'ingrediente',NULL,NULL),(95,8,197.00,NULL,36,15,'ingrediente',NULL,NULL),(96,8,200.00,NULL,44,16,'ingrediente',NULL,NULL),(97,9,225.00,NULL,31,1,'ingrediente',NULL,NULL),(98,9,56.00,NULL,37,2,'ingrediente',NULL,NULL),(99,9,0.70,NULL,92,3,'ingrediente',NULL,NULL),(100,9,2.00,NULL,39,4,'ingrediente',NULL,NULL),(101,9,1.00,NULL,40,5,'ingrediente',NULL,NULL),(102,9,168.00,NULL,56,6,'ingrediente',NULL,NULL),(103,9,11.20,NULL,50,7,'ingrediente',NULL,NULL),(104,9,9.70,NULL,41,8,'ingrediente',NULL,NULL),(105,9,323.00,NULL,42,9,'ingrediente',NULL,NULL),(106,9,3.23,NULL,236,10,'ingrediente',NULL,NULL),(107,9,5.40,NULL,86,11,'ingrediente',NULL,NULL),(108,9,9.45,NULL,33,12,'ingrediente',NULL,NULL),(109,9,14.86,NULL,34,13,'ingrediente',NULL,NULL),(110,9,13.51,NULL,35,14,'ingrediente',NULL,NULL),(111,9,197.00,NULL,36,15,'ingrediente',NULL,NULL),(112,9,165.00,NULL,44,16,'ingrediente',NULL,NULL),(113,10,1173.00,NULL,31,1,'ingrediente',NULL,NULL),(114,10,288.00,NULL,37,2,'ingrediente',NULL,NULL),(115,10,435.00,NULL,347,3,'ingrediente',NULL,NULL),(116,10,84.00,NULL,48,4,'ingrediente',NULL,NULL),(117,10,5.00,NULL,92,5,'ingrediente',NULL,NULL),(118,10,25.00,NULL,39,6,'ingrediente',NULL,NULL),(119,10,10.00,NULL,40,7,'ingrediente',NULL,NULL),(120,10,14.30,NULL,41,8,'ingrediente',NULL,NULL),(121,10,477.00,NULL,42,9,'ingrediente',NULL,NULL),(122,10,4.80,NULL,236,10,'ingrediente',NULL,NULL),(123,10,4.69,NULL,86,11,'ingrediente',NULL,NULL),(124,10,8.20,NULL,33,12,'ingrediente',NULL,NULL),(125,10,12.90,NULL,34,13,'ingrediente',NULL,NULL),(126,10,11.70,NULL,35,14,'ingrediente',NULL,NULL),(127,10,433.00,NULL,44,15,'ingrediente',NULL,NULL),(138,12,1033.00,NULL,31,1,'ingrediente',NULL,NULL),(139,12,180.00,NULL,24,2,'ingrediente',NULL,NULL),(140,12,77.00,NULL,52,3,'ingrediente',NULL,NULL),(141,12,11.00,NULL,41,4,'ingrediente',NULL,NULL),(142,12,363.00,NULL,42,5,'ingrediente',NULL,NULL),(143,12,3.66,NULL,236,6,'ingrediente',NULL,NULL),(144,12,4.64,NULL,86,7,'ingrediente',NULL,NULL),(145,12,8.13,NULL,33,8,'ingrediente',NULL,NULL),(146,12,12.77,NULL,34,9,'ingrediente',NULL,NULL),(147,12,11.61,NULL,35,10,'ingrediente',NULL,NULL),(148,12,391.00,NULL,44,11,'ingrediente',NULL,NULL),(149,13,1033.00,NULL,31,1,'ingrediente',NULL,NULL),(150,13,190.00,NULL,30,2,'ingrediente',NULL,NULL),(151,13,11.00,NULL,41,3,'ingrediente',NULL,NULL),(152,13,363.00,NULL,42,4,'ingrediente',NULL,NULL),(153,13,3.60,NULL,236,5,'ingrediente',NULL,NULL),(154,13,4.50,NULL,86,6,'ingrediente',NULL,NULL),(155,13,7.90,NULL,33,7,'ingrediente',NULL,NULL),(156,13,12.40,NULL,34,8,'ingrediente',NULL,NULL),(157,13,11.30,NULL,35,9,'ingrediente',NULL,NULL),(158,13,391.00,NULL,44,10,'ingrediente',NULL,NULL),(190,16,274.00,NULL,31,1,'ingrediente',NULL,NULL),(191,16,47.00,NULL,63,2,'ingrediente',NULL,NULL),(192,16,220.00,NULL,59,3,'ingrediente',NULL,NULL),(193,16,18.00,NULL,60,4,'ingrediente',NULL,NULL),(194,16,1.30,NULL,61,5,'ingrediente',NULL,NULL),(195,16,6.50,NULL,39,6,'ingrediente',NULL,NULL),(196,16,4.00,NULL,40,7,'ingrediente',NULL,NULL),(197,16,4.80,NULL,41,8,'ingrediente',NULL,NULL),(198,16,160.00,NULL,42,9,'ingrediente',NULL,NULL),(199,16,1.60,NULL,236,10,'ingrediente',NULL,NULL),(200,16,1.10,NULL,86,11,'ingrediente',NULL,NULL),(201,16,1.92,NULL,33,12,'ingrediente',NULL,NULL),(202,16,3.00,NULL,34,13,'ingrediente',NULL,NULL),(203,16,2.74,NULL,35,14,'ingrediente',NULL,NULL),(204,16,142.60,NULL,44,15,'ingrediente',NULL,NULL),(205,17,274.00,NULL,31,1,'ingrediente',NULL,NULL),(206,17,58.00,NULL,64,2,'ingrediente',NULL,NULL),(207,17,220.00,NULL,59,3,'ingrediente',NULL,NULL),(208,17,18.00,NULL,60,4,'ingrediente',NULL,NULL),(209,17,1.30,NULL,61,5,'ingrediente',NULL,NULL),(210,17,6.50,NULL,39,6,'ingrediente',NULL,NULL),(211,17,4.00,NULL,40,7,'ingrediente',NULL,NULL),(212,17,4.70,NULL,41,8,'ingrediente',NULL,NULL),(213,17,155.60,NULL,42,9,'ingrediente',NULL,NULL),(214,17,1.55,NULL,236,10,'ingrediente',NULL,NULL),(215,17,1.10,NULL,86,11,'ingrediente',NULL,NULL),(216,17,1.92,NULL,33,12,'ingrediente',NULL,NULL),(217,17,3.00,NULL,34,13,'ingrediente',NULL,NULL),(218,17,2.74,NULL,35,14,'ingrediente',NULL,NULL),(219,17,142.60,NULL,44,15,'ingrediente',NULL,NULL),(253,20,186.00,NULL,31,1,'ingrediente',NULL,NULL),(254,20,3.00,NULL,32,2,'ingrediente',NULL,NULL),(255,20,3.00,NULL,39,3,'ingrediente',NULL,NULL),(256,20,8.00,NULL,66,4,'ingrediente',NULL,NULL),(257,20,50.00,NULL,67,5,'ingrediente',NULL,NULL),(258,20,2.00,NULL,40,6,'ingrediente',NULL,NULL),(259,20,76.00,NULL,44,7,'ingrediente',NULL,NULL),(260,21,186.00,NULL,31,1,'ingrediente',NULL,NULL),(261,21,3.00,NULL,32,2,'ingrediente',NULL,NULL),(262,21,5.00,NULL,39,3,'ingrediente',NULL,NULL),(263,21,3.00,NULL,80,4,'ingrediente',NULL,NULL),(264,21,15.00,NULL,61,5,'ingrediente',NULL,NULL),(265,21,52.00,NULL,68,6,'ingrediente',NULL,NULL),(266,21,5.00,NULL,84,7,'ingrediente',NULL,NULL),(267,21,76.00,NULL,44,8,'ingrediente',NULL,NULL),(268,22,242.00,NULL,31,1,'ingrediente',NULL,NULL),(269,22,3.10,NULL,86,2,'ingrediente',NULL,NULL),(270,22,9.00,NULL,84,3,'ingrediente',NULL,NULL),(271,22,25.00,NULL,61,4,'ingrediente',NULL,NULL),(272,22,59.00,NULL,71,5,'ingrediente',NULL,NULL),(273,23,55.00,NULL,31,1,'ingrediente',NULL,NULL),(274,23,0.80,NULL,39,2,'ingrediente',NULL,NULL),(275,23,0.40,NULL,80,3,'ingrediente',NULL,NULL),(276,23,0.25,NULL,86,4,'ingrediente',NULL,NULL),(277,23,2.80,NULL,85,5,'ingrediente',NULL,NULL),(278,23,1.60,NULL,61,6,'ingrediente',NULL,NULL),(279,23,24.00,NULL,72,7,'ingrediente',NULL,NULL),(280,23,34.00,NULL,44,8,'ingrediente',NULL,NULL),(281,24,332.00,NULL,31,1,'ingrediente',NULL,NULL),(282,24,9.00,NULL,39,2,'ingrediente',NULL,NULL),(283,24,5.00,NULL,80,3,'ingrediente',NULL,NULL),(284,24,3.10,NULL,86,4,'ingrediente',NULL,NULL),(285,24,35.00,NULL,85,5,'ingrediente',NULL,NULL),(286,24,18.90,NULL,61,6,'ingrediente',NULL,NULL),(287,24,408.00,NULL,73,7,'ingrediente',NULL,NULL),(288,24,150.00,NULL,44,8,'ingrediente',NULL,NULL),(289,25,332.00,NULL,31,1,'ingrediente',NULL,NULL),(290,25,9.00,NULL,39,2,'ingrediente',NULL,NULL),(291,25,5.00,NULL,80,3,'ingrediente',NULL,NULL),(292,25,3.10,NULL,86,4,'ingrediente',NULL,NULL),(293,25,18.90,NULL,61,5,'ingrediente',NULL,NULL),(294,25,465.00,NULL,74,6,'ingrediente',NULL,NULL),(295,25,150.00,NULL,44,7,'ingrediente',NULL,NULL),(296,26,295.00,NULL,31,1,'ingrediente',NULL,NULL),(297,26,6.00,NULL,39,2,'ingrediente',NULL,NULL),(298,26,3.00,NULL,80,3,'ingrediente',NULL,NULL),(299,26,3.10,NULL,86,4,'ingrediente',NULL,NULL),(300,26,35.00,NULL,84,5,'ingrediente',NULL,NULL),(301,26,18.90,NULL,61,6,'ingrediente',NULL,NULL),(302,26,340.00,NULL,75,7,'ingrediente',NULL,NULL),(303,26,173.00,NULL,44,8,'ingrediente',NULL,NULL),(304,27,295.00,NULL,31,1,'ingrediente',NULL,NULL),(305,27,6.00,NULL,39,2,'ingrediente',NULL,NULL),(306,27,3.00,NULL,80,3,'ingrediente',NULL,NULL),(307,27,3.10,NULL,86,4,'ingrediente',NULL,NULL),(308,27,18.90,NULL,61,5,'ingrediente',NULL,NULL),(309,27,340.00,NULL,76,6,'ingrediente',NULL,NULL),(310,27,150.00,NULL,36,7,'ingrediente',NULL,NULL),(311,28,295.00,NULL,31,1,'ingrediente',NULL,NULL),(312,28,6.00,NULL,39,2,'ingrediente',NULL,NULL),(313,28,3.00,NULL,80,3,'ingrediente',NULL,NULL),(314,28,3.10,NULL,86,4,'ingrediente',NULL,NULL),(315,28,17.00,NULL,84,5,'ingrediente',NULL,NULL),(316,28,18.90,NULL,61,6,'ingrediente',NULL,NULL),(317,28,340.00,NULL,100,7,'ingrediente',NULL,NULL),(318,28,150.00,NULL,36,8,'ingrediente',NULL,NULL),(319,29,213.00,NULL,31,1,'ingrediente',NULL,NULL),(320,29,22.00,NULL,39,2,'ingrediente',NULL,NULL),(321,29,4.00,NULL,66,3,'ingrediente',NULL,NULL),(322,29,5.00,NULL,40,4,'ingrediente',NULL,NULL),(323,29,441.00,NULL,37,5,'ingrediente',NULL,NULL),(324,29,63.00,NULL,44,6,'ingrediente',NULL,NULL),(325,30,1.00,NULL,86,1,'ingrediente',NULL,NULL),(326,30,185.00,NULL,78,2,'ingrediente',NULL,NULL),(327,30,134.00,NULL,31,3,'ingrediente',NULL,NULL),(328,30,6.00,NULL,66,4,'ingrediente',NULL,NULL),(329,30,8.00,NULL,39,5,'ingrediente',NULL,NULL),(330,30,7.00,NULL,61,6,'ingrediente',NULL,NULL),(331,30,33.00,NULL,44,7,'ingrediente',NULL,NULL),(332,30,2.00,NULL,40,8,'ingrediente',NULL,NULL),(333,25,35.00,NULL,84,8,'ingrediente',NULL,NULL),(334,27,35.00,NULL,84,8,'ingrediente',NULL,NULL),(335,22,150.00,NULL,83,6,'ingrediente',NULL,NULL),(407,32,100.00,NULL,226,1,'ingrediente',NULL,NULL),(408,32,30.00,NULL,225,2,'ingrediente',NULL,NULL),(409,32,20.00,NULL,244,3,'ingrediente',NULL,NULL),(410,32,10.00,NULL,142,4,'ingrediente',NULL,NULL),(411,32,5.00,NULL,261,5,'ingrediente',NULL,NULL),(412,32,10.00,NULL,269,6,'ingrediente',NULL,NULL),(413,33,240.00,NULL,42,1,'ingrediente',NULL,NULL),(414,33,1.50,NULL,246,2,'ingrediente',NULL,NULL),(415,33,2.00,NULL,231,3,'ingrediente',NULL,NULL),(417,33,2.60,NULL,247,4,'ingrediente',NULL,NULL),(418,33,5.00,NULL,250,5,'ingrediente',NULL,NULL),(419,33,2.50,NULL,254,6,'ingrediente',NULL,NULL),(421,33,35.00,NULL,37,7,'ingrediente',NULL,NULL),(422,33,400.00,NULL,251,8,'ingrediente',NULL,NULL),(423,33,50.00,NULL,252,9,'ingrediente',NULL,NULL),(424,33,50.00,NULL,253,10,'ingrediente',NULL,NULL),(425,33,80.00,NULL,255,11,'ingrediente',NULL,NULL),(426,33,2.00,NULL,249,12,'ingrediente',NULL,NULL),(427,33,4.00,NULL,257,13,'ingrediente',NULL,NULL),(428,33,4.00,NULL,248,14,'ingrediente',NULL,NULL),(429,33,4.00,NULL,256,15,'ingrediente',NULL,NULL),(430,33,3.30,NULL,258,16,'ingrediente',NULL,NULL),(431,33,0.40,NULL,260,17,'ingrediente',NULL,NULL),(432,34,1.00,NULL,42,1,'ingrediente',NULL,NULL),(433,34,1.40,NULL,246,2,'ingrediente',NULL,NULL),(434,34,2.20,NULL,231,3,'ingrediente',NULL,NULL),(435,34,2.00,NULL,247,4,'ingrediente',NULL,NULL),(437,34,60.00,NULL,37,5,'ingrediente',NULL,NULL),(438,34,425.00,NULL,252,6,'ingrediente',NULL,NULL),(439,34,10.00,NULL,251,7,'ingrediente',NULL,NULL),(440,34,3.00,NULL,253,8,'ingrediente',NULL,NULL),(441,34,36.00,NULL,250,9,'ingrediente',NULL,NULL),(442,34,2.40,NULL,255,10,'ingrediente',NULL,NULL),(443,34,2.00,NULL,256,11,'ingrediente',NULL,NULL),(444,34,4.00,NULL,249,12,'ingrediente',NULL,NULL),(445,34,2.50,NULL,248,13,'ingrediente',NULL,NULL),(446,34,4.00,NULL,257,14,'ingrediente',NULL,NULL),(447,34,4.00,NULL,258,15,'ingrediente',NULL,NULL),(448,34,0.40,NULL,260,16,'ingrediente',NULL,NULL),(449,35,180.00,NULL,31,1,'ingrediente',NULL,NULL),(450,35,2.00,NULL,232,2,'ingrediente',NULL,NULL),(451,35,1.00,NULL,231,3,'ingrediente',NULL,NULL),(452,35,130.00,NULL,44,4,'ingrediente',NULL,NULL),(453,35,3.00,NULL,235,5,'ingrediente',NULL,NULL),(454,35,30.00,NULL,56,6,'ingrediente',NULL,NULL),(455,35,2.00,NULL,37,7,'ingrediente',NULL,NULL),(456,35,1.50,NULL,236,8,'ingrediente',NULL,NULL),(457,35,1.00,NULL,33,9,'ingrediente',NULL,NULL),(458,35,1.00,NULL,35,10,'ingrediente',NULL,NULL),(459,35,1.00,NULL,34,11,'ingrediente',NULL,NULL),(460,35,0.40,NULL,32,12,'ingrediente',NULL,NULL),(461,35,0.30,NULL,242,13,'ingrediente',NULL,NULL),(462,36,60.00,NULL,162,1,'ingrediente',NULL,NULL),(463,36,40.00,NULL,142,2,'ingrediente',NULL,NULL),(464,36,55.00,NULL,225,3,'ingrediente',NULL,NULL),(465,36,2.50,NULL,261,4,'ingrediente',NULL,NULL),(466,36,12.00,NULL,244,5,'ingrediente',NULL,NULL),(467,36,0.30,NULL,271,6,'ingrediente',NULL,NULL),(468,37,40.00,NULL,42,1,'ingrediente',NULL,NULL),(469,37,2.00,NULL,247,2,'ingrediente',NULL,NULL),(470,37,0.50,NULL,246,3,'ingrediente',NULL,NULL),(471,37,1.50,NULL,256,4,'ingrediente',NULL,NULL),(472,37,1.50,NULL,231,5,'ingrediente',NULL,NULL),(473,37,40.00,NULL,63,6,'ingrediente',NULL,NULL),(474,37,15.00,NULL,250,7,'ingrediente',NULL,NULL),(475,37,2.00,NULL,249,8,'ingrediente',NULL,NULL),(476,37,1.20,NULL,248,9,'ingrediente',NULL,NULL),(477,37,0.30,NULL,258,10,'ingrediente',NULL,NULL),(580,45,105.00,NULL,31,1,'ingrediente',NULL,NULL),(581,45,1.60,NULL,232,2,'ingrediente',NULL,NULL),(582,45,39.00,NULL,44,3,'ingrediente',NULL,NULL),(583,45,1.40,NULL,33,4,'ingrediente',NULL,NULL),(584,45,1.60,NULL,34,5,'ingrediente',NULL,NULL),(585,45,1.50,NULL,35,6,'ingrediente',NULL,NULL),(586,45,6.40,NULL,263,7,'ingrediente',NULL,NULL),(587,45,1.60,NULL,264,8,'ingrediente',NULL,NULL),(588,45,0.50,NULL,241,9,'ingrediente',NULL,NULL),(607,47,210.00,NULL,31,1,'ingrediente',NULL,NULL),(608,47,1.40,NULL,232,2,'ingrediente',NULL,NULL),(609,47,0.75,NULL,231,3,'ingrediente',NULL,NULL),(610,47,2.90,NULL,244,4,'ingrediente',NULL,NULL),(611,47,28.00,NULL,268,5,'ingrediente',NULL,NULL),(612,47,69.00,NULL,44,6,'ingrediente',NULL,NULL),(613,47,2.50,NULL,35,7,'ingrediente',NULL,NULL),(614,47,2.60,NULL,34,8,'ingrediente',NULL,NULL),(615,47,1.20,NULL,33,9,'ingrediente',NULL,NULL),(616,47,1.00,NULL,241,10,'ingrediente',NULL,NULL),(660,51,100.00,NULL,226,1,'ingrediente',NULL,NULL),(661,51,0.80,NULL,231,2,'ingrediente',NULL,NULL),(662,51,1.80,NULL,232,3,'ingrediente',NULL,NULL),(663,51,2.20,NULL,236,4,'ingrediente',NULL,NULL),(664,51,2.00,NULL,225,5,'ingrediente',NULL,NULL),(665,51,70.00,NULL,252,6,'ingrediente',NULL,NULL),(666,51,8.00,NULL,251,7,'ingrediente',NULL,NULL),(667,51,5.00,NULL,244,8,'ingrediente',NULL,NULL),(668,51,4.00,NULL,269,9,'ingrediente',NULL,NULL),(669,51,1.00,NULL,261,10,'ingrediente',NULL,NULL),(670,51,32.00,NULL,22,11,'ingrediente',NULL,NULL),(711,55,5.00,NULL,226,1,'ingrediente',NULL,NULL),(712,55,0.25,NULL,231,2,'ingrediente',NULL,NULL),(713,55,0.20,NULL,232,3,'ingrediente',NULL,NULL),(714,55,2.90,NULL,37,4,'ingrediente',NULL,NULL),(715,55,0.50,NULL,236,5,'ingrediente',NULL,NULL),(716,55,0.50,NULL,225,6,'ingrediente',NULL,NULL),(717,55,11.30,NULL,161,7,'ingrediente',NULL,NULL),(718,56,4.00,NULL,226,1,'ingrediente',NULL,NULL),(719,56,0.16,NULL,232,2,'ingrediente',NULL,NULL),(720,56,0.20,NULL,231,3,'ingrediente',NULL,NULL),(721,56,0.40,NULL,273,4,'ingrediente',NULL,NULL),(722,56,0.20,NULL,37,5,'ingrediente',NULL,NULL),(723,56,1.20,NULL,63,6,'ingrediente',NULL,NULL),(724,56,0.80,NULL,225,7,'ingrediente',NULL,NULL),(725,56,9.20,NULL,161,8,'ingrediente',NULL,NULL),(737,1,115.00,NULL,31,1,'ingrediente',NULL,NULL),(738,1,66.00,NULL,44,2,'ingrediente',NULL,NULL),(739,1,1.30,NULL,33,3,'ingrediente',NULL,NULL),(740,1,1.30,NULL,34,4,'ingrediente',NULL,NULL),(741,1,1.60,NULL,35,5,'ingrediente',NULL,NULL),(742,1,0.50,NULL,241,6,'ingrediente',NULL,NULL),(760,5,100.00,NULL,31,1,'ingrediente',NULL,NULL),(761,5,0.80,NULL,232,2,'ingrediente',NULL,NULL),(762,5,18.00,NULL,23,3,'ingrediente',NULL,NULL),(763,5,0.80,NULL,236,4,'ingrediente',NULL,NULL),(764,5,50.00,NULL,44,5,'ingrediente',NULL,NULL),(765,5,1.00,NULL,33,6,'ingrediente',NULL,NULL),(766,5,1.30,NULL,34,7,'ingrediente',NULL,NULL),(767,5,1.20,NULL,35,8,'ingrediente',NULL,NULL),(768,5,0.80,NULL,32,9,'ingrediente',NULL,NULL),(825,19,95.00,NULL,31,1,'ingrediente',NULL,NULL),(826,19,0.80,NULL,232,2,'ingrediente',NULL,NULL),(827,19,0.30,NULL,231,3,'ingrediente',NULL,NULL),(828,19,5.00,NULL,63,4,'ingrediente',NULL,NULL),(829,19,1.00,NULL,37,5,'ingrediente',NULL,NULL),(830,19,66.00,NULL,252,6,'ingrediente',NULL,NULL),(831,19,33.00,NULL,251,7,'ingrediente',NULL,NULL),(832,19,10.00,NULL,44,8,'ingrediente',NULL,NULL),(833,19,1.00,NULL,56,9,'ingrediente',NULL,NULL),(834,19,0.50,NULL,35,10,'ingrediente',NULL,NULL),(835,19,0.40,NULL,33,11,'ingrediente',NULL,NULL),(836,19,0.60,NULL,34,12,'ingrediente',NULL,NULL),(837,19,0.40,NULL,241,13,'ingrediente',NULL,NULL),(966,68,60.00,0,302,1,'ingrediente',NULL,NULL),(967,68,40.00,0,225,2,'ingrediente',NULL,NULL),(1016,39,60.00,0,31,1,'ingrediente',NULL,NULL),(1017,39,0.50,0,231,2,'ingrediente',NULL,NULL),(1018,39,1.00,0,232,3,'ingrediente',NULL,NULL),(1019,39,22.00,0,63,4,'ingrediente',NULL,NULL),(1020,39,10.00,0,44,5,'ingrediente',NULL,NULL),(1021,39,1.00,0,236,6,'ingrediente',NULL,NULL),(1022,39,0.00,0,NULL,7,'instruccion','Dispersar por 1 hora hasta molienda (Hegman) y agregar',NULL),(1023,39,40.00,0,31,8,'ingrediente',NULL,NULL),(1024,39,35.00,0,44,9,'ingrediente',NULL,NULL),(1025,39,1.00,0,33,10,'ingrediente',NULL,NULL),(1026,39,1.20,0,34,11,'ingrediente',NULL,NULL),(1027,39,1.00,0,35,12,'ingrediente',NULL,NULL),(1028,39,0.40,0,241,13,'ingrediente',NULL,NULL),(1029,39,0.20,0,242,14,'ingrediente',NULL,NULL),(1030,18,160.00,0,31,1,'ingrediente',NULL,NULL),(1031,18,1.50,0,232,2,'ingrediente',NULL,NULL),(1032,18,1.00,0,231,3,'ingrediente',NULL,NULL),(1033,18,1.50,0,236,4,'ingrediente',NULL,NULL),(1034,18,30.00,0,44,5,'ingrediente',NULL,NULL),(1035,18,60.00,0,252,6,'ingrediente',NULL,NULL),(1036,18,25.00,0,37,7,'ingrediente',NULL,NULL),(1037,18,50.00,0,251,8,'ingrediente',NULL,NULL),(1038,18,55.00,0,44,9,'ingrediente',NULL,NULL),(1039,18,1.00,0,41,10,'ingrediente',NULL,NULL),(1040,18,52.00,0,42,11,'ingrediente',NULL,NULL),(1041,18,1.00,0,35,12,'ingrediente',NULL,NULL),(1042,18,1.20,0,34,13,'ingrediente',NULL,NULL),(1043,18,0.80,0,33,14,'ingrediente',NULL,NULL),(1044,18,0.80,0,241,15,'ingrediente',NULL,NULL),(1045,54,120.00,0,226,1,'ingrediente',NULL,NULL),(1046,54,2.00,0,272,2,'ingrediente',NULL,NULL),(1047,54,2.50,0,232,3,'ingrediente',NULL,NULL),(1048,54,22.00,0,225,4,'ingrediente',NULL,NULL),(1049,54,40.00,0,64,5,'ingrediente',NULL,NULL),(1050,54,2.00,0,236,6,'ingrediente',NULL,NULL),(1051,54,0.00,0,NULL,7,'instruccion','Dispersar hasta molienda 7 unidades Hegman',NULL),(1052,54,100.00,0,252,8,'ingrediente',NULL,NULL),(1053,54,8.00,0,261,9,'ingrediente',NULL,NULL),(1054,54,50.00,0,251,10,'ingrediente',NULL,NULL),(1055,54,40.00,0,226,11,'ingrediente',NULL,NULL),(1056,54,28.00,0,244,12,'ingrediente',NULL,NULL),(1057,54,1.50,0,270,13,'ingrediente',NULL,NULL),(1058,54,16.00,0,269,14,'ingrediente',NULL,NULL),(1059,54,20.00,0,225,15,'ingrediente',NULL,NULL),(1060,50,100.00,0,226,1,'ingrediente',NULL,NULL),(1061,50,5.00,0,232,2,'ingrediente',NULL,NULL),(1062,50,1.50,0,231,3,'ingrediente',NULL,NULL),(1063,50,15.00,0,225,4,'ingrediente',NULL,NULL),(1064,50,4.00,0,236,5,'ingrediente',NULL,NULL),(1065,50,68.00,0,37,6,'ingrediente',NULL,NULL),(1066,50,50.00,0,251,7,'ingrediente',NULL,NULL),(1067,50,165.00,0,252,8,'ingrediente',NULL,NULL),(1068,50,2.40,0,261,9,'ingrediente',NULL,NULL),(1069,50,60.00,0,226,10,'ingrediente',NULL,NULL),(1070,50,15.00,0,244,11,'ingrediente',NULL,NULL),(1071,50,3.00,0,22,12,'ingrediente',NULL,NULL),(1072,50,10.00,0,142,13,'ingrediente',NULL,NULL),(1073,50,8.00,0,269,14,'ingrediente',NULL,NULL),(1074,50,30.00,0,225,15,'ingrediente',NULL,NULL),(1075,53,13.00,0,226,1,'ingrediente',NULL,NULL),(1076,53,0.25,0,231,2,'ingrediente',NULL,NULL),(1077,53,0.75,0,232,3,'ingrediente',NULL,NULL),(1078,53,12.00,0,56,4,'ingrediente',NULL,NULL),(1079,53,22.00,0,226,5,'ingrediente',NULL,NULL),(1080,53,2.00,0,225,6,'ingrediente',NULL,NULL),(1081,53,2.00,0,142,7,'ingrediente',NULL,NULL),(1082,53,3.00,0,244,8,'ingrediente',NULL,NULL),(1083,53,1.50,0,261,9,'ingrediente',NULL,NULL),(1084,53,3.50,0,225,10,'ingrediente',NULL,NULL),(1085,53,0.05,0,271,11,'ingrediente',NULL,NULL),(1086,53,0.23,0,272,12,'ingrediente',NULL,NULL),(1087,53,4.00,0,252,13,'ingrediente',NULL,NULL),(1088,53,20.00,0,251,14,'ingrediente',NULL,NULL),(1089,48,120.00,0,226,1,'ingrediente',NULL,NULL),(1090,48,1.50,0,338,2,'ingrediente',NULL,NULL),(1091,48,25.00,0,225,3,'ingrediente',NULL,NULL),(1092,48,2.00,0,232,4,'ingrediente',NULL,NULL),(1093,48,3.00,0,236,5,'ingrediente',NULL,NULL),(1094,48,78.00,0,37,6,'ingrediente',NULL,NULL),(1095,48,150.00,0,252,7,'ingrediente',NULL,NULL),(1096,48,0.00,0,NULL,8,'instruccion','Dispersar hasta molienda 6 U Hegman y agregar',NULL),(1097,48,40.00,0,226,9,'ingrediente',NULL,NULL),(1098,48,25.00,0,225,10,'ingrediente',NULL,NULL),(1099,48,50.00,0,347,11,'ingrediente',NULL,NULL),(1100,48,4.50,0,245,12,'ingrediente',NULL,NULL),(1101,48,10.00,0,270,13,'ingrediente',NULL,NULL),(1102,48,18.00,0,244,14,'ingrediente',NULL,NULL),(1103,49,60.00,0,226,1,'ingrediente',NULL,NULL),(1104,49,1.00,0,231,2,'ingrediente',NULL,NULL),(1105,49,1.30,0,232,3,'ingrediente',NULL,NULL),(1106,49,2.50,0,236,4,'ingrediente',NULL,NULL),(1107,49,10.00,0,225,5,'ingrediente',NULL,NULL),(1108,49,80.00,0,252,6,'ingrediente',NULL,NULL),(1109,49,8.00,0,251,7,'ingrediente',NULL,NULL),(1110,49,32.00,0,22,8,'ingrediente',NULL,NULL),(1111,49,20.00,0,226,9,'ingrediente',NULL,NULL),(1112,49,9.00,0,244,10,'ingrediente',NULL,NULL),(1113,49,7.60,0,142,11,'ingrediente',NULL,NULL),(1114,49,8.00,0,269,12,'ingrediente',NULL,NULL),(1115,49,14.00,0,225,13,'ingrediente',NULL,NULL),(1116,49,1.00,0,261,14,'ingrediente',NULL,NULL),(1117,52,76.30,0,226,1,'ingrediente',NULL,NULL),(1118,52,1.40,0,231,2,'ingrediente',NULL,NULL),(1119,52,5.00,0,232,3,'ingrediente',NULL,NULL),(1120,52,20.00,0,225,4,'ingrediente',NULL,NULL),(1121,52,3.80,0,37,5,'ingrediente',NULL,NULL),(1122,52,16.00,0,252,6,'ingrediente',NULL,NULL),(1123,52,10.00,0,236,7,'ingrediente',NULL,NULL),(1124,52,100.00,0,251,8,'ingrediente',NULL,NULL),(1125,52,17.50,0,63,9,'ingrediente',NULL,NULL),(1126,52,5.00,0,261,10,'ingrediente',NULL,NULL),(1127,52,26.00,0,225,11,'ingrediente',NULL,NULL),(1128,52,1.90,0,56,12,'ingrediente',NULL,NULL),(1144,14,160.00,0,31,1,'ingrediente',NULL,NULL),(1145,14,1.50,0,232,2,'ingrediente',NULL,NULL),(1146,14,1.00,0,231,3,'ingrediente',NULL,NULL),(1147,14,35.00,0,44,4,'ingrediente',NULL,NULL),(1148,14,20.00,0,37,5,'ingrediente',NULL,NULL),(1149,14,1.50,0,236,6,'ingrediente',NULL,NULL),(1150,14,120.00,0,252,7,'ingrediente',NULL,NULL),(1151,14,35.00,0,44,8,'ingrediente',NULL,NULL),(1152,14,1.00,0,41,9,'ingrediente',NULL,NULL),(1153,14,65.00,0,42,10,'ingrediente',NULL,NULL),(1154,14,0.50,0,22,11,'ingrediente',NULL,NULL),(1155,14,1.00,0,35,12,'ingrediente',NULL,NULL),(1156,14,0.80,0,34,13,'ingrediente',NULL,NULL),(1157,14,0.50,0,33,14,'ingrediente',NULL,NULL),(1158,14,0.40,0,241,15,'ingrediente',NULL,NULL),(1159,15,210.00,0,31,1,'ingrediente',NULL,NULL),(1160,15,1.50,0,232,2,'ingrediente',NULL,NULL),(1161,15,0.60,0,231,3,'ingrediente',NULL,NULL),(1162,15,15.00,0,44,4,'ingrediente',NULL,NULL),(1163,15,1.50,0,236,5,'ingrediente',NULL,NULL),(1164,15,130.00,0,252,6,'ingrediente',NULL,NULL),(1165,15,38.00,0,22,7,'ingrediente',NULL,NULL),(1166,15,0.80,0,33,8,'ingrediente',NULL,NULL),(1167,15,1.00,0,34,9,'ingrediente',NULL,NULL),(1168,15,1.00,0,35,10,'ingrediente',NULL,NULL),(1169,15,45.00,0,44,11,'ingrediente',NULL,NULL),(1170,15,0.80,0,241,12,'ingrediente',NULL,NULL),(1171,46,35.00,0,265,1,'ingrediente',NULL,NULL),(1172,46,1.20,0,232,2,'ingrediente',NULL,NULL),(1173,46,0.50,0,231,3,'ingrediente',NULL,NULL),(1174,46,6.50,0,37,4,'ingrediente',NULL,NULL),(1175,46,25.00,0,267,5,'ingrediente',NULL,NULL),(1176,46,4.00,0,63,6,'ingrediente',NULL,NULL),(1177,46,0.00,0,NULL,7,'instruccion','Dispersar por 1 hora hasta molienda 7 U Hegman y agregar',NULL),(1178,46,38.00,0,252,8,'ingrediente',NULL,NULL),(1179,46,38.00,0,251,9,'ingrediente',NULL,NULL),(1180,46,20.00,0,225,10,'ingrediente',NULL,NULL),(1181,46,15.00,0,266,11,'ingrediente',NULL,NULL),(1182,46,3.00,0,244,12,'ingrediente',NULL,NULL),(1183,46,50.00,0,265,13,'ingrediente',NULL,NULL),(1184,46,0.50,0,33,14,'ingrediente',NULL,NULL),(1185,46,0.60,0,35,15,'ingrediente',NULL,NULL),(1186,46,0.50,0,34,16,'ingrediente',NULL,NULL),(1187,46,0.60,0,22,17,'ingrediente',NULL,NULL),(1188,46,1.20,0,56,18,'ingrediente',NULL,NULL),(1189,46,30.00,0,225,19,'ingrediente',NULL,NULL),(1190,11,100.00,0,31,1,'ingrediente',NULL,NULL),(1191,11,16.00,0,74,2,'ingrediente',NULL,NULL),(1192,11,1.00,0,232,3,'ingrediente',NULL,NULL),(1193,11,0.50,0,231,4,'ingrediente',NULL,NULL),(1194,11,0.75,0,236,5,'ingrediente',NULL,NULL),(1195,11,10.00,0,44,6,'ingrediente',NULL,NULL),(1196,11,0.00,0,NULL,7,'instruccion','Moler hasta 7 UH durante 1 hora y media y agregar',NULL),(1197,11,1.00,0,235,8,'ingrediente',NULL,NULL),(1198,11,25.00,0,44,9,'ingrediente',NULL,NULL),(1199,11,0.50,0,41,10,'ingrediente',NULL,NULL),(1200,11,15.00,0,42,11,'ingrediente',NULL,NULL),(1201,11,0.50,0,33,12,'ingrediente',NULL,NULL),(1202,11,0.50,0,34,13,'ingrediente',NULL,NULL),(1203,11,0.50,0,35,14,'ingrediente',NULL,NULL),(1204,11,0.40,0,241,15,'ingrediente',NULL,NULL),(1205,44,46.00,0,31,1,'ingrediente',NULL,NULL),(1206,44,0.20,0,231,2,'ingrediente',NULL,NULL),(1207,44,0.60,0,232,3,'ingrediente',NULL,NULL),(1208,44,0.09,0,233,4,'ingrediente',NULL,NULL),(1209,44,10.20,0,37,5,'ingrediente',NULL,NULL),(1210,44,7.00,0,44,6,'ingrediente',NULL,NULL),(1211,44,0.50,0,41,7,'ingrediente',NULL,NULL),(1212,44,16.00,0,42,8,'ingrediente',NULL,NULL),(1213,44,7.00,0,44,9,'ingrediente',NULL,NULL),(1214,44,0.32,0,33,10,'ingrediente',NULL,NULL),(1215,44,0.50,0,35,11,'ingrediente',NULL,NULL),(1216,44,0.50,0,34,12,'ingrediente',NULL,NULL),(1217,44,0.20,0,241,13,'ingrediente',NULL,NULL),(1218,40,180.00,0,31,1,'ingrediente',NULL,NULL),(1219,40,0.50,0,231,2,'ingrediente',NULL,NULL),(1220,40,1.50,0,232,3,'ingrediente',NULL,NULL),(1221,40,30.00,0,22,4,'ingrediente',NULL,NULL),(1222,40,30.00,0,44,5,'ingrediente',NULL,NULL),(1223,40,1.00,0,236,6,'ingrediente',NULL,NULL),(1224,40,0.50,0,41,7,'ingrediente',NULL,NULL),(1225,40,24.00,0,42,8,'ingrediente',NULL,NULL),(1226,40,1.20,0,35,9,'ingrediente',NULL,NULL),(1227,40,1.00,0,33,10,'ingrediente',NULL,NULL),(1228,40,1.30,0,34,11,'ingrediente',NULL,NULL),(1229,40,0.80,0,32,12,'ingrediente',NULL,NULL),(1230,40,0.20,0,242,13,'ingrediente',NULL,NULL),(1231,40,5.00,0,44,14,'ingrediente',NULL,NULL),(1232,41,180.00,0,31,1,'ingrediente',NULL,NULL),(1233,41,2.00,0,231,2,'ingrediente',NULL,NULL),(1234,41,5.00,0,232,3,'ingrediente',NULL,NULL),(1235,41,0.28,0,233,4,'ingrediente',NULL,NULL),(1236,41,25.00,0,235,5,'ingrediente',NULL,NULL),(1237,41,100.00,0,37,6,'ingrediente',NULL,NULL),(1238,41,5.00,0,236,7,'ingrediente',NULL,NULL),(1239,41,30.00,0,44,8,'ingrediente',NULL,NULL),(1240,41,0.00,0,NULL,9,'instruccion','Dispersar x 1 hora y media hasta molienda y agregar',NULL),(1241,41,200.00,0,31,10,'ingrediente',NULL,NULL),(1242,41,185.00,0,44,11,'ingrediente',NULL,NULL),(1243,41,2.50,0,33,12,'ingrediente',NULL,NULL),(1244,41,3.00,0,35,13,'ingrediente',NULL,NULL),(1245,41,3.50,0,34,14,'ingrediente',NULL,NULL),(1246,41,1.80,0,241,15,'ingrediente',NULL,NULL),(1247,41,0.40,0,242,16,'ingrediente',NULL,NULL),(1248,42,80.00,0,31,1,'ingrediente',NULL,NULL),(1249,42,1.50,0,232,2,'ingrediente',NULL,NULL),(1250,42,0.50,0,231,3,'ingrediente',NULL,NULL),(1251,42,5.00,0,44,4,'ingrediente',NULL,NULL),(1252,42,35.00,0,37,5,'ingrediente',NULL,NULL),(1253,42,6.00,0,236,6,'ingrediente',NULL,NULL),(1254,42,6.00,0,235,7,'ingrediente',NULL,NULL),(1255,42,0.00,0,NULL,8,'instruccion','Dispersar x hora y media, verificar molienda 7 UH y agregar',NULL),(1256,42,40.00,0,44,9,'ingrediente',NULL,NULL),(1257,42,10.00,0,31,10,'ingrediente',NULL,NULL),(1258,42,0.90,0,35,11,'ingrediente',NULL,NULL),(1259,42,0.80,0,33,12,'ingrediente',NULL,NULL),(1260,42,0.85,0,34,13,'ingrediente',NULL,NULL),(1261,42,0.40,0,241,14,'ingrediente',NULL,NULL),(1262,42,0.50,0,242,15,'ingrediente',NULL,NULL),(1263,42,0.10,0,204,16,'ingrediente',NULL,NULL),(1264,2,180.00,0,31,1,'ingrediente',NULL,NULL),(1265,2,2.00,0,231,2,'ingrediente',NULL,NULL),(1266,2,5.00,0,232,3,'ingrediente',NULL,NULL),(1267,2,0.28,0,233,4,'ingrediente',NULL,NULL),(1268,2,80.00,0,37,5,'ingrediente',NULL,NULL),(1269,2,20.00,0,235,6,'ingrediente',NULL,NULL),(1270,2,3.00,0,236,7,'ingrediente',NULL,NULL),(1271,2,0.00,0,NULL,8,'instruccion','Moler',NULL),(1272,2,180.00,0,31,9,'ingrediente',NULL,NULL),(1273,2,210.00,0,44,10,'ingrediente','REVISAR: la libreta parte el Varsol en 2 (en cunetes); aqui queda el total del sistema',NULL),(1274,2,2.00,0,41,11,'ingrediente',NULL,NULL),(1275,2,95.00,0,42,12,'ingrediente',NULL,NULL),(1276,2,2.00,0,33,13,'ingrediente',NULL,NULL),(1277,2,2.00,0,34,14,'ingrediente',NULL,NULL),(1278,2,2.00,0,35,15,'ingrediente',NULL,NULL),(1279,2,2.00,0,241,16,'ingrediente',NULL,NULL),(1280,2,0.35,0,242,17,'ingrediente',NULL,NULL),(1281,38,80.00,0,42,1,'ingrediente',NULL,NULL),(1282,38,0.70,0,231,2,'ingrediente',NULL,NULL),(1283,38,1.20,0,249,3,'ingrediente',NULL,NULL),(1284,38,0.60,0,247,4,'ingrediente',NULL,NULL),(1285,38,0.60,0,246,5,'ingrediente',NULL,NULL),(1286,38,1.00,0,248,6,'ingrediente',NULL,NULL),(1287,38,18.00,0,63,7,'ingrediente',NULL,NULL),(1288,38,40.00,0,252,8,'ingrediente',NULL,NULL),(1289,38,15.00,0,251,9,'ingrediente',NULL,NULL),(1290,38,40.00,0,255,10,'ingrediente',NULL,NULL),(1291,38,2.10,0,250,11,'ingrediente',NULL,NULL),(1292,38,0.70,0,254,12,'ingrediente',NULL,NULL),(1293,38,1.00,0,256,13,'ingrediente',NULL,NULL),(1294,38,0.90,0,257,14,'ingrediente',NULL,NULL),(1295,38,0.60,0,248,15,'ingrediente',NULL,NULL),(1296,38,0.40,0,260,16,'ingrediente',NULL,NULL),(1297,38,0.60,0,249,17,'ingrediente',NULL,NULL),(1298,38,1.50,0,258,18,'ingrediente',NULL,NULL),(1299,43,40.00,0,31,1,'ingrediente',NULL,NULL),(1300,43,0.20,0,231,2,'ingrediente',NULL,NULL),(1301,43,0.70,0,232,3,'ingrediente',NULL,NULL),(1302,43,0.09,0,233,4,'ingrediente',NULL,NULL),(1303,43,9.00,0,37,5,'ingrediente',NULL,NULL),(1304,43,1.90,0,251,6,'ingrediente',NULL,NULL),(1305,43,6.00,0,44,7,'ingrediente',NULL,NULL),(1306,43,0.30,0,41,8,'ingrediente',NULL,NULL),(1307,43,11.00,0,42,9,'ingrediente',NULL,NULL),(1308,43,17.50,0,44,10,'ingrediente',NULL,NULL),(1309,43,0.25,0,33,11,'ingrediente',NULL,NULL),(1310,43,0.35,0,35,12,'ingrediente',NULL,NULL),(1311,43,0.40,0,34,13,'ingrediente',NULL,NULL),(1312,43,0.25,0,241,14,'ingrediente',NULL,NULL),(1313,31,180.00,0,42,1,'ingrediente',NULL,NULL),(1314,31,1.60,0,246,2,'ingrediente',NULL,NULL),(1315,31,2.50,0,231,3,'ingrediente',NULL,NULL),(1316,31,2.50,0,247,4,'ingrediente',NULL,NULL),(1317,31,2.50,0,248,5,'ingrediente',NULL,NULL),(1318,31,2.00,0,249,6,'ingrediente',NULL,NULL),(1319,31,10.00,0,250,7,'ingrediente',NULL,NULL),(1320,31,95.00,0,37,8,'ingrediente',NULL,NULL),(1321,31,200.00,0,251,9,'ingrediente',NULL,NULL),(1322,31,60.00,0,252,10,'ingrediente',NULL,NULL),(1323,31,80.00,0,253,11,'ingrediente',NULL,NULL),(1324,31,80.00,0,235,12,'ingrediente',NULL,NULL),(1325,31,5.00,0,254,13,'ingrediente',NULL,NULL),(1326,31,170.00,0,255,14,'ingrediente',NULL,NULL),(1327,31,4.00,0,256,15,'ingrediente',NULL,NULL),(1328,31,3.00,0,249,16,'ingrediente',NULL,NULL),(1329,31,127.00,0,42,17,'ingrediente',NULL,NULL),(1330,31,4.00,0,257,18,'ingrediente',NULL,'pH'),(1331,31,3.00,0,248,19,'ingrediente',NULL,NULL),(1332,31,2.00,0,258,20,'ingrediente',NULL,'asociativo'),(1333,31,2.00,0,259,21,'ingrediente',NULL,NULL),(1334,31,0.40,0,260,22,'ingrediente',NULL,'fragancia pino'),(1335,57,55.00,33,226,1,'ingrediente',NULL,NULL),(1336,57,20.00,12,225,2,'ingrediente',NULL,NULL),(1337,57,1.50,1,232,3,'ingrediente',NULL,NULL),(1338,57,1.50,1,231,4,'ingrediente',NULL,NULL),(1339,57,0.50,0,63,5,'ingrediente',NULL,NULL),(1340,57,28.00,17,74,6,'ingrediente',NULL,NULL),(1341,57,0.00,0,NULL,7,'instruccion','Dispersar hasta molienda 7 U Hegman y agregar',NULL),(1342,57,34.00,20,226,8,'ingrediente',NULL,NULL),(1343,57,3.00,2,261,9,'ingrediente',NULL,NULL),(1344,57,15.00,9,244,10,'ingrediente',NULL,NULL),(1345,57,8.00,5,270,11,'ingrediente',NULL,NULL),(1346,57,0.50,0,271,12,'ingrediente',NULL,NULL),(1438,99,240.00,NULL,42,1,'ingrediente',NULL,NULL),(1439,99,3.00,NULL,250,2,'ingrediente',NULL,NULL),(1440,99,1.50,NULL,231,3,'ingrediente',NULL,NULL),(1441,99,0.70,NULL,247,4,'ingrediente',NULL,NULL),(1442,99,1.20,NULL,248,5,'ingrediente',NULL,NULL),(1443,99,2.20,NULL,249,6,'ingrediente',NULL,NULL),(1444,99,35.00,NULL,37,7,'ingrediente',NULL,NULL),(1445,99,50.00,NULL,253,8,'ingrediente',NULL,NULL),(1446,99,30.00,NULL,252,9,'ingrediente',NULL,NULL),(1447,99,125.00,NULL,251,10,'ingrediente',NULL,NULL),(1448,99,60.00,NULL,255,11,'ingrediente',NULL,NULL),(1449,99,2.60,NULL,256,12,'ingrediente',NULL,NULL),(1450,99,1.70,NULL,254,13,'ingrediente',NULL,NULL),(1451,99,2.30,NULL,257,14,'ingrediente',NULL,NULL),(1452,99,0.60,NULL,260,15,'ingrediente',NULL,NULL),(1453,99,0.40,NULL,249,16,'ingrediente',NULL,NULL),(1454,99,0.80,NULL,248,17,'ingrediente',NULL,NULL),(1455,99,2.50,NULL,258,18,'ingrediente',NULL,NULL),(1456,98,240.00,NULL,42,1,'ingrediente',NULL,NULL),(1457,98,0.80,NULL,246,2,'ingrediente',NULL,NULL),(1458,98,0.80,NULL,231,3,'ingrediente',NULL,NULL),(1459,98,0.60,NULL,247,4,'ingrediente',NULL,NULL),(1460,98,2.50,NULL,249,5,'ingrediente',NULL,NULL),(1461,98,2.60,NULL,248,6,'ingrediente',NULL,NULL),(1462,98,1.10,NULL,460,7,'ingrediente',NULL,NULL),(1463,98,12.00,NULL,37,8,'ingrediente',NULL,NULL),(1464,98,35.00,NULL,252,9,'ingrediente',NULL,NULL),(1465,98,35.00,NULL,253,10,'ingrediente',NULL,NULL),(1466,98,180.00,NULL,251,11,'ingrediente',NULL,NULL),(1467,98,1.50,NULL,250,12,'ingrediente',NULL,NULL),(1468,98,2.50,NULL,256,13,'ingrediente',NULL,NULL),(1469,98,NULL,NULL,NULL,14,'instruccion','PENDIENTE: definir insumo PVA (RESIFLEX 610 vs F55M) -- cantidad real 3 kg, no incluida en el costeo todavia',NULL),(1470,98,0.70,NULL,258,15,'ingrediente',NULL,NULL),(1471,98,0.40,NULL,260,16,'ingrediente',NULL,NULL),(1472,98,1.00,NULL,254,17,'ingrediente',NULL,NULL);
/*!40000 ALTER TABLE `item_general_formulaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_proveedor`
--

DROP TABLE IF EXISTS `item_proveedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_proveedor` (
  `id_item_proveedor` int NOT NULL AUTO_INCREMENT,
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
  `factor_conversion` decimal(15,6) NOT NULL DEFAULT '1.000000',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_item_proveedor`),
  UNIQUE KEY `id_item_proveedor_UNIQUE` (`id_item_proveedor`),
  KEY `fk_item_proveedor_proveedores1_idx` (`proveedor_id`),
  KEY `idx_item_proveedor_deleted_at` (`deleted_at`),
  KEY `fk_ip_item_general` (`item_general_id`),
  CONSTRAINT `fk_ip_item_general` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ip_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=265 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_proveedor`
--

LOCK TABLES `item_proveedor` WRITE;
/*!40000 ALTER TABLE `item_proveedor` DISABLE KEYS */;
INSERT INTO `item_proveedor` VALUES (40,'TALCO TY 400 G','QUI-MAT-0001','Materia Prima',1504.00,1790.00,1,NULL,23,252,NULL,1.000000,NULL),(41,'OMIYACARB UF','QUI-MAT-0002','Materia Prima',1828.00,2175.00,1,NULL,23,235,NULL,1.000000,NULL),(42,'COLARDIT ANTIESPUMANTE','QUI-ADIT-0001','Insumo',7143.00,8500.00,1,NULL,23,NULL,NULL,1.000000,NULL),(43,'COLARCRYL ACRONAL 50','QUI-ADIT-0002','Insumo',5252.00,6250.00,1,NULL,23,NULL,NULL,1.000000,NULL),(44,'COLARCIDE BACTERICIDA','QUI-BIO-0001','Insumo',6387.00,7600.00,1,NULL,23,256,9,1.000000,NULL),(45,'COLARDIT REGULADOR PH','QUI-ADIT-0003','Insumo',6555.00,7800.00,1,NULL,23,460,NULL,1.000000,NULL),(46,'DISPERSANTE AGUA','QUI-ADIT-0004','Insumo',5378.00,6400.00,1,'',23,230,NULL,1.000000,NULL),(47,'COLARDIT AS ASOCIATIVO','QUI-ADIT-0005','Insumo',9916.00,11800.00,1,NULL,23,258,9,1.000000,NULL),(48,'COLARBAG FUNGICIDA','QUI-BIO-0002','Insumo',20840.00,24800.00,1,NULL,23,259,9,1.000000,NULL),(49,'CAOLIN BRITEX CALCINADO','QUI-MAT-0003','Materia Prima',2605.00,3100.00,1,'',23,351,NULL,1.000000,NULL),(50,'WEKCELO C7 CELULOSICO','QUI-ESP-0001','Insumo',18403.00,21900.00,1,NULL,23,248,9,1.000000,NULL),(51,'CARBONATO DE CALCIO ESTUCO M325','CARBM325','Materia Prima',300.00,357.00,1,'',24,352,9,1.000000,NULL),(52,'CARBONATO DE CALCIO VINILO M600','CARBM600','Materia Prima',460.00,547.00,1,'',24,353,9,1.000000,NULL),(53,'RESINA EPOXICA','NPSN CHINA','Materia Prima',15069.00,17932.00,1,'',25,226,9,1.000000,NULL),(54,'RESINA KR 828 100%','KER828','Materia Prima',10300.00,12257.00,1,'',26,NULL,9,1.000000,NULL),(55,'ENDURECEDOR 100%','NT-1515X70','Materia Prima',21200.00,25228.00,1,'',26,302,9,1.000000,NULL),(56,'ENDURECEDOR 100%','NX-5454','Materia Prima',19700.00,23443.00,1,'',26,302,9,1.000000,'2026-06-27 17:06:50'),(57,'XILOL','XIL21288','Materia Prima',6120.00,7283.00,1,'',27,225,9,1.000000,NULL),(58,'THINNER ','TH2092','Materia Prima',15961.00,18994.00,1,'',27,NULL,3,1.000000,NULL),(59,'VARSOL','VAR9218','Materia Prima',5961.00,7094.00,1,'',27,44,NULL,1.000000,NULL),(60,'VARSOL','VARPD281','Materia Prima',1230.00,1464.00,1,'',28,44,NULL,1.000000,NULL),(61,'THINNER','TH921298','Materia Prima',880.00,1047.00,1,'',28,NULL,3,1.000000,NULL),(62,'RESINA MEDIA EN SOYA AL 50%','RA-7','Materia Prima',6200.00,7378.00,1,'',29,31,9,1.000000,NULL),(63,'RESINA UREA FORMALDEHIDO','RN-9E','Materia Prima',8050.00,9580.00,1,'',29,NULL,9,1.000000,NULL),(64,'RESINA CORTA EN PALMISTE AL 55%','RA-4 ','Materia Prima',7350.00,8747.00,1,'',29,NULL,9,1.000000,NULL),(65,'RESINA CORTA EN SOYA AL 53%','RA-15','Materia Prima',6900.00,8211.00,1,'',29,NULL,9,1.000000,NULL),(66,'RESINA CORTA EN SOYA AL 55% (+ SOL)','RA-15M','Materia Prima',6900.00,8211.00,1,'',29,NULL,9,1.000000,NULL),(67,'RESINA CORTA EN SOYA AL 45%','RA-16','Materia Prima',6950.00,8271.00,1,'',29,NULL,9,1.000000,NULL),(68,'RESINA MALEICA SOLIDA','RM-1','Materia Prima',11300.00,13447.00,1,'',29,NULL,9,1.000000,NULL),(69,'RESINA MEDIA EN TOFA AL 50%','RA-22','Materia Prima',7550.00,8985.00,1,'',29,NULL,9,1.000000,NULL),(70,'RESINA MEDIA EN SOYA AL 50%','RA-23','Materia Prima',6350.00,7557.00,1,'',29,31,9,1.000000,NULL),(71,'RESINA LARGA EN SOYA AL 70%','RA-25','Materia Prima',7300.00,8687.00,1,'',29,NULL,9,1.000000,NULL),(72,'RESINA CHAIN STOPPED AL 60%','RA-37','Materia Prima',7200.00,8568.00,1,'',29,NULL,9,1.000000,NULL),(73,'RESINA CORTA EN TOFA AL 55%','RA-44','Materia Prima',8200.00,9758.00,1,'',29,NULL,9,1.000000,NULL),(74,'RESINA UREA FORMALDEHIDO','RN-9E','Materia Prima',8050.00,9580.00,1,'',29,270,9,1.000000,NULL),(75,'XILOL','XILB6800','Materia Prima',5714.29,6800.00,1,'',30,225,9,1.000000,NULL),(76,'ISOBUTANOL','ISOB7100','Materia Prima',5966.39,7100.00,1,'',30,244,9,1.000000,NULL),(77,'Butil Glicol','BUTB890','Materia Prima',7478.99,8900.00,1,'',30,245,9,1.000000,NULL),(78,'PVA RESIFLEX 610','PRE-193781','Materia Prima',5040.00,5998.00,1,'',31,300,9,1.000000,NULL),(79,'PVA RESIFLEX F55M','PRE-192392','Materia Prima',7620.00,9068.00,1,'',31,301,9,1.000000,NULL),(80,'DISPERSSANTE ACEITE','PA45','Materia Prima',8500.00,10115.00,1,'Dispersante base agua. Tambor 200 kg',32,231,9,1.000000,NULL),(81,'RWANTA C-12','C-12','Materia Prima',10000.00,11900.00,1,'Coalescente. Tambor 200 kg',32,334,9,1.000000,NULL),(82,'AKASIL RE20','RE20','Materia Prima',18000.00,21420.00,1,'Antiespumante base agua. Tambor 200 kg',32,249,9,1.000000,NULL),(83,'REOLOG 30','REOLOG30','Materia Prima',11500.00,13685.00,1,'Espesante acrilico asociativo. Tambor 200 kg',32,335,9,1.000000,NULL),(84,'HEM 150.000S','HEM150000S','Materia Prima',19500.00,23205.00,1,'Espesante celulosico',32,336,9,1.000000,NULL),(85,'FLEX CA50','CA50','Materia Prima',6800.00,8092.00,1,'Resina Acrilica para exteriores',32,337,9,1.000000,NULL),(86,'LANSPERSE SUV','LANSPERSE','Materia Prima',25000.00,29750.00,1,'Dispersante base solvente para esmaltes. Tambor 200 kg',32,338,9,1.000000,NULL),(87,'SILOEN LA 271','LA271','Materia Prima',80000.00,95200.00,1,'Nivelante. Cunete 20 kg',32,339,9,1.000000,NULL),(88,'SILOEN DA290','DA290','Materia Prima',90000.00,107100.00,1,'Antiespumante para epoxicos. Cunete 20 kg',32,340,9,1.000000,NULL),(89,'AZUL 15.3',NULL,'Materia Prima',29500.00,35105.00,1,'Pigmento Azul Ftalo PB15:3',32,68,9,1.000000,NULL),(90,'VERDE 7',NULL,'Materia Prima',31000.00,36890.00,1,'Pigmento Verde Ftalo PG7',32,67,9,1.000000,NULL),(91,'CROMATO DE ZINC',NULL,'Materia Prima',19000.00,22610.00,1,'Pigmento Cromato de Zinc',32,267,9,1.000000,NULL),(92,'FOSFATO DE ZINC',NULL,'Materia Prima',20500.00,24395.00,1,'Pigmento Fosfato de Zinc',32,236,9,1.000000,NULL),(93,'AMARILLO CROMO MEDIO',NULL,'Materia Prima',20500.00,24395.00,1,'Pigmento Amarillo Cromo Medio',32,341,9,1.000000,NULL),(94,'CAOLIN CALCINADO',NULL,'Materia Prima',2900.00,3451.00,1,'Caolin Calcinado',32,253,9,1.000000,NULL),(95,'HUMECTANTE BASE AGUA CERO VOC',NULL,'Materia Prima',29000.00,34510.00,1,'Humectante base agua, cero VOC',32,342,9,1.000000,NULL),(96,'ACRONAL (resina acrilica estirenada)',NULL,'Materia Prima',7563.03,9000.00,1,'kg ex-bulto 20kg, IVA incl',33,255,9,1.000000,NULL),(97,'LATECOL (espesante acrilico)',NULL,'Materia Prima',7563.03,9000.00,1,'kg ex-bulto 20kg, IVA incl',33,335,9,1.000000,NULL),(98,'PVA (resina vinil acrilica 50-55%)',NULL,'Materia Prima',6722.69,8000.00,1,'kg ex-bulto 20kg, IVA incl',33,301,9,1.000000,NULL),(99,'TEXANOL / COALESCENTE',NULL,'Materia Prima',14705.88,17500.00,1,'kg ex-bulto 20kg, IVA incl',33,254,9,1.000000,NULL),(100,'ANTIESPUMANTE',NULL,'Materia Prima',9663.87,11500.00,1,'kg ex-bulto 20kg, IVA incl',33,249,9,1.000000,NULL),(101,'DISPERSANTE AGUA','','Materia Prima',5546.22,6600.00,1,'kg ex-bulto 25kg, IVA incl',33,231,9,1.000000,NULL),(102,'OMYACARB UF',NULL,'Materia Prima',2352.94,2800.00,1,'kg ex-bulto 25kg, IVA incl',33,347,9,1.000000,NULL),(103,'TALCO TY 400',NULL,'Materia Prima',1722.69,2050.00,1,'kg ex-bulto 40kg, IVA incl',33,252,9,1.000000,NULL),(104,'CAOLINA TIZA CAOMIN',NULL,'Materia Prima',2890.76,3440.00,1,'kg ex-25kg ASUMIDO, confirmar',33,253,9,1.000000,NULL),(105,'DIOXIDO DE TITANIO',NULL,'Materia Prima',12100.84,14400.00,1,'kg ex-bulto 25kg, IVA incl',33,37,9,1.000000,NULL),(106,'HUMECTANTE',NULL,'Materia Prima',12184.87,14500.00,1,'kg ex-bulto 20kg, IVA incl',33,342,9,1.000000,NULL),(107,'HIDROFUGANTE MATE',NULL,'Materia Prima',10084.03,12000.00,1,'kg ex-cunete 20kg, IVA incl',33,343,9,1.000000,NULL),(108,'HIDROFUGANTE BRILLANTE',NULL,'Materia Prima',11764.71,14000.00,1,'kg ex-cunete 20kg, IVA incl',33,344,9,1.000000,NULL),(109,'BIOCIDA DA PLUS',NULL,'Materia Prima',9243.70,11000.00,1,'kg ex-bulto 20kg, IVA incl',33,345,9,1.000000,NULL),(110,'BIOCIDA DA ULTRA',NULL,'Materia Prima',14285.71,17000.00,1,'kg ex-bulto 20kg, IVA incl',33,346,9,1.000000,NULL),(111,'OMYACARB 15',NULL,'Materia Prima',571.43,680.00,1,'kg ex-bulto 25kg, IVA incl',33,347,9,1.000000,NULL),(112,'OMYACARB 4',NULL,'Materia Prima',840.34,1000.00,1,'kg ex-bulto 25kg, IVA incl',33,347,9,1.000000,NULL),(113,'TALCO EXTRA',NULL,'Materia Prima',1323.53,1575.00,1,'kg ex-bulto 40kg, IVA incl',33,349,9,1.000000,NULL),(114,'TALCO EXTRA MEJORADO',NULL,'Materia Prima',1575.63,1875.00,1,'kg ex-bulto 40kg, IVA incl',33,350,9,1.000000,NULL),(115,'CLEYTHONE HY','LEYHY12','Materia Prima',19454.62,23151.00,1,'',34,232,9,1.000000,NULL),(116,'DIOXIDO DE TITANIO','DIO248','Materia Prima',11800.00,14042.00,1,'',31,37,9,1.000000,NULL),(117,'OCTOATO DE CALCIO AL 10%','','',21169.00,25191.00,1,'',35,35,NULL,1.000000,NULL),(118,'OCTOATO DE COBALTO AL 12%','','Materia Prima',41000.00,48790.00,1,'',35,33,9,1.000000,NULL),(119,'ANTIPIEL','','Materia Prima',12000.00,14280.00,1,'',35,241,9,1.000000,NULL),(120,'OCTOATO DE ZIRCONIO AL 24%','','Materia Prima',30000.00,35700.00,1,'',35,34,9,1.000000,NULL),(121,'DISASTAB','','Materia Prima',10000.00,11900.00,1,'',25,41,9,1.000000,NULL),(122,'AZUL ULTRAMAR','','Materia Prima',32000.00,38080.00,1,'',36,233,9,1.000000,NULL),(123,'P-400','','Materia Prima',20000.00,23800.00,1,'',36,242,9,1.000000,NULL),(124,'VARSOL','VAR9218','Materia Prima',5961.00,7094.00,1,'',27,36,NULL,1.000000,NULL),(125,'VARSOL','VARPD281','Materia Prima',1230.00,1464.00,1,'',28,36,NULL,1.000000,NULL),(126,'VARSOL','VAR9218','Materia Prima',5961.00,7094.00,1,'',27,83,NULL,1.000000,NULL),(127,'VARSOL','VARPD281','Materia Prima',1230.00,1464.00,1,'',28,83,NULL,1.000000,NULL),(128,'ANTIPIEL','','Materia Prima',12000.00,14280.00,1,'',35,32,9,1.000000,NULL),(129,'OXIDO DE HIERRO AMARILLO Y 4021','','Materia Prima',23000.00,27370.00,1,'',37,63,9,1.000000,'2026-07-02 15:59:53'),(130,'AMARILLO CROMO MEDIO','','Materia Prima',23000.00,27370.00,1,'',37,74,9,1.000000,NULL),(131,'AZUL FTALOCIANINA V-316','','Materia Prima',46000.00,54740.00,1,'',37,355,9,1.000000,NULL),(132,'Butil Glicol','BUTB890','Materia Prima',7478.99,8900.00,1,'',30,261,9,1.000000,NULL),(133,'ANTIPIEL','','Materia Prima',12000.00,14280.00,1,'',35,32,9,1.000000,NULL),(134,'REOLOG 30','REOLOG30','Materia Prima',11500.00,13685.00,1,'Espesante acrilico asociativo. Tambor 200 kg',32,258,9,1.000000,NULL),(135,'LATECOL (espesante acrilico)','','Materia Prima',7563.03,9000.00,1,'kg ex-bulto 20kg, IVA incl',33,258,9,1.000000,NULL),(136,'BIOCIDA DA PLUS','','Materia Prima',9243.70,11000.00,1,'kg ex-bulto 20kg, IVA incl',33,256,9,1.000000,NULL),(137,'BIOCIDA DA ULTRA','','Materia Prima',14285.71,17000.00,1,'kg ex-bulto 20kg, IVA incl',33,256,9,1.000000,NULL),(138,'BIOCIDA DA PLUS','','Materia Prima',9243.70,11000.00,1,'kg ex-bulto 20kg, IVA incl',33,259,9,1.000000,NULL),(139,'BIOCIDA DA ULTRA','','Materia Prima',14285.71,17000.00,1,'kg ex-bulto 20kg, IVA incl',33,259,9,1.000000,NULL),(140,'TALCO EXTRA','','Materia Prima',1323.53,1575.00,1,'kg ex-bulto 40kg, IVA incl',33,59,9,1.000000,NULL),(141,'TALCO EXTRA MEJORADO','','Materia Prima',1575.63,1875.00,1,'kg ex-bulto 40kg, IVA incl',33,59,9,1.000000,NULL),(142,'CARBONATO DE CALCIO ESTUCO M325','CARBM325','Materia Prima',300.00,357.00,1,'',24,251,9,1.000000,NULL),(143,'CARBONATO DE CALCIO VINILO M600','CARBM600','Materia Prima',460.00,547.00,1,'',24,251,9,1.000000,NULL),(144,'CLEYTHONE HY','LEYHY12','Materia Prima',19454.62,23151.00,1,'',34,39,9,1.000000,NULL),(145,'LECITINA DE SOYA','','Materia Prima',5000.00,5950.00,1,'',32,61,9,1.000000,NULL),(146,'ETANOL AL 96%','','Materia Prima',4500.00,5355.00,1,'',27,40,9,1.000000,NULL),(147,'ISOBUTANOL','','Materia Prima',5500.00,6545.00,1,'',27,244,9,1.000000,NULL),(148,'METANOL','','Materia Prima',4500.00,5355.00,1,'',27,80,9,1.000000,NULL),(149,'ACETATO','','Materia Prima',5500.00,6545.00,1,'',27,269,9,1.000000,NULL),(150,'ACEITE DE PINO','','Materia Prima',121000.00,143990.00,1,'',38,260,9,1.000000,NULL),(151,'DIETILEN GLICOL','','Materia Prima',9600.00,11424.00,1,'',23,250,9,1.000000,NULL),(152,'NONIL TERGITOL','','Materia Prima',9600.00,11424.00,1,'',23,247,9,1.000000,NULL),(153,'OCTOATO DE ZINC 16%','','Materia Prima',23562.00,28039.00,1,'',39,92,9,1.000000,NULL),(154,'TPF','','',7880.00,9377.00,1,'',36,246,NULL,1.000000,NULL),(155,'OXIDO DE HIERRO AMARILLO Y 4021','','Materia Prima',10150.00,12079.00,1,'',36,63,9,1.000000,NULL),(156,'RESINA UREA FORMALDEHIDO','RN-9E','Materia Prima',8050.00,9580.00,1,'',29,142,9,1.000000,NULL),(157,'AMONIACO','','Materia Prima',7700.00,9163.00,1,'',23,257,9,1.000000,NULL),(158,'LANSPERSE SUV','LANSPERSE','Materia Prima',25000.00,29750.00,1,'Dispersante base solvente para esmaltes. Tambor 200 kg',32,66,9,1.000000,NULL),(159,'BYK 108 ANTIESPUMANTE','','Materia Prima',25000.00,29750.00,1,'',32,272,9,1.000000,NULL),(160,'CARBONATO DE CALCIO VINILO M600','CARBM600','Materia Prima',460.00,547.00,1,'',24,60,9,1.000000,NULL),(161,'BYK 066N NIVELANTE','','Materia Prima',80000.00,95200.00,1,'',32,271,9,1.000000,NULL),(162,'STANLUX PASTE 140','','Materia Prima',24115.00,28696.85,1,'',39,268,9,1.000000,NULL),(163,'DISPERSSANTE ACEITE','','Materia Prima',8500.00,10115.00,1,'',32,85,9,1.000000,NULL),(164,'OXIFER TABACO R-4370','','Materia Prima',6000.00,7140.00,1,'',36,78,9,1.000000,NULL),(165,'OXIDO DE HIERRO ROJO R-5530','','Materia Prima',8329.00,9911.51,1,'',39,64,9,1.000000,NULL),(166,'PIGMENTO NARANJA MOLIBDENO','','Materia Prima',20000.00,23800.00,1,'',36,73,9,1.000000,NULL),(167,'PIGMENTO OXIFERR AMARILLO Y-4011','','Materia Prima',9029.00,10745.00,1,'',39,76,9,1.000000,NULL),(168,'OXIDO DE HIERRO ROJO R-5530','','Materia Prima',8329.00,9911.51,1,'',39,100,9,1.000000,NULL),(169,'PIGMENTO OXIFERR CAOBA MARRON M 4781','','Materia Prima',9250.00,11008.00,1,'',36,75,9,1.000000,NULL),(170,'PIGMENTO ROJO CARMIN 57:1','','Materia Prima',63130.00,75125.00,1,'',36,72,9,1.000000,NULL),(171,'PIGMENTO VERDE OXIDO CROMO','','Materia Prima',10000.00,11900.00,1,'',36,273,9,1.000000,NULL),(172,'RESINA CORTA R4','','Materia Prima',7100.00,8449.00,1,'',29,162,9,1.000000,NULL),(173,'POLVO PERLADO RICO EN ORO','','Materia Prima',94740.00,112741.00,1,'',36,264,9,1.000000,NULL),(174,'POW CARBON BLACK CHEMO','','Materia Prima',26900.00,32011.00,1,'',40,71,9,1.000000,NULL),(175,'VARITA BLANCA','','Materia Prima',3950.00,4701.00,1,'',40,357,9,1.000000,NULL),(176,'VARITA NICRONIZADA','','Materia Prima',4750.00,5653.00,1,'',40,358,9,1.000000,NULL),(177,'PIGMENTO MARILLO DE CROMO AL 73','','Materia Prima',20900.00,24871.00,1,'',40,74,9,1.000000,NULL),(178,'PIGMENTO AMARILLO LIMÓN','','Materia Prima',20900.00,24871.00,1,'',40,359,9,1.000000,NULL),(179,'POLVO PERLADO VERDOSO','','Materia Prima',140000.00,166600.00,1,'',37,263,9,1.000000,NULL),(180,'BENTOCLAY 188-B','','Materia Prima',19000.00,22610.00,1,'',37,360,9,1.000000,NULL),(181,'ETHYL SILICATO','','Materia Prima',5000.00,5950.00,1,'',41,161,9,1.000000,NULL),(182,'RESINA 000','','Materia Prima',12063.00,14355.00,1,'',39,265,9,1.000000,NULL),(183,'ANTIPIEL','','Materia Prima',12000.00,14280.00,1,'',35,86,9,1.000000,NULL),(248,'THINNER','THI2128','Materia Prima',4628.57,5508.00,1,'',45,459,9,1.000000,NULL),(249,'VARSOL','VAR2912','Materia Prima',4549.58,5414.00,1,'',45,44,9,1.000000,NULL),(250,'DIOXIDO DE TITANIO R-2195',NULL,'Materia Prima',10850.00,12911.50,1,NULL,39,37,9,1.000000,NULL),(251,'DIOXIDO DE TITANIO R-2295',NULL,'Materia Prima',10730.00,12768.70,1,NULL,39,NULL,9,1.000000,NULL),(252,'T-LINE 60X 277 SB',NULL,'Materia Prima',12174.00,14487.06,1,NULL,39,NULL,9,1.000000,NULL),(253,'OCTOATO DE CALCIO 10% CM 25KG',NULL,'Materia Prima',16622.00,19780.18,1,NULL,39,35,9,1.000000,NULL),(254,'OCTOATO DE CALCIO 10% TM 200KG',NULL,'Materia Prima',16313.00,19412.47,1,NULL,39,35,9,1.000000,NULL),(255,'OCTOATO DE COBALTO 12%',NULL,'Materia Prima',29974.00,35669.06,1,NULL,39,33,9,1.000000,NULL),(256,'OCTOATO DE COBALTO 6%',NULL,'Materia Prima',29004.00,34514.76,1,NULL,39,NULL,9,1.000000,NULL),(257,'OCTOATO DE ZIRCONIO 24%',NULL,'Materia Prima',23562.00,28038.78,1,NULL,39,34,9,1.000000,NULL),(258,'TRIMETALICO TM 200KG',NULL,'Materia Prima',21435.00,25507.65,1,NULL,39,NULL,9,1.000000,NULL),(259,'TRIMETALICO CM 25KG',NULL,'Materia Prima',22297.00,26533.43,1,NULL,39,NULL,9,1.000000,NULL),(260,'IRON OXIDE RED 130S',NULL,'Materia Prima',8733.00,10392.27,1,NULL,39,NULL,9,1.000000,NULL),(261,'IRON OXIDE YELLOW 918',NULL,'Materia Prima',9449.00,11244.31,1,NULL,39,NULL,9,1.000000,NULL),(262,'RESINA EPOXICA 75% 601RX75',NULL,'Materia Prima',11615.00,13821.85,1,NULL,39,NULL,9,1.000000,NULL),(263,'RUANTA C12',NULL,'Materia Prima',10253.00,12201.07,1,NULL,39,NULL,9,1.000000,NULL),(264,'ULTRANEX NF 100',NULL,'Materia Prima',11132.00,13247.08,1,NULL,39,NULL,9,1.000000,NULL);
/*!40000 ALTER TABLE `item_proveedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_reemplazo_log`
--

DROP TABLE IF EXISTS `item_reemplazo_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_reemplazo_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_item_id` int NOT NULL,
  `to_item_id` int NOT NULL,
  `from_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `to_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `formulas_afectadas` int NOT NULL DEFAULT '0',
  `origen_eliminada` tinyint(1) NOT NULL DEFAULT '0',
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `usuario` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `revertido` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `revertido_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_irl_fecha` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_reemplazo_log`
--

LOCK TABLES `item_reemplazo_log` WRITE;
/*!40000 ALTER TABLE `item_reemplazo_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_reemplazo_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_sync_auditoria`
--

DROP TABLE IF EXISTS `item_sync_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_sync_auditoria` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cluster_id` int unsigned DEFAULT NULL COMMENT 'Cluster que originó la fusión (null si merge manual suelto).',
  `keep_id` int NOT NULL,
  `remove_id` int NOT NULL,
  `nombre_keep_antes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nombre_keep_despues` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nombre_remove_original` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `costo_keep_antes` decimal(15,4) DEFAULT NULL,
  `costo_keep_despues` decimal(15,4) DEFAULT NULL,
  `afectados` json DEFAULT NULL COMMENT 'Conteo de filas reapuntadas por tabla.',
  `detalle_movimientos` json DEFAULT NULL COMMENT 'IDs movidos (item_proveedor, inventario_capas) para UNDO parcial.',
  `responsable` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `revertido` tinyint(1) NOT NULL DEFAULT '0',
  `revertido_at` datetime DEFAULT NULL,
  `revertido_por` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `keep_id` (`keep_id`),
  KEY `cluster_id` (`cluster_id`),
  KEY `revertido` (`revertido`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_sync_auditoria`
--

LOCK TABLES `item_sync_auditoria` WRITE;
/*!40000 ALTER TABLE `item_sync_auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_sync_auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_sync_cluster_items`
--

DROP TABLE IF EXISTS `item_sync_cluster_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_sync_cluster_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cluster_id` int unsigned NOT NULL,
  `item_general_id` int NOT NULL,
  `rol` enum('keep','merge','excluido') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'merge',
  `confianza_item` enum('alta','media','baja') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'media',
  `motivo_revision` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Ej. "verificar con ficha técnica" cuando baja confianza.',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cluster_id_item_general_id` (`cluster_id`,`item_general_id`),
  KEY `item_general_id` (`item_general_id`),
  CONSTRAINT `item_sync_cluster_items_cluster_id_foreign` FOREIGN KEY (`cluster_id`) REFERENCES `item_sync_clusters` (`id_cluster`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_sync_cluster_items`
--

LOCK TABLES `item_sync_cluster_items` WRITE;
/*!40000 ALTER TABLE `item_sync_cluster_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_sync_cluster_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_sync_clusters`
--

DROP TABLE IF EXISTS `item_sync_clusters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_sync_clusters` (
  `id_cluster` int unsigned NOT NULL AUTO_INCREMENT,
  `clave_grupo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Slug de identidad química (ej. dioxido-titanio-rutilo).',
  `identidad_quimica` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nombre químico canónico ("Dióxido de titanio rutilo").',
  `nombre_base_propuesto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nombre base limpio que sugiere la IA para el keep.',
  `nombre_base_aprobado` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nombre base que fija el humano (gana sobre el propuesto).',
  `confianza` enum('alta','media','baja') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'media',
  `razonamiento` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'Explicación de la IA: por qué son el mismo material.',
  `tipo` tinyint NOT NULL COMMENT '1=Materia Prima, 2=Insumo. Un cluster no mezcla tipos.',
  `estado` enum('propuesto','revisado','aprobado','fusionado','descartado') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'propuesto',
  `keep_id_sugerido` int DEFAULT NULL COMMENT 'item_general que la IA sugiere conservar.',
  `keep_id_aprobado` int DEFAULT NULL COMMENT 'item_general que el humano confirma conservar.',
  `lote_ia` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Id de la corrida de clasificación (re-correr sin pisar).',
  `modelo_ia` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `aprobado_por` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fusionado_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_cluster`),
  KEY `estado` (`estado`),
  KEY `lote_ia` (`lote_ia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_sync_clusters`
--

LOCK TABLES `item_sync_clusters` WRITE;
/*!40000 ALTER TABLE `item_sync_clusters` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_sync_clusters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_attempts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `username_attempt` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip_address`),
  KEY `idx_fecha` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `version` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `class` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `group` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `namespace` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `time` int NOT NULL,
  `batch` int unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2026-04-17-000001','App\\Database\\Migrations\\CreateTamboresTable','default','App',1776779676,1),(2,'2026-04-21-000001','App\\Database\\Migrations\\CreateRequisicionesCompraTable','default','App',1776779681,2),(3,'2026-04-21-000002','App\\Database\\Migrations\\AddUnidadBaseAndItemProveedorCompra','default','App',1776799102,3),(4,'2026-04-22-000001','App\\Database\\Migrations\\MergeUnidadEmpaqueIntoUnidadCompra','default','App',1777059242,4),(5,'2026-04-23-000001','App\\Database\\Migrations\\CreateInventarioCapasSystem','default','App',1777059242,4),(6,'2026-04-24-000001','App\\Database\\Migrations\\CreateProduccionInsumosDetalle','default','App',1777059242,4),(7,'2026-05-11-000001','App\\Database\\Migrations\\AddRolToUsuarios','default','App',1778543978,5),(8,'2026-05-11-000002','App\\Database\\Migrations\\CreatePermisosRolModulo','default','App',1778543978,5),(9,'2026-05-11-000003','App\\Database\\Migrations\\CreateLoginAttempts','default','App',1778543998,6),(10,'2026-05-13-000001','App\\Database\\Migrations\\ExtendMovimientoInventario','default','App',1778685332,7),(11,'2026-05-13-000002','App\\Database\\Migrations\\AddNombreToUsuarios','default','App',1778689057,8),(12,'2026-05-13-000003','App\\Database\\Migrations\\AddLoteProveedorToProduccionInsumos','default','App',1778689809,9),(13,'2026-05-13-000004','App\\Database\\Migrations\\CreateFormulacionesVersiones','default','App',1778690919,10),(14,'2026-05-13-000005','App\\Database\\Migrations\\CreateNotificaciones','default','App',1778691884,11),(15,'2026-05-13-000006','App\\Database\\Migrations\\AddSugeridaToRequisiciones','default','App',1778692918,12),(17,'2026-05-13-000007','App\\Database\\Migrations\\AddSoftDeletes','default','App',1778701102,14),(18,'2026-05-13-000008','App\\Database\\Migrations\\RemisionesStockTracking','default','App',1778702058,15),(57,'2026-05-14-000001','App\\Database\\Migrations\\AddSoftDeleteToItemProveedor','default','App',1779725132,16),(58,'2026-05-14-000002','App\\Database\\Migrations\\CreateConfiguracionSistema','default','App',1779725132,16),(59,'2026-05-14-000003','App\\Database\\Migrations\\SeedConfiguracionTributaria','default','App',1779725132,16),(60,'2026-05-14-000004','App\\Database\\Migrations\\SeedConfiguracionUmbrales','default','App',1779725132,16),(61,'2026-05-14-000005','App\\Database\\Migrations\\CreateNumeracionDocumentos','default','App',1779725132,16),(62,'2026-05-14-000006','App\\Database\\Migrations\\ExtendEmpresa','default','App',1779725132,16),(63,'2026-05-14-000007','App\\Database\\Migrations\\SeedConfiguracionSeguridadFinanciero','default','App',1779725132,16),(64,'2026-05-14-000008','App\\Database\\Migrations\\SeedAvatarPalette','default','App',1779725132,16),(65,'2026-05-14-000009','App\\Database\\Migrations\\SeedDefaultLogo','default','App',1779725132,16),(66,'2026-05-15-000001','App\\Database\\Migrations\\AddTrazabilidadModulo','default','App',1779725132,16),(67,'2026-05-15-000002','App\\Database\\Migrations\\AddCostosModulos','default','App',1779725132,16),(68,'2026-05-15-000003','App\\Database\\Migrations\\RemoveCostosIndirectosModulo','default','App',1779725132,16),(69,'2026-05-19-000001','App\\Database\\Migrations\\AddIvaPctToOrdenesCompra','default','App',1779725132,16),(70,'2026-05-19-000002','App\\Database\\Migrations\\MergeCostosIntoRentabilidad','default','App',1779725132,16),(71,'2026-05-19-000003','App\\Database\\Migrations\\AddCostosProduccionModulo','default','App',1779725132,16),(72,'2026-05-20-000001','App\\Database\\Migrations\\AddSaludSistemaModulo','default','App',1779725132,16),(73,'2026-05-20-000002','App\\Database\\Migrations\\CreateCostosSnapshot','default','App',1779725132,16),(74,'2026-05-20-000003','App\\Database\\Migrations\\AddSuperadminRol','default','App',1779725132,16),(75,'2026-05-21-000001','App\\Database\\Migrations\\AddTokenVersionToUsuarios','default','App',1779725132,16),(76,'2026-05-25-000001','App\\Database\\Migrations\\CreateRefreshTokens','default','App',1779898393,17),(77,'2026-05-25-000002','App\\Database\\Migrations\\DropTamboresTable','default','App',1779898393,17),(78,'2026-05-27-000001','App\\Database\\Migrations\\AddSoftDeleteToBasicEntities','default','App',1780074079,18),(79,'2026-06-01-000001','App\\Database\\Migrations\\CreateItemSyncSugerencias','default','App',1783006608,19),(80,'2026-06-01-000002','App\\Database\\Migrations\\CreateItemSyncAuditoria','default','App',1783006608,19),(81,'2026-06-01-000003','App\\Database\\Migrations\\WidenItemGeneralFichaTecnica','default','App',1783006608,19),(82,'2026-06-03-000001','App\\Database\\Migrations\\AddMissingForeignKeys','default','App',1783006612,19),(83,'2026-06-12-000001','App\\Database\\Migrations\\CreateCostosIndirectosItem','default','App',1783006612,19),(84,'2026-06-13-000001','App\\Database\\Migrations\\CreateItemReemplazoLog','default','App',1783006612,19),(85,'2026-07-03-000001','App\\Database\\Migrations\\AddOrdenToFormulacionLineas','default','App',1783112717,20),(86,'2026-07-03-000002','App\\Database\\Migrations\\AddInstruccionesToFormulacionLineas','default','App',1783113908,21),(87,'2026-07-03-000003','App\\Database\\Migrations\\DropUniqueIngredienteFormulacion','default','App',1783114802,22);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_inventario`
--

DROP TABLE IF EXISTS `movimiento_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_inventario` (
  `id_movimiento_inventario` int NOT NULL AUTO_INCREMENT,
  `tipo_movimiento` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `fecha_movimiento` datetime DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `referencia_tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `item_general_id` int DEFAULT NULL COMMENT 'ID del producto o materia prima afectada',
  `bodega_id` int DEFAULT NULL COMMENT 'ID de la bodega donde ocurrió el movimiento',
  `referencia_id` int DEFAULT NULL COMMENT 'ID de la tabla origen (ej: ID de la Orden, Factura o Traspaso)',
  `costo_unitario` decimal(15,2) DEFAULT NULL COMMENT 'Costo unitario en el instante exacto del movimiento',
  `saldo_anterior` decimal(15,2) DEFAULT NULL COMMENT 'Cantidad en bodega antes del movimiento',
  `saldo_nuevo` decimal(15,2) DEFAULT NULL COMMENT 'Cantidad en bodega después del movimiento',
  `responsable` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nombre de la persona responsable del movimiento',
  `metadata` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_movimiento_inventario`),
  UNIQUE KEY `id_movimiento_inventario_UNIQUE` (`id_movimiento_inventario`),
  KEY `fk_movimiento_item` (`item_general_id`),
  KEY `fk_movimiento_bodega` (`bodega_id`),
  CONSTRAINT `fk_movimiento_bodega` FOREIGN KEY (`bodega_id`) REFERENCES `bodegas` (`id_bodegas`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_movimiento_item` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_inventario`
--

LOCK TABLES `movimiento_inventario` WRITE;
/*!40000 ALTER TABLE `movimiento_inventario` DISABLE KEYS */;
INSERT INTO `movimiento_inventario` VALUES (36,'ENTRADA',1000.00,'2026-05-16 15:55:15','Recepción OC #OC-001 línea 47','ORDEN_COMPRA',300,1,36,5040.00,0.00,1000.00,'root','{\"numero_oc\": \"OC-001\", \"proveedor_id\": \"31\", \"unidad_compra\": \"9\", \"lote_proveedor\": \"LT-2026-A0450\", \"factor_conversion\": 1, \"item_proveedor_id\": \"78\", \"precio_unit_compra\": 5040, \"item_proveedor_nombre\": \"PVA RESIFLEX 610\", \"cantidad_recibida_unidad_compra\": 1000}','2026-05-16 15:55:15'),(50,'ENTRADA',200.00,'2026-05-17 01:12:21','Recepción OC #OC-001 línea 48','ORDEN_COMPRA',301,1,36,7620.00,0.00,200.00,'root','{\"numero_oc\": \"OC-001\", \"proveedor_id\": \"31\", \"unidad_compra\": \"9\", \"lote_proveedor\": \"LT-2026-A0450\", \"factor_conversion\": 1, \"item_proveedor_id\": \"79\", \"precio_unit_compra\": 7620, \"item_proveedor_nombre\": \"PVA RESIFLEX F55M\", \"cantidad_recibida_unidad_compra\": 200}','2026-05-17 01:12:21'),(51,'AJUSTE',5.00,'2026-05-18 20:06:26','Ajuste manual: removido de bodega Bodega principal','AJUSTE_MANUAL',133,1,NULL,NULL,5.00,0.00,'root','{\"accion\": \"remove_from_bodega\", \"motivo\": null, \"bodega_id\": 1, \"bodega_nombre\": \"Bodega principal\", \"cantidad_removida\": 5}','2026-05-18 20:06:26'),(52,'ENTRADA',10.00,'2026-05-25 14:59:54','Recepción OC #OC-020 línea 53','ORDEN_COMPRA',230,1,39,5000.00,0.00,10.00,'root','{\"numero_oc\": \"OC-020\", \"proveedor_id\": \"23\", \"unidad_compra\": null, \"lote_proveedor\": \"TEST-LOTE-6a1463ead3dd0\", \"factor_conversion\": 1, \"item_proveedor_id\": \"46\", \"precio_unit_compra\": 5000, \"item_proveedor_nombre\": \"DISPERSANTE\", \"cantidad_recibida_unidad_compra\": 10}','2026-05-25 14:59:54'),(53,'SALIDA',1.50,'2026-05-25 14:59:56','Despacho remisión REM-2026-0001 línea 17','REMISION',1,1,18,0.00,11.00,9.50,'root','{\"cliente_id\": \"1\", \"detalle_id\": 17, \"descripcion\": \"Test despacho\", \"remision_id\": 18, \"remision_numero\": \"REM-2026-0001\", \"capas_consumidas\": 1}','2026-05-25 14:59:56'),(54,'ENTRADA',1.50,'2026-05-25 14:59:57','Anulación remisión REM-2026-0001 (reintegro de stock)','ANULACION',1,NULL,18,0.00,9.50,11.00,'root','{\"remision_id\": 18, \"origen_estado\": \"Despachada\", \"remision_numero\": \"REM-2026-0001\", \"capas_restauradas\": 1}','2026-05-25 14:59:57'),(55,'ENTRADA',10.00,'2026-05-25 16:04:45','Recepción OC #OC-022 línea 55','ORDEN_COMPRA',230,1,41,5000.00,10.00,20.00,'root','{\"numero_oc\": \"OC-022\", \"proveedor_id\": \"23\", \"unidad_compra\": null, \"lote_proveedor\": \"TEST-LOTE-6a14731da95e8\", \"factor_conversion\": 1, \"item_proveedor_id\": \"46\", \"precio_unit_compra\": 5000, \"item_proveedor_nombre\": \"DISPERSANTE\", \"cantidad_recibida_unidad_compra\": 10}','2026-05-25 16:04:45'),(56,'SALIDA',1.50,'2026-05-25 16:04:48','Despacho remisión REM-2026-0003 línea 19','REMISION',1,1,20,0.00,9.50,8.00,'root','{\"cliente_id\": \"1\", \"detalle_id\": 19, \"descripcion\": \"Test despacho\", \"remision_id\": 20, \"remision_numero\": \"REM-2026-0003\", \"capas_consumidas\": 1}','2026-05-25 16:04:48'),(57,'ENTRADA',1.50,'2026-05-25 16:04:48','Anulación remisión REM-2026-0003 (reintegro de stock)','ANULACION',1,NULL,20,0.00,9.50,11.00,'root','{\"remision_id\": 20, \"origen_estado\": \"Despachada\", \"remision_numero\": \"REM-2026-0003\", \"capas_restauradas\": 1}','2026-05-25 16:04:48'),(58,'ENTRADA',1000.00,'2026-05-27 20:42:54','Recepción OC #OC-002 línea 49','ORDEN_COMPRA',300,1,37,5040.00,1000.00,2000.00,'root','{\"numero_oc\": \"OC-002\", \"proveedor_id\": \"31\", \"unidad_compra\": \"9\", \"lote_proveedor\": \"LOT-OC37-20260527\", \"factor_conversion\": 1, \"item_proveedor_id\": \"78\", \"precio_unit_compra\": 5040, \"item_proveedor_nombre\": \"PVA RESIFLEX 610\", \"cantidad_recibida_unidad_compra\": 1000}','2026-05-27 20:42:54'),(59,'ENTRADA',1000.00,'2026-05-27 21:00:27','Recepción OC #OC-002 línea 49','ORDEN_COMPRA',300,1,37,5040.00,1000.00,2000.00,'root','{\"numero_oc\": \"OC-002\", \"proveedor_id\": \"31\", \"unidad_compra\": \"9\", \"lote_proveedor\": \"LOT-OC37-20260527\", \"factor_conversion\": 1, \"item_proveedor_id\": \"78\", \"precio_unit_compra\": 5040, \"item_proveedor_nombre\": \"PVA RESIFLEX 610\", \"cantidad_recibida_unidad_compra\": 1000}','2026-05-27 21:00:27');
/*!40000 ALTER TABLE `movimiento_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomina_abonos`
--

DROP TABLE IF EXISTS `nomina_abonos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nomina_abonos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `detalle_id` int NOT NULL,
  `monto` decimal(15,2) NOT NULL,
  `fecha` date NOT NULL,
  `medio_pago` varchar(30) NOT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `created_by` varchar(60) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nomina_abono_detalle` (`detalle_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomina_abonos`
--

LOCK TABLES `nomina_abonos` WRITE;
/*!40000 ALTER TABLE `nomina_abonos` DISABLE KEYS */;
/*!40000 ALTER TABLE `nomina_abonos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomina_descuentos`
--

DROP TABLE IF EXISTS `nomina_descuentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nomina_descuentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL,
  `concepto` varchar(160) NOT NULL,
  `monto` decimal(15,2) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('pendiente','aplicado') NOT NULL DEFAULT 'pendiente',
  `aplicado_detalle_id` int DEFAULT NULL,
  `created_by` varchar(60) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nomina_desc_empleado` (`empleado_id`),
  KEY `idx_nomina_desc_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomina_descuentos`
--

LOCK TABLES `nomina_descuentos` WRITE;
/*!40000 ALTER TABLE `nomina_descuentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `nomina_descuentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomina_detalle`
--

DROP TABLE IF EXISTS `nomina_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nomina_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `periodo_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `empleado_nombre` varchar(120) NOT NULL,
  `empleado_documento` varchar(30) NOT NULL,
  `cargo` varchar(80) DEFAULT NULL,
  `salario_base` decimal(15,2) NOT NULL DEFAULT '0.00',
  `dias_trabajados` decimal(5,2) NOT NULL DEFAULT '30.00',
  `salario_devengado` decimal(15,2) NOT NULL DEFAULT '0.00',
  `auxilio_transporte` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_devengado` decimal(15,2) NOT NULL DEFAULT '0.00',
  `deduccion_salud` decimal(15,2) NOT NULL DEFAULT '0.00',
  `deduccion_pension` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_deducciones` decimal(15,2) NOT NULL DEFAULT '0.00',
  `neto_pagar` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_descuentos` decimal(15,2) NOT NULL DEFAULT '0.00',
  `saldo` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_nomina_det_periodo` (`periodo_id`),
  KEY `idx_nomina_det_empleado` (`empleado_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomina_detalle`
--

LOCK TABLES `nomina_detalle` WRITE;
/*!40000 ALTER TABLE `nomina_detalle` DISABLE KEYS */;
INSERT INTO `nomina_detalle` VALUES (18,10,4,'Juanito','1001914855','Operador',1750905.00,15.00,875453.00,124547.00,1000000.00,35018.00,35018.00,70036.00,929964.00,0.00,929964.00),(19,10,8,'María Torres','1002345678','Auxiliar de Producción',1400000.00,15.00,700000.00,124547.00,824547.00,28000.00,28000.00,56000.00,768547.00,0.00,768547.00),(20,11,4,'Juanito','1001914855','Operador',1750905.00,15.00,875453.00,124547.00,1000000.00,35018.00,35018.00,70036.00,929964.00,0.00,929964.00),(21,11,8,'María Torres','1002345678','Auxiliar de Producción',1400000.00,15.00,700000.00,124547.00,824547.00,28000.00,28000.00,56000.00,768547.00,0.00,768547.00);
/*!40000 ALTER TABLE `nomina_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomina_empleados`
--

DROP TABLE IF EXISTS `nomina_empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nomina_empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `documento` varchar(30) NOT NULL,
  `cargo` varchar(80) DEFAULT NULL,
  `salario_base` decimal(15,2) NOT NULL DEFAULT '0.00',
  `fecha_ingreso` date DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nomina_emp_doc` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomina_empleados`
--

LOCK TABLES `nomina_empleados` WRITE;
/*!40000 ALTER TABLE `nomina_empleados` DISABLE KEYS */;
INSERT INTO `nomina_empleados` VALUES (4,'Juanito','1001914855','Operador',1750905.00,'2026-07-24',1,'2026-07-24 14:36:24',NULL),(8,'María Torres','1002345678','Auxiliar de Producción',1400000.00,NULL,1,'2026-07-24 22:04:17',NULL),(9,'Carlos Ramírez','1003456789','Vendedor',1600000.00,NULL,1,'2026-07-24 22:33:43',NULL);
/*!40000 ALTER TABLE `nomina_empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomina_periodos`
--

DROP TABLE IF EXISTS `nomina_periodos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nomina_periodos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `etiqueta` varchar(60) NOT NULL,
  `tipo` enum('mensual','quincenal') NOT NULL DEFAULT 'mensual',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estado` enum('borrador','cerrada','pagada') NOT NULL DEFAULT 'borrador',
  `fecha_pago` date DEFAULT NULL,
  `medio_pago` varchar(30) DEFAULT NULL,
  `pagado_por` varchar(60) DEFAULT NULL,
  `total_devengado` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_deducciones` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_neto` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomina_periodos`
--

LOCK TABLES `nomina_periodos` WRITE;
/*!40000 ALTER TABLE `nomina_periodos` DISABLE KEYS */;
INSERT INTO `nomina_periodos` VALUES (10,'Primera quincena - Agosto 2026','quincenal','2026-08-01','2026-08-15','borrador',NULL,NULL,NULL,1824547.00,126036.00,1698511.00,'2026-07-24 22:15:14','root'),(11,'Segunda quincena - Agosto 2026','quincenal','2026-08-16','2026-08-31','borrador',NULL,NULL,NULL,1824547.00,126036.00,1698511.00,'2026-07-24 22:15:14','root');
/*!40000 ALTER TABLE `nomina_periodos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notas_credito`
--

DROP TABLE IF EXISTS `notas_credito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notas_credito` (
  `id_nota_credito` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `facturas_id` int NOT NULL,
  `clientes_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `estado` enum('Activa','Anulada') DEFAULT 'Activa',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nota_credito`),
  UNIQUE KEY `numero` (`numero`),
  KEY `fk_notas_factura` (`facturas_id`),
  KEY `fk_notas_cliente` (`clientes_id`),
  KEY `fk_notas_usuario` (`usuario_id`),
  CONSTRAINT `fk_notas_cliente` FOREIGN KEY (`clientes_id`) REFERENCES `clientes` (`id_clientes`),
  CONSTRAINT `fk_notas_factura` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`),
  CONSTRAINT `fk_notas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notas_credito`
--

LOCK TABLES `notas_credito` WRITE;
/*!40000 ALTER TABLE `notas_credito` DISABLE KEYS */;
/*!40000 ALTER TABLE `notas_credito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `rol_target` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `titulo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `leida_at` datetime DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_leida` (`user_id`,`leida`),
  KEY `idx_notif_rol_leida` (`rol_target`,`leida`),
  KEY `idx_notif_tipo` (`tipo`),
  KEY `idx_notif_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,NULL,'admin','factura_vencimiento','Factura FAC-20 en mora','Distribuidora Andina S.A.S · 154 días vencida · saldo $125.000','/cartera',1,'2026-05-16 19:56:12','{\"saldo\": 125000, \"dedup_key\": \"factura-mora-1-2026-05-15\", \"dias_mora\": 154, \"id_facturas\": 1}','2026-05-15 19:11:42'),(2,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 31 días a BRENTANG.','/compras',1,'2026-07-03 16:41:41','{\"dias\": 31, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-06-27\"}','2026-06-27 15:46:48'),(3,NULL,'admin','item_huerfano','Item huérfano tras unificación','El item #87 «DISOLVENTE #3» quedó sin proveedores activos.','/sincronizacion',1,'2026-07-03 16:41:41','{\"origen\": \"merge\", \"keep_id\": 87, \"dedup_key\": \"huerfano-merge-87\", \"remove_id\": 90}','2026-06-27 16:28:39'),(4,NULL,'admin','item_huerfano','Item huérfano tras unificación','El item #39 «BENTOCLAY BP 184» quedó sin proveedores activos.','/sincronizacion',1,'2026-07-03 16:41:41','{\"origen\": \"merge\", \"keep_id\": 39, \"dedup_key\": \"huerfano-merge-39\", \"remove_id\": 95}','2026-06-27 16:28:47'),(5,NULL,'admin','item_huerfano','Item huérfano tras unificación','El item #84 «EDAPLAN 915» quedó sin proveedores activos.','/sincronizacion',1,'2026-07-03 16:41:41','{\"origen\": \"merge\", \"keep_id\": 84, \"dedup_key\": \"huerfano-merge-84\", \"remove_id\": 97}','2026-06-27 16:31:03'),(6,NULL,'admin','item_huerfano','Item huérfano tras unificación','El item #36 «DISOLVENTE 2232 #3» quedó sin proveedores activos.','/sincronizacion',1,'2026-07-03 16:41:41','{\"origen\": \"merge\", \"keep_id\": 36, \"dedup_key\": \"huerfano-merge-36\", \"remove_id\": 89}','2026-06-27 16:31:13'),(7,NULL,'admin','item_huerfano','Item huérfano tras unificación','El item #59 «MICROTALC C 20» quedó sin proveedores activos.','/sincronizacion',1,'2026-07-03 16:41:41','{\"origen\": \"merge\", \"keep_id\": 59, \"dedup_key\": \"huerfano-merge-59\", \"remove_id\": 65}','2026-06-27 16:31:20'),(8,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 36 días a BRENTANG.','/compras',1,'2026-07-02 20:52:32','{\"dias\": 36, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-02\"}','2026-07-02 14:50:00'),(9,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 37 días a BRENNTAG COLOMBIA.','/compras',1,'2026-07-03 16:41:41','{\"dias\": 37, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-03\"}','2026-07-03 16:21:32'),(10,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 38 días a BRENNTAG COLOMBIA.','/compras',1,NULL,'{\"dias\": 38, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-04\"}','2026-07-04 15:01:28'),(11,NULL,'admin','requisicion_nueva','Nueva requisición de compra','Hay requisiciones pendientes de aprobación para convertir a OC.','/compras',1,NULL,'{\"count\": 1, \"dedup_key\": \"req-nueva-2026-07-10-19\"}','2026-07-10 19:04:23'),(12,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 44 días a BRENNTAG COLOMBIA.','/compras',1,NULL,'{\"dias\": 44, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-10\"}','2026-07-10 19:41:20'),(35,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 45 días a BRENNTAG COLOMBIA.','/compras',1,NULL,'{\"dias\": 45, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-11\"}','2026-07-11 15:37:06'),(47,NULL,'admin','requisicion_nueva','Nueva requisición de compra','Hay requisiciones pendientes de aprobación para convertir a OC.','/compras',1,'2026-07-14 13:42:56','{\"count\": 1, \"dedup_key\": \"req-nueva-2026-07-11-15\"}','2026-07-11 15:37:33'),(48,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 48 días a BRENNTAG COLOMBIA.','/compras',1,'2026-07-17 16:46:35','{\"dias\": 48, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-14\"}','2026-07-14 13:06:47'),(49,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 50 días a BRENNTAG COLOMBIA.','/compras',1,'2026-07-17 16:46:35','{\"dias\": 50, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-16\"}','2026-07-16 14:22:22'),(50,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 51 días a BRENNTAG COLOMBIA.','/compras',1,'2026-07-17 16:46:35','{\"dias\": 51, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-17\"}','2026-07-17 16:41:30'),(51,NULL,'admin','factura_vencimiento','Factura __TESTVENC__ próxima a vencer','Distribuidora Andina S.A.S · vence en 2 días · saldo $90.000','/cartera',1,'2026-07-28 20:34:10','{\"saldo\": 90000, \"dedup_key\": \"factura-porvencer-71-2026-07-17\", \"id_facturas\": 71, \"dias_para_vencer\": 2}','2026-07-17 21:44:56'),(52,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 58 días a BRENNTAG COLOMBIA.','/compras',1,'2026-07-28 20:34:10','{\"dias\": 58, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-24\"}','2026-07-24 14:20:20'),(53,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 62 días a BRENNTAG COLOMBIA.','/compras',1,'2026-07-28 20:34:10','{\"dias\": 62, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-07-28\"}','2026-07-28 13:48:27'),(54,NULL,'admin','oc_retrasada','OC OC-003 sin recibir','Enviada hace 75 días a BRENNTAG COLOMBIA.','/compras',0,NULL,'{\"dias\": 75, \"id_orden\": 45, \"dedup_key\": \"oc-retrasada-45-2026-08-10\"}','2026-08-10 19:24:44');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `numeracion_documentos`
--

DROP TABLE IF EXISTS `numeracion_documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `numeracion_documentos` (
  `id_numeracion` int unsigned NOT NULL AUTO_INCREMENT,
  `tipo_doc` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `prefijo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `padding` tinyint unsigned NOT NULL DEFAULT '4',
  `proximo_numero` int unsigned NOT NULL DEFAULT '1',
  `anio_actual` smallint unsigned DEFAULT NULL,
  `reinicia_anual` tinyint NOT NULL DEFAULT '1',
  `resolucion_dian` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_resolucion` date DEFAULT NULL,
  `rango_min` int unsigned DEFAULT NULL,
  `rango_max` int unsigned DEFAULT NULL,
  `fecha_vigencia_hasta` date DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id_numeracion`),
  KEY `tipo_doc_activo` (`tipo_doc`,`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `numeracion_documentos`
--

LOCK TABLES `numeracion_documentos` WRITE;
/*!40000 ALTER TABLE `numeracion_documentos` DISABLE KEYS */;
INSERT INTO `numeracion_documentos` VALUES (1,'factura','FAC-{Y}-',4,9,2026,1,NULL,NULL,NULL,NULL,NULL,1,'2026-05-25 16:05:32','2026-08-11 15:44:27','migration'),(2,'cotizacion','COT-{Y}-',4,1,2026,1,NULL,NULL,NULL,NULL,NULL,1,'2026-05-25 16:05:32','2026-07-07 14:42:46','migration'),(3,'remision','REM-{Y}-',4,5,2026,1,NULL,NULL,NULL,NULL,NULL,1,'2026-05-25 16:05:32','2026-05-25 16:05:32','migration'),(4,'orden_compra','OC-',3,5,NULL,0,NULL,NULL,NULL,NULL,NULL,1,'2026-05-25 16:05:32','2026-07-17 22:25:17','migration'),(5,'nota_credito','NC-',3,1,NULL,0,NULL,NULL,NULL,NULL,NULL,1,'2026-05-25 16:05:32','2026-07-11 15:36:25','migration');
/*!40000 ALTER TABLE `numeracion_documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_compra`
--

DROP TABLE IF EXISTS `ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_compra` (
  `id_orden` int unsigned NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `proveedor_id` int NOT NULL,
  `bodegas_id` int NOT NULL,
  `fecha` date NOT NULL,
  `fecha_esperada` date DEFAULT NULL,
  `estado` enum('Borrador','Enviada','Recibida','Cancelada') DEFAULT 'Borrador',
  `total` decimal(12,2) DEFAULT '0.00',
  `iva_pct` decimal(5,2) DEFAULT NULL COMMENT 'Porcentaje de IVA aplicado a la OC al momento de su cierre. NULL = legacy sin IVA.',
  `observaciones` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_orden`),
  UNIQUE KEY `numero` (`numero`),
  KEY `proveedor_id` (`proveedor_id`),
  KEY `bodegas_id` (`bodegas_id`),
  KEY `idx_ordenes_compra_deleted_at` (`deleted_at`),
  CONSTRAINT `ordenes_compra_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id_proveedor`),
  CONSTRAINT `ordenes_compra_ibfk_2` FOREIGN KEY (`bodegas_id`) REFERENCES `bodegas` (`id_bodegas`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra`
--

LOCK TABLES `ordenes_compra` WRITE;
/*!40000 ALTER TABLE `ordenes_compra` DISABLE KEYS */;
INSERT INTO `ordenes_compra` VALUES (36,'OC-001',31,1,'2026-05-07','2026-05-07','Recibida',6564000.00,19.00,'','2026-05-16 15:50:09',NULL),(37,'OC-002',31,1,'2026-05-15','2026-05-18','Recibida',5040000.00,19.00,'','2026-05-16 15:52:32',NULL),(45,'OC-003',30,1,'2026-05-27','2026-06-03','Enviada',1094118.20,19.00,'OC de ejemplo (borrador) - 3 productos de BRENTANG','2026-05-27 20:51:05',NULL);
/*!40000 ALTER TABLE `ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_compra_detalle`
--

DROP TABLE IF EXISTS `ordenes_compra_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_compra_detalle` (
  `id_detalle` int unsigned NOT NULL AUTO_INCREMENT,
  `ordenes_compra_id` int unsigned NOT NULL,
  `item_proveedor_id` int NOT NULL,
  `item_general_id` int DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unit` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `cantidad_recibida` decimal(10,2) DEFAULT '0.00',
  `recibido_en` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `ordenes_compra_id` (`ordenes_compra_id`),
  KEY `item_proveedor_id` (`item_proveedor_id`),
  CONSTRAINT `ordenes_compra_detalle_ibfk_1` FOREIGN KEY (`ordenes_compra_id`) REFERENCES `ordenes_compra` (`id_orden`) ON DELETE CASCADE,
  CONSTRAINT `ordenes_compra_detalle_ibfk_2` FOREIGN KEY (`item_proveedor_id`) REFERENCES `item_proveedor` (`id_item_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra_detalle`
--

LOCK TABLES `ordenes_compra_detalle` WRITE;
/*!40000 ALTER TABLE `ordenes_compra_detalle` DISABLE KEYS */;
INSERT INTO `ordenes_compra_detalle` VALUES (47,36,78,300,'PVA RESIFLEX 610',1000.00,5040.00,5040000.00,1000.00,'2026-05-16 15:55:15'),(48,36,79,301,'PVA RESIFLEX F55M',200.00,7620.00,1524000.00,200.00,'2026-05-17 01:12:21'),(49,37,78,300,'PVA RESIFLEX 610',1000.00,5040.00,5040000.00,1000.00,'2026-05-27 21:00:27'),(57,45,75,225,'XILOL',100.00,5714.29,571429.00,0.00,NULL),(58,45,76,244,'ISOBUTANOL',50.00,5966.39,298319.50,0.00,NULL),(59,45,77,245,'BUTIL GLICOL',30.00,7478.99,224369.70,0.00,NULL);
/*!40000 ALTER TABLE `ordenes_compra_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_cliente`
--

DROP TABLE IF EXISTS `pagos_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_cliente` (
  `id_pagos_cliente` int NOT NULL AUTO_INCREMENT,
  `fecha_pago` date DEFAULT NULL,
  `monto` decimal(7,1) DEFAULT NULL,
  `metodo_pago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` enum('pago_total','abono','anticipo') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pago_total',
  `numero_referencia` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `observaciones` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `clientes_id` int DEFAULT NULL,
  `facturas_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_pagos_cliente`),
  UNIQUE KEY `id_pagos_cliente_UNIQUE` (`id_pagos_cliente`),
  UNIQUE KEY `uq_pago_factura_ref` (`facturas_id`,`numero_referencia`),
  KEY `fk_pagos_cliente_clientes1_idx` (`clientes_id`),
  KEY `fk_pagos_cliente_facturas1_idx` (`facturas_id`),
  KEY `fk_pagos_usuario` (`usuario_id`),
  CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_cliente`
--

LOCK TABLES `pagos_cliente` WRITE;
/*!40000 ALTER TABLE `pagos_cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos_rol_modulo`
--

DROP TABLE IF EXISTS `permisos_rol_modulo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos_rol_modulo` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `rol` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `modulo` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rol_modulo` (`rol`,`modulo`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos_rol_modulo`
--

LOCK TABLES `permisos_rol_modulo` WRITE;
/*!40000 ALTER TABLE `permisos_rol_modulo` DISABLE KEYS */;
INSERT INTO `permisos_rol_modulo` VALUES (1,'admin','panel-principal',1),(2,'admin','catalogo',1),(3,'admin','inventario-global',1),(4,'admin','formulaciones',1),(5,'admin','produccion',1),(6,'admin','rentabilidad',1),(7,'admin','comercial',1),(8,'admin','compras',1),(9,'admin','cartera',1),(10,'admin','clientes',1),(11,'admin','proveedores',1),(12,'admin','movimientos',1),(13,'admin','pagos',1),(16,'admin','roles',1),(69,'visor','panel-principal',1),(70,'visor','catalogo',1),(71,'visor','inventario-global',1),(72,'visor','formulaciones',1),(73,'visor','rentabilidad',1),(74,'visor','comercial',1),(75,'visor','clientes',1),(76,'visor','proveedores',1),(77,'visor','movimientos',1),(115,'admin','trazabilidad',1),(117,'visor','trazabilidad',1),(121,'admin','costos-produccion',1),(123,'visor','costos-produccion',1),(124,'admin','salud-sistema',1),(126,'visor','salud-sistema',1),(127,'superadmin','cartera',1),(128,'superadmin','catalogo',1),(129,'superadmin','clientes',1),(130,'superadmin','comercial',1),(131,'superadmin','compras',1),(132,'superadmin','costos-produccion',1),(133,'superadmin','formulaciones',1),(134,'superadmin','inventario-global',1),(135,'superadmin','movimientos',1),(136,'superadmin','pagos',1),(137,'superadmin','panel-principal',1),(138,'superadmin','produccion',1),(139,'superadmin','proveedores',1),(140,'superadmin','rentabilidad',1),(141,'superadmin','roles',1),(142,'superadmin','salud-sistema',1),(143,'superadmin','trazabilidad',1),(191,'operador','catalogo',1),(192,'operador','clientes',1),(193,'operador','compras',1),(194,'operador','costos-produccion',1),(195,'operador','formulaciones',1),(196,'operador','inventario-global',1),(197,'operador','movimientos',1),(198,'operador','pagos',1),(199,'operador','panel-principal',1),(200,'operador','produccion',1),(201,'operador','proveedores',1),(202,'operador','salud-sistema',1),(203,'operador','trazabilidad',1),(204,'admin','nomina',1);
/*!40000 ALTER TABLE `permisos_rol_modulo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preparacion_consumo_capas`
--

DROP TABLE IF EXISTS `preparacion_consumo_capas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparacion_consumo_capas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `preparacion_id` int NOT NULL,
  `capa_id` int NOT NULL,
  `item_general_id` int NOT NULL,
  `cantidad_consumida` decimal(15,4) NOT NULL,
  `costo_unitario` decimal(15,4) NOT NULL,
  `costo_total` decimal(15,4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_preparacion` (`preparacion_id`),
  KEY `idx_capa` (`capa_id`),
  CONSTRAINT `preparacion_consumo_capas_ibfk_1` FOREIGN KEY (`preparacion_id`) REFERENCES `preparaciones` (`id_preparaciones`),
  CONSTRAINT `preparacion_consumo_capas_ibfk_2` FOREIGN KEY (`capa_id`) REFERENCES `inventario_capas` (`id_capa`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preparacion_consumo_capas`
--

LOCK TABLES `preparacion_consumo_capas` WRITE;
/*!40000 ALTER TABLE `preparacion_consumo_capas` DISABLE KEYS */;
/*!40000 ALTER TABLE `preparacion_consumo_capas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preparaciones`
--

DROP TABLE IF EXISTS `preparaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparaciones` (
  `id_preparaciones` int NOT NULL AUTO_INCREMENT,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `observaciones` text,
  `estado` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=PENDIENTE, 1=EN_PROCESO, 2=COMPLETADA, 3=CANCELADA',
  `item_general_id` int DEFAULT NULL,
  `formulacion_version_id` int DEFAULT NULL,
  `unidad_id` int DEFAULT NULL,
  PRIMARY KEY (`id_preparaciones`),
  KEY `fk_preparaciones_item_general1_idx` (`item_general_id`),
  KEY `fk_preparaciones_unidad1_idx` (`unidad_id`),
  KEY `idx_prep_form_ver` (`formulacion_version_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preparaciones`
--

LOCK TABLES `preparaciones` WRITE;
/*!40000 ALTER TABLE `preparaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `preparaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preparaciones_costos_indirectos`
--

DROP TABLE IF EXISTS `preparaciones_costos_indirectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparaciones_costos_indirectos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `preparaciones_id` int NOT NULL,
  `costos_indirectos_id` int DEFAULT NULL,
  `valor_aplicado` decimal(15,2) DEFAULT '0.00',
  `nombre` varchar(255) NOT NULL DEFAULT '',
  `categoria` varchar(100) NOT NULL DEFAULT 'otros',
  PRIMARY KEY (`id`),
  KEY `preparaciones_id` (`preparaciones_id`),
  KEY `costos_indirectos_id` (`costos_indirectos_id`),
  CONSTRAINT `preparaciones_costos_indirectos_ibfk_1` FOREIGN KEY (`preparaciones_id`) REFERENCES `preparaciones` (`id_preparaciones`),
  CONSTRAINT `preparaciones_costos_indirectos_ibfk_2` FOREIGN KEY (`costos_indirectos_id`) REFERENCES `costos_indirectos` (`id_costos_indirectos`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preparaciones_costos_indirectos`
--

LOCK TABLES `preparaciones_costos_indirectos` WRITE;
/*!40000 ALTER TABLE `preparaciones_costos_indirectos` DISABLE KEYS */;
/*!40000 ALTER TABLE `preparaciones_costos_indirectos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preparaciones_has_item_general`
--

DROP TABLE IF EXISTS `preparaciones_has_item_general`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparaciones_has_item_general` (
  `preparaciones_id_preparaciones` int NOT NULL,
  `item_general_id` int NOT NULL,
  `cantidad` decimal(10,2) DEFAULT NULL,
  `porcentajes` int DEFAULT NULL,
  PRIMARY KEY (`preparaciones_id_preparaciones`,`item_general_id`),
  KEY `fk_preparaciones_has_item_general_item_general1_idx` (`item_general_id`),
  KEY `fk_preparaciones_has_item_general_preparaciones1_idx` (`preparaciones_id_preparaciones`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preparaciones_has_item_general`
--

LOCK TABLES `preparaciones_has_item_general` WRITE;
/*!40000 ALTER TABLE `preparaciones_has_item_general` DISABLE KEYS */;
INSERT INTO `preparaciones_has_item_general` VALUES (21,22,3.00,1),(21,37,68.00,13),(21,142,10.00,2),(21,225,30.00,3),(21,226,60.00,19),(21,231,1.50,0),(21,232,5.00,1),(21,236,4.00,1),(21,244,15.00,3),(21,251,50.00,9),(21,252,165.00,31),(21,261,2.40,0),(21,269,8.00,1);
/*!40000 ALTER TABLE `preparaciones_has_item_general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produccion_insumos_detalle`
--

DROP TABLE IF EXISTS `produccion_insumos_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produccion_insumos_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `preparacion_id` int NOT NULL,
  `item_general_id` int NOT NULL,
  `proveedor_id` int DEFAULT NULL,
  `lote_proveedor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bodega_id` int DEFAULT NULL,
  `cantidad` decimal(15,4) NOT NULL,
  `costo_unitario` decimal(15,4) NOT NULL,
  `subtotal` decimal(15,4) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pid_insumos` (`preparacion_id`),
  KEY `idx_item_insumos` (`item_general_id`),
  KEY `idx_prov_insumos` (`proveedor_id`),
  KEY `idx_pid_lote` (`lote_proveedor`),
  CONSTRAINT `produccion_insumos_detalle_item_general_id_foreign` FOREIGN KEY (`item_general_id`) REFERENCES `item_general` (`id_item_general`),
  CONSTRAINT `produccion_insumos_detalle_preparacion_id_foreign` FOREIGN KEY (`preparacion_id`) REFERENCES `preparaciones` (`id_preparaciones`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produccion_insumos_detalle`
--

LOCK TABLES `produccion_insumos_detalle` WRITE;
/*!40000 ALTER TABLE `produccion_insumos_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `produccion_insumos_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedor`
--

DROP TABLE IF EXISTS `proveedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedor` (
  `id_proveedor` int NOT NULL AUTO_INCREMENT,
  `nombre_encargado` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nombre_empresa` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `numero_documento` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefono` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_proveedor`),
  UNIQUE KEY `id_proveedor_UNIQUE` (`id_proveedor`),
  KEY `idx_proveedor_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedor`
--

LOCK TABLES `proveedor` WRITE;
/*!40000 ALTER TABLE `proveedor` DISABLE KEYS */;
INSERT INTO `proveedor` VALUES (23,'Martha Pino Villa','COLARQUIM','800226277-6','Cl. 110 #75A-620 Bodega 14, Riomar','3135730324','servicioalclientebq@colarquim.com',NULL),(24,'Pma','PMA','1004914866','','','',NULL),(25,'Liliana Herrera','CONQUIMICA','890919549-1','Cra 42 #53-24, Itagui, Antioquia','6044032560','conquimica@conquimica.net',NULL),(26,'Carlos Pérez','RECIEND','1','','','',NULL),(27,'María Gómez','PROQUIMICOS','890105324-2','Cl 30 Cr 2B 72, Barranquilla','6053868166',NULL,NULL),(28,'Carlos Rodríguez','PROCESOS Y DISOLVENTES','1','','','',NULL),(29,'María Gómez','EVER POL','1','','','',NULL),(30,'Diana Perez','BRENNTAG COLOMBIA','860002590-1','Cl 30 #15-360, Barranquilla','3173685452',NULL,NULL),(31,'Xiomara','PREFLEX','860508470-0','Cra 2 #56-25, CAZUCA','3106793731','xpineda@preflex.com.co',NULL),(32,'María Gómez','IS GROUP DE COLOMBIA','800987654-2',NULL,NULL,NULL,NULL),(33,'Juan','DISTRIATLANTICO','900751588-5','Via 40 #85-340 Bod 16, B/quilla','3008513325','ventas@distriatlantico.com',NULL),(34,'Carlos Pérez','QUIMIENVASES S.A.S.','802014821-1','Cra 42 #51-82, Barranquilla','6053316181','quimienvasessas@gmail.com',NULL),(35,'Juan','AQUATERRA S.A.S.','811027317-9','Cra 50FF #10B Sur-61, Medellin','(4) 361-1800','teescucha@aquaterra.com.co',NULL),(36,'Juan','PQUIM S.A.S.','800162553-8','Cra 43 #64-28, Barranquilla','605 396 6970','ventas.baq@pquim.com.co',NULL),(37,'Juan','NEW TRADING INTERNATIONAL','830074835-1','Cra 64 #4-54, Bogota','6014004096','servicioalcliente@newtr.com',NULL),(38,'Juan','NOVAROMAS S.A.','1','Via 40 #51-153, Barranquilla','6053701578','ventas@novaromas.com',NULL),(39,'Juan','AZELIS','1','Autopista Medellin KM 5.7  ','3204955508','juanita.londono@azelis.com',NULL),(40,'Juan','CHEMO COLOMBIA S.A.S.','900490268-2','Autopista Bog-Med Km2.5, Oikos Bod I137, Cota','6018767456',NULL,NULL),(41,'Juan','ZIKA','1','','','',NULL),(42,'Astrid','DSINCO','1','','3114279127','',NULL),(43,'Juan','TONNER','1','','','',NULL),(44,'JUAN','DISINCO','1','','','','2026-07-02 20:08:50'),(45,'Fabio','QUIMICAR','1','Barranquilla','','quimicar@gmail.com',NULL);
/*!40000 ALTER TABLE `proveedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Hash SHA-256 del refresh token. NUNCA el token plano.',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `token_hash` (`token_hash`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `refresh_tokens_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (3,2,'e9d5febaf1ce5966791afceed3fd1407fd7a790d09bab103635bd321bd26002b','2026-06-03 20:36:42','2026-05-27 20:36:42',0),(4,2,'523553bf1e83f5f1cdaefd70ddf49d82734e8cc5b3f2908e5b99c6fa5821c888','2026-06-05 16:54:48','2026-05-29 16:54:48',0),(5,2,'1b3424b2f8b31473a4fded36a16bea3edb64f9bebb7eb422d82687567d907de1','2026-06-06 14:25:18','2026-05-30 14:25:18',0),(6,2,'b9e833fc48da19809bb6176c5704f86a4c3da38d77f92d89a1e198d3ab516fc4','2026-06-06 14:25:30','2026-05-30 14:25:30',0),(7,2,'13cc2d576f6b8818c42ba56cd6d6fe135fab90381e5c148dd86ba7eb7022fafd','2026-06-06 19:18:37','2026-05-30 19:18:37',0),(8,2,'ec2df7a209be01eb5c9119c027753ecd23dbdc6c3c4299b4a655fc491af2a401','2026-06-06 19:22:59','2026-05-30 19:22:59',0),(9,2,'8f522215e7d59bda16cec0b2d810e00a684f0ddd527052d5638f73c8b12e35d4','2026-07-04 15:46:46','2026-06-27 15:46:46',0),(10,2,'2a41954186dde32d8d6fd90ccf4c48c1569ccf9bf33c1108a25d75c89c6958fd','2026-07-09 14:49:58','2026-07-02 14:49:58',0),(11,2,'9304c3bdec2525beda486ee882f5a8cad14ed6dd627eb10f500b2a7ff00e84ea','2026-07-10 16:20:25','2026-07-03 16:20:25',0),(12,2,'bfccb03b135c7c588b5a9e4b9f7d7557cf2aabb56dc61fce8862d4263da2ef4f','2026-07-10 16:21:28','2026-07-03 16:21:28',0),(13,2,'b196556350fc7c835ca6aae284a80ed26ad46d9bf2e0441551fd34c7a5f2a665','2026-07-11 15:01:26','2026-07-04 15:01:26',0),(44,2,'d3264f65d4b4d9b3a59d3084c7d6e8704d4769b3a5dd5e3d0c942edd99b62bc0','2026-07-21 13:42:44','2026-07-14 13:42:44',0),(45,2,'84410bbdf15bfe608ef346e966ead16bc9e478ef1a681657297bbf0b5c264c5b','2026-07-21 21:47:46','2026-07-14 21:47:46',0),(46,2,'7b98eb3d7e8e71ef8730107f9bf9dbfa9601230446740091123baa647227516b','2026-07-23 18:47:23','2026-07-16 18:47:23',0),(47,2,'f1ad8f808c0fed85ea00cb0ea07a5f56fb3f10f5ad632e8d2c096383113dc928','2026-07-24 16:41:30','2026-07-17 16:41:30',0),(48,2,'9d5f2a6ef78cc67421b05515b9e7f8517f3aa2ce636f4e902d83caa033f29033','2026-07-31 14:20:20','2026-07-24 14:20:20',1),(49,2,'8600e688d5e321af6cf015ba1bb1ea2bfd7ea9df1afbe0a7c72c06fafd205f89','2026-07-31 22:18:26','2026-07-24 22:18:26',0),(50,2,'7f5f0efcc874105a692a5bfda74d310a3f45e6bb4a330b048f1c09366a43d5a9','2026-08-04 13:48:27','2026-07-28 13:48:27',0),(51,2,'5cc076ac0f0f5c5f8616d943d5e2e567cbad390e57cf8e3eabb915c678f29a1a','2026-08-17 19:24:44','2026-08-10 19:24:44',0);
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remisiones`
--

DROP TABLE IF EXISTS `remisiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remisiones` (
  `id_remisiones` int unsigned NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `cliente_id` int NOT NULL,
  `fecha_remision` date NOT NULL,
  `estado` enum('Pendiente','Facturada','Anulada') NOT NULL DEFAULT 'Pendiente',
  `direccion_entrega` varchar(255) DEFAULT NULL,
  `observaciones` text,
  `facturas_id` int DEFAULT NULL,
  `movimiento_inventario_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_remisiones`),
  UNIQUE KEY `numero` (`numero`),
  KEY `cliente_id` (`cliente_id`),
  KEY `facturas_id` (`facturas_id`),
  KEY `movimiento_inventario_id` (`movimiento_inventario_id`),
  KEY `idx_remisiones_deleted_at` (`deleted_at`),
  CONSTRAINT `remisiones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_clientes`),
  CONSTRAINT `remisiones_ibfk_2` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id_facturas`),
  CONSTRAINT `remisiones_ibfk_3` FOREIGN KEY (`movimiento_inventario_id`) REFERENCES `movimiento_inventario` (`id_movimiento_inventario`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remisiones`
--

LOCK TABLES `remisiones` WRITE;
/*!40000 ALTER TABLE `remisiones` DISABLE KEYS */;
INSERT INTO `remisiones` VALUES (18,'REM-2026-0001',1,'2026-05-25','Anulada',NULL,NULL,NULL,NULL,'2026-05-25 14:59:56',NULL),(19,'REM-2026-0002',1,'2026-05-25','Pendiente',NULL,NULL,NULL,NULL,'2026-05-25 14:59:57',NULL),(20,'REM-2026-0003',1,'2026-05-25','Anulada',NULL,NULL,NULL,NULL,'2026-05-25 16:04:47',NULL),(21,'REM-2026-0004',1,'2026-05-25','Pendiente',NULL,NULL,NULL,NULL,'2026-05-25 16:04:48',NULL);
/*!40000 ALTER TABLE `remisiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remisiones_detalle`
--

DROP TABLE IF EXISTS `remisiones_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remisiones_detalle` (
  `id_detalle` int unsigned NOT NULL AUTO_INCREMENT,
  `remisiones_id` int unsigned NOT NULL,
  `item_general_id` int DEFAULT NULL,
  `bodega_id` int DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id_detalle`),
  KEY `remisiones_id` (`remisiones_id`),
  KEY `idx_remdet_item` (`item_general_id`),
  CONSTRAINT `remisiones_detalle_ibfk_1` FOREIGN KEY (`remisiones_id`) REFERENCES `remisiones` (`id_remisiones`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remisiones_detalle`
--

LOCK TABLES `remisiones_detalle` WRITE;
/*!40000 ALTER TABLE `remisiones_detalle` DISABLE KEYS */;
INSERT INTO `remisiones_detalle` VALUES (17,18,1,1,'Test despacho',1.50,10000.00,15000.00),(18,19,1,NULL,'Test sin stock',999999.00,1.00,999999.00),(19,20,1,1,'Test despacho',1.50,10000.00,15000.00),(20,21,1,NULL,'Test sin stock',12.00,1.00,12.00);
/*!40000 ALTER TABLE `remisiones_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisiciones_compra`
--

DROP TABLE IF EXISTS `requisiciones_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisiciones_compra` (
  `id_requisicion` int unsigned NOT NULL AUTO_INCREMENT,
  `preparacion_id` int unsigned NOT NULL,
  `item_general_id` int unsigned NOT NULL,
  `item_proveedor_id` int unsigned DEFAULT NULL,
  `proveedor_id` int unsigned DEFAULT NULL,
  `cantidad_necesaria` decimal(10,4) NOT NULL,
  `cantidad_disponible` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `cantidad_solicitada` decimal(10,4) NOT NULL,
  `precio_unitario` decimal(14,2) DEFAULT NULL,
  `estado` enum('SUGERIDA','PENDIENTE','APROBADA','CONVERTIDA','CANCELADA') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `orden_compra_id` int unsigned DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id_requisicion`),
  KEY `preparacion_id` (`preparacion_id`),
  KEY `estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisiciones_compra`
--

LOCK TABLES `requisiciones_compra` WRITE;
/*!40000 ALTER TABLE `requisiciones_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `requisiciones_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tambor_movimientos`
--

DROP TABLE IF EXISTS `tambor_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tambor_movimientos` (
  `id_tambor_movimiento` int NOT NULL AUTO_INCREMENT,
  `tambor_id` int NOT NULL,
  `tipo` tinyint DEFAULT NULL COMMENT '1=entrada 2=salida',
  `cantidad` decimal(10,2) DEFAULT NULL,
  `referencia_tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  PRIMARY KEY (`id_tambor_movimiento`),
  KEY `fk_tambor_mov_tambor` (`tambor_id`),
  CONSTRAINT `fk_tambor_mov_tambor` FOREIGN KEY (`tambor_id`) REFERENCES `tambores` (`id_tambor`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tambor_movimientos`
--

LOCK TABLES `tambor_movimientos` WRITE;
/*!40000 ALTER TABLE `tambor_movimientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tambor_movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidad`
--

DROP TABLE IF EXISTS `unidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidad` (
  `id_unidad` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `estados` tinyint DEFAULT NULL,
  `escala` decimal(10,5) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_unidad`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidad`
--

LOCK TABLES `unidad` WRITE;
/*!40000 ALTER TABLE `unidad` DISABLE KEYS */;
INSERT INTO `unidad` VALUES (1,'TAMBOR','',1,50.00000,NULL),(2,'CUÑETE','',1,5.00000,NULL),(3,'GALON','',1,1.00000,NULL),(4,'1/2 GALON','',1,0.50000,NULL),(5,'1/4 GALON','',1,0.25000,NULL),(6,'1/8 GALON','',1,0.12500,NULL),(7,'1/16 GALON','',1,0.06250,NULL),(8,'1/32 GALON','',1,0.03125,NULL),(9,'KILO','',1,1.00000,NULL),(10,'GRAMO','',1,0.00100,NULL),(11,'LIBRA','',1,0.45300,NULL),(12,'LITRO','',1,0.26417,NULL),(13,'UNIDAD',NULL,NULL,1.00000,NULL),(14,'CAJA',NULL,NULL,1.00000,NULL),(15,'BULTO',NULL,NULL,1.00000,NULL),(16,'CANECA',NULL,NULL,1.00000,NULL);
/*!40000 ALTER TABLE `unidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuarios` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `rol` enum('superadmin','admin','operador','visor') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'operador',
  `password_must_change` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si 1, el usuario debe cambiar password al próximo login.',
  `token_version` int unsigned NOT NULL DEFAULT '1' COMMENT 'Incrementa al cambiar rol o password — invalida tokens viejos.',
  PRIMARY KEY (`id_usuarios`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'root','Jorge Herrera','$2y$10$zcSxsrQHkHFxPddPk/.TFeeFceYqtUeb3wtlLSxfnDG4Ll5dL1Szu','admin',0,1),(5,'1juanherrera','Juan Herrera','$2y$10$gbWzSg/j.GwJHlMT9LKKMujex17dmeanFGm2myxFAyRl7f.jh/J8a','superadmin',1,1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'gestorpincadb'
--

--
-- Dumping routines for database 'gestorpincadb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-14 21:01:17
