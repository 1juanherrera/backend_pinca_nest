import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import configuration, { envValidationSchema } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { BodegasModule } from './modules/bodegas/bodegas.module';
import { InstalacionesModule } from './modules/instalaciones/instalaciones.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { NumeracionModule } from './modules/numeracion/numeracion.module';
import { CotizacionesModule } from './modules/cotizaciones/cotizaciones.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { OrdenesCompraModule } from './modules/ordenes-compra/ordenes-compra.module';
import { RemisionesModule } from './modules/remisiones/remisiones.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { PreparacionesModule } from './modules/preparaciones/preparaciones.module';
import { FormulacionesModule } from './modules/formulaciones/formulaciones.module';
import { SincronizacionModule } from './modules/sincronizacion/sincronizacion.module';
import { PagosClienteModule } from './modules/pagos-cliente/pagos-cliente.module';
import { NotasCreditoModule } from './modules/notas-credito/notas-credito.module';
import { CarteraModule } from './modules/cartera/cartera.module';
import { GestionesCobroModule } from './modules/gestiones-cobro/gestiones-cobro.module';
import { PermisosModule } from './modules/permisos/permisos.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ItemProveedorModule } from './modules/item-proveedor/item-proveedor.module';
import { RequisicionesModule } from './modules/requisiciones/requisiciones.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { SaludSistemaModule } from './modules/salud-sistema/salud-sistema.module';
import { TrazabilidadModule } from './modules/trazabilidad/trazabilidad.module';
import { SearchModule } from './modules/search/search.module';
import { ComparadorModule } from './modules/comparador/comparador.module';
import { ItemModule } from './modules/item/item.module';
import { CostosModule } from './modules/costos/costos.module';
import { CostosProduccionModule } from './modules/costos-produccion/costos-produccion.module';
import { BodegaInventarioModule } from './modules/bodega-inventario/bodega-inventario.module';
import { FormulacionesCostosModule } from './modules/formulaciones-costos/formulaciones-costos.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { VisorReadonlyGuard } from './common/guards/visor-readonly.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    // Cron interno (reemplaza `php spark snapshot:costos` de CI4) — ver
    // CostosProduccionService.snapshotMensual. Necesario para el cutover de CI4.
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    // Feature modules migrados (se van agregando de a uno en la coexistencia).
    // Fase 1 — CRUDs simples:
    UnidadesModule,
    CategoriasModule,
    BodegasModule,
    InstalacionesModule,
    ProveedoresModule,
    ClientesModule,
    // Fase 2 (lote A) — documentos comerciales (núcleo ventas/cobranza):
    NumeracionModule,
    CotizacionesModule,
    FacturasModule,
    // Fase 2 (lote B) — catálogo + compras + remisiones:
    CatalogoModule,
    OrdenesCompraModule,
    RemisionesModule,
    // Fase 3 (lecturas) — inventario / capas / movimientos:
    InventarioModule,
    // Compras — requisiciones + MRP. VA ANTES de PreparacionesModule: la ruta estática
    // `preparaciones/verificar-disponibilidad` debe registrarse antes que el `preparaciones/:id`
    // de PreparacionesController (Express: primer match gana).
    RequisicionesModule,
    // Fase 3 (escritura) — producción:
    PreparacionesModule,
    // Fase 3 — recetas (BOM):
    FormulacionesModule,
    // Fase 3 — sincronización catálogo↔proveedores (no-IA):
    SincronizacionModule,
    // Bloque financiero — cobranza (pagos/NC alimentan recalcularSaldo de facturas):
    PagosClienteModule,
    NotasCreditoModule,
    CarteraModule,
    GestionesCobroModule,
    // Transversal — RBAC (roles/permisos/módulos):
    PermisosModule,
    // Transversal — configuración del sistema (CRUD admin):
    ConfiguracionModule,
    // Transversal — empresa (datos; logo se queda en CI4 por el filesystem):
    EmpresaModule,
    // Transversal — Panel Principal (agrega KPIs de Cartera + Sincronización + queries propias):
    DashboardModule,
    // Compras — item_proveedor (CRUD + vincular + resolverItemGeneral) y proveedor_items:
    ItemProveedorModule,
    // Utilitario — notificaciones (lista + marcar leída + lazy-cron de automáticas):
    NotificacionesModule,
    // Utilitario — auditoría (login-attempts + movimientos, read-only admin):
    AuditoriaModule,
    // Utilitario — salud del sistema (dashboard de calidad de datos, read-only):
    SaludSistemaModule,
    // Utilitario — trazabilidad de lote (preparación↔lotes↔proveedores, read-only):
    TrazabilidadModule,
    // Utilitario — búsqueda global Cmd+K (read-only):
    SearchModule,
    // Compras — comparador de precios proveedor/item + historial (read-only):
    ComparadorModule,
    // Catálogo legacy — ItemController (/item_general CRUD full-item + buscar fuzzy):
    ItemModule,
    // Costeo — costos_item (PUT) + costos_indirectos (CRUD + resumen + asignación a ítem):
    CostosModule,
    // Costeo — costos-producción: solo `historia` (index/show diferidos a CI4 por cálculo fuzzy):
    CostosProduccionModule,
    // Inventario legacy — bodegas/inventario/:id (read paginado por bodega + BOM):
    BodegaInventarioModule,
    // Costeo — simulaciones de costo de formulaciones (costos/:id, recalcular, proveedores, opciones):
    FormulacionesCostosModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guards GLOBALES en orden de ejecución:
    // 1) JwtAuthGuard  → autentica (valida Bearer + token_version). Salta con @Public().
    // 2) VisorReadonlyGuard → visor = solo lectura (bloquea mutaciones).
    // 3) RolesGuard    → exige @Roles(...) en el handler si está declarado.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: VisorReadonlyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
