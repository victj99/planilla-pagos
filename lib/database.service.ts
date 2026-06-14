import Big from 'big.js'
import { and, asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm'
import { calcularPagoTrabajador, labelDiaSemana, normalizarNombre, normalizarParaBusqueda } from './utils'
import { db } from './database'
import { AjusteSemanalInsert, ajusteSemanalTable } from './db/ajusteSemanal'
import { distribucionDescuentoTable } from './db/distribucionDescuento'
import { PlanillaSemanalInsert, planillaSemanalTable } from './db/planillaSemanal'
import { ProductoInsert, productoTable } from './db/producto'
import { ProductoProcesadoInsert, productoProcesadoTable } from './db/productoProcesado'
import { TrabajadorInsert, trabajadorTable } from './db/trabajador'
import { TrabajadorProcesoInsert, TrabajadorProcesoSelect3, trabajadorProcesoTable, TrabajadorProcesoUpdate } from './db/trabajadorProceso'

// Planilla semanal
export function obtenerPlanillasSemanales() {
  return db.select().from(planillaSemanalTable).orderBy(desc(planillaSemanalTable.creacion)).all()
}

export function obtenerResumenPlanillas() {
  return db
    .select({
      id: planillaSemanalTable.id,
      nombre: planillaSemanalTable.nombre,
      creacion: planillaSemanalTable.creacion,
      sesiones: count(productoProcesadoTable.id),
      totalBruto: sql<number>`COALESCE(SUM(${productoProcesadoTable.toneladas} * ${productoProcesadoTable.precioTonelada}), 0)`,
    })
    .from(planillaSemanalTable)
    .leftJoin(productoProcesadoTable, eq(productoProcesadoTable.idPlanillaSemanal, planillaSemanalTable.id))
    .groupBy(planillaSemanalTable.id)
    .orderBy(desc(planillaSemanalTable.creacion))
    .all()
}

export async function insertarPlanillaSemanal(data: PlanillaSemanalInsert) {
  const insert = await db.insert(planillaSemanalTable).values(data)
  return insert.lastInsertRowId
}

// Productos procesados
export function obtenerProductoProcesado(id: number) {
  const data = db.select().from(productoProcesadoTable).where(
    eq(productoProcesadoTable.id, id)
  ).limit(1).all()

  return data[0]
}

export function obtenerProductoProcesado2(id: number) {
  const data = db.select({
    toneladas: productoProcesadoTable.toneladas,
    precioTonelada: productoProcesadoTable.precioTonelada,
    nombreProducto: productoTable.nombre,
  }).from(productoProcesadoTable)
    .innerJoin(productoTable, eq(productoTable.id, productoProcesadoTable.idProducto))
    .where(eq(productoProcesadoTable.id, id)).limit(1).all()


  return data[0]
}

export function obtenerProductosProcesadosPorPlanilla(idPlanilla: number) {
  return db.select({
    id: productoProcesadoTable.id,
    toneladas: productoProcesadoTable.toneladas,
    precioTonelada: productoProcesadoTable.precioTonelada,
    diaSemana: productoProcesadoTable.diaSemana,
    nombreProducto: productoTable.nombre,
    etiqueta: productoProcesadoTable.etiqueta,
  }).from(productoProcesadoTable)
    .innerJoin(productoTable, eq(productoTable.id, productoProcesadoTable.idProducto))
    .where(eq(productoProcesadoTable.idPlanillaSemanal, idPlanilla))
    .all()

}

export async function insertarProductoProcesado(data: ProductoProcesadoInsert) {
  const insert = await db.insert(productoProcesadoTable).values(data)
  return insert.lastInsertRowId
}

export async function actualizarProductoProcesado(data: ProductoProcesadoInsert) {
  const { id, ...values } = data
  await db.update(productoProcesadoTable).set(values).where(
    eq(productoProcesadoTable.id, id!)
  )
}

export async function eliminaProductoProcesado(id: number) {
  await db.delete(productoProcesadoTable).where(
    eq(productoProcesadoTable.id, id)
  )
}

// Trabajadores proceso
export function obtenerTrabajadorProceso(id: number) {
  return db.select().from(trabajadorProcesoTable).where(eq(trabajadorProcesoTable.id, id)).get()
}

export async function obtenerTrabajadorProcesoByParams(idTrabajador: number, idProductoProcesado: number) {
  const data = await db.select().from(trabajadorProcesoTable).where(and(
    eq(trabajadorProcesoTable.idTrabajador, idTrabajador),
    eq(trabajadorProcesoTable.idProductoProcesado, idProductoProcesado),
  )).limit(1)

  return data[0]
}

export function obtenerTrabajadorProceso2(id: number) {

  const data = db.select({
    id: trabajadorProcesoTable.id,
    toneladasProcesadas: trabajadorProcesoTable.toneladasProcesadas,
    totalColaboradores: trabajadorProcesoTable.totalColaboradores,
    distribucionInicializada: trabajadorProcesoTable.distribucionInicializada,

    idTrabajador: trabajadorProcesoTable.idTrabajador,
    nombreTrabajador: trabajadorTable.nombre,

    idProductoProcesado: productoProcesadoTable.id,
    toneladasTotales: productoProcesadoTable.toneladas,
    precioTonelada: productoProcesadoTable.precioTonelada,

    maxTrabajadores: sql<number>`(SELECT MAX(tp.totalColaboradores) FROM trabajadorProceso tp
      WHERE tp.idProductoProcesado = ${trabajadorProcesoTable.idProductoProcesado})
    `
  }).from(trabajadorProcesoTable)
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, trabajadorProcesoTable.idTrabajador))
    .innerJoin(productoProcesadoTable, eq(productoProcesadoTable.id, trabajadorProcesoTable.idProductoProcesado))
    .where(eq(trabajadorProcesoTable.id, id)).limit(1)

  return data.all()[0]
}

export async function liveQueryTrabajadoresProceso(idProductoProcesado: number) {

  return await db.select({
    id: trabajadorProcesoTable.id,
    toneladasProcesadas: trabajadorProcesoTable.toneladasProcesadas,
    totalColaboradores: trabajadorProcesoTable.totalColaboradores,
    nombreTrabajador: trabajadorTable.nombre,
    idProductoProcesado: trabajadorProcesoTable.idProductoProcesado,
    idTrabajador: trabajadorProcesoTable.idTrabajador,
    // montoExtra: sql<number | null>`(
    //  SELECT
    //       ROUND(SUM( 
    //         ROUND((b_inner.toneladasRestantes * b_inner.precioTonelada) / b_inner.totalColaboradores, 2) / b_inner.totalColaboradoresReparto
    //       ), 2)
    //     FROM (
    //         SELECT
    //             (pp_inner.toneladas - tp_inner.toneladasProcesadas) AS toneladasRestantes,
    //             pp_inner.precioTonelada,
    //             (
    //                 SELECT COUNT(1)
    //                 FROM "distribucionDescuento" dd2_inner
    //                 WHERE dd2_inner.idTrabajadorProceso = tp_inner.id
    //             ) as totalColaboradoresReparto,
    // 		        tp_inner.totalColaboradores
    //         FROM "distribucionDescuento" dd_inner
    //         INNER JOIN "trabajadorProceso" tp_inner ON tp_inner.id = dd_inner.idTrabajadorProceso
    //         INNER JOIN "productoProcesado" pp_inner ON pp_inner.id = tp_inner.idProductoProcesado
    //       WHERE pp_inner.id = ${trabajadorProcesoTable.idProductoProcesado} 
    //         AND dd_inner.idTrabajador = ${trabajadorTable.id}
    //   ) AS b_inner
    // )`.as('montoExtra')
  }).from(trabajadorProcesoTable)
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, trabajadorProcesoTable.idTrabajador))
    .where(eq(trabajadorProcesoTable.idProductoProcesado, idProductoProcesado))
}

export async function obtenerDatosPagoExtra(idTrabajador: number, idProductoProcesado: number) {
  const data = await db.select({
    toneladasTotales: productoProcesadoTable.toneladas,
    nombreTrabajadorProceso: trabajadorTable.nombre,
    toneladasProcesadas: trabajadorProcesoTable.toneladasProcesadas,

    precioTonelada: productoProcesadoTable.precioTonelada,
    totalColaboradores: trabajadorProcesoTable.totalColaboradores,
    totalColaboradoresReparto: sql<number>`(
      SELECT COUNT(1) FROM "distribucionDescuento" dd2_inner WHERE dd2_inner.idTrabajadorProceso = ${trabajadorProcesoTable.id}
    )`.as('totalColaboradoresReparto'),
  })
    .from(distribucionDescuentoTable)
    .innerJoin(trabajadorProcesoTable, eq(trabajadorProcesoTable.id, distribucionDescuentoTable.idTrabajadorProceso))
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, trabajadorProcesoTable.idTrabajador))
    .innerJoin(productoProcesadoTable, eq(productoProcesadoTable.id, trabajadorProcesoTable.idProductoProcesado))
    .where(and(
      eq(productoProcesadoTable.id, idProductoProcesado),
      eq(distribucionDescuentoTable.idTrabajador, idTrabajador)
    ))

  return data
}

export async function obtenerCalculoPagoExtra(idTrabajador: number, idProductoProcesado: number) {
  const data = await obtenerDatosPagoExtra(idTrabajador, idProductoProcesado)

  let pago = 0

  for (const item of data) {
    if (
      item.toneladasTotales === 0 ||
      item.toneladasProcesadas === 0 ||
      item.precioTonelada === 0 ||
      item.totalColaboradores === 0 ||
      item.totalColaboradoresReparto === 0
    ) continue

    const toneladasRestantes = new Big(item.toneladasTotales).minus(item.toneladasProcesadas).round(2)

    const monto1 = toneladasRestantes.mul(item.precioTonelada)
    const monto2 = monto1.div(item.totalColaboradores)

    pago += monto2.div(item.totalColaboradoresReparto).round(2).toNumber()
  }

  return pago
}

export function obtenerTrabajadoresProductoProceso(idProductoProcesado: number, idTrabajadorProcesoActual: number): TrabajadorProcesoSelect3[] {
  const where = eq(trabajadorProcesoTable.idProductoProcesado, idProductoProcesado)

  const list = db.select({
    idTrabajador: trabajadorProcesoTable.idTrabajador,
    nombreTrabajador: trabajadorTable.nombre,

    idDistribucionDescuento: distribucionDescuentoTable.id,
  }).from(trabajadorProcesoTable)
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, trabajadorProcesoTable.idTrabajador))
    .leftJoin(distribucionDescuentoTable, and(
      eq(distribucionDescuentoTable.idTrabajador, trabajadorProcesoTable.idTrabajador),
      eq(distribucionDescuentoTable.idTrabajadorProceso, idTrabajadorProcesoActual)
    ))
    .where(where).all()

  return list
}

export async function insertarTrabajadorProceso(data: TrabajadorProcesoInsert) {
  const insert = await db.insert(trabajadorProcesoTable).values(data)
  return insert.lastInsertRowId
}

export async function actualizarTrabajadorProceso(data: TrabajadorProcesoUpdate) {
  await db.update(trabajadorProcesoTable).set({
    toneladasProcesadas: data.toneladasProcesadas,
    totalColaboradores: data.totalColaboradores,
  }).where(eq(trabajadorProcesoTable.id, data.id!))
}

export async function eliminaTrabajadorProceso(id: number) {
  const proceso = db.select({
    idTrabajador: trabajadorProcesoTable.idTrabajador,
    idProductoProcesado: trabajadorProcesoTable.idProductoProcesado,
  }).from(trabajadorProcesoTable).where(eq(trabajadorProcesoTable.id, id)).all()[0]

  await db.transaction(async (tx) => {
    // Distribuciones que este trabajador repartía
    await tx.delete(distribucionDescuentoTable).where(
      eq(distribucionDescuentoTable.idTrabajadorProceso, id)
    )

    // Distribuciones de OTROS donde este trabajador figura como receptor
    // (dentro del mismo producto procesado), para no dejar receptores fantasma
    if (proceso) {
      const procesosDelProducto = tx.select({ id: trabajadorProcesoTable.id })
        .from(trabajadorProcesoTable)
        .where(eq(trabajadorProcesoTable.idProductoProcesado, proceso.idProductoProcesado))

      await tx.delete(distribucionDescuentoTable).where(and(
        eq(distribucionDescuentoTable.idTrabajador, proceso.idTrabajador),
        inArray(distribucionDescuentoTable.idTrabajadorProceso, procesosDelProducto)
      ))
    }

    await tx.delete(trabajadorProcesoTable).where(
      eq(trabajadorProcesoTable.id, id)
    )
  })
}

// Trabajador
// Búsqueda normalizada (sin acentos / sin mayúsculas / tolerante a puntos).
// Filtra solo activos y hace el match en JS sobre nombre y alias.
export function obtenerTrabajadoresPorNombre(value: string, limite = 20) {
  const consulta = normalizarParaBusqueda(value)
  if (!consulta) return []

  const activos = db.select().from(trabajadorTable).where(eq(trabajadorTable.activo, true)).all()

  return activos
    .filter(t =>
      normalizarParaBusqueda(t.nombre).includes(consulta) ||
      (t.alias ? normalizarParaBusqueda(t.alias).includes(consulta) : false)
    )
    .slice(0, limite)
}

// Trabajadores (distintos, activos) que participan en alguna sesión de la planilla
export function obtenerTrabajadoresDePlanilla(idPlanilla: number) {
  return db.selectDistinct({
    id: trabajadorTable.id,
    nombre: trabajadorTable.nombre,
    alias: trabajadorTable.alias,
    activo: trabajadorTable.activo,
  }).from(trabajadorProcesoTable)
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, trabajadorProcesoTable.idTrabajador))
    .innerJoin(productoProcesadoTable, eq(productoProcesadoTable.id, trabajadorProcesoTable.idProductoProcesado))
    .where(and(
      eq(productoProcesadoTable.idPlanillaSemanal, idPlanilla),
      eq(trabajadorTable.activo, true),
    ))
    .orderBy(asc(trabajadorTable.nombre))
    .all()
}

export function obtenerTrabajadores(soloActivos = true) {
  const query = db.select().from(trabajadorTable)
  const lista = soloActivos
    ? query.where(eq(trabajadorTable.activo, true)).all()
    : query.all()

  return lista.sort((a, b) => normalizarParaBusqueda(a.nombre).localeCompare(normalizarParaBusqueda(b.nombre)))
}

export function obtenerTrabajador(id: number) {
  const data = db.select().from(trabajadorTable).where(eq(trabajadorTable.id, id)).limit(1).all()

  return data[0]
}

export async function insertarTrabajador(data: TrabajadorInsert) {
  const insert = await db.insert(trabajadorTable).values({
    ...data,
    nombre: normalizarNombre(data.nombre),
  })
  return insert.lastInsertRowId
}

export async function actualizarTrabajador(id: number, data: { nombre: string, alias?: string | null }) {
  await db.update(trabajadorTable).set({
    nombre: normalizarNombre(data.nombre),
    alias: data.alias ? normalizarNombre(data.alias) : null,
  }).where(eq(trabajadorTable.id, id))
}

export async function archivarTrabajador(id: number, activo: boolean) {
  await db.update(trabajadorTable).set({ activo }).where(eq(trabajadorTable.id, id))
}

// Fusiona varios trabajadores en uno canónico: reasigna su historial y elimina los duplicados.
export async function fusionarTrabajadores(idCanonico: number, idsAFusionar: number[]) {
  const ids = idsAFusionar.filter(id => id !== idCanonico)
  if (ids.length === 0) return

  await db.transaction(async (tx) => {
    for (const id of ids) {
      await tx.update(trabajadorProcesoTable)
        .set({ idTrabajador: idCanonico })
        .where(eq(trabajadorProcesoTable.idTrabajador, id))

      await tx.update(distribucionDescuentoTable)
        .set({ idTrabajador: idCanonico })
        .where(eq(distribucionDescuentoTable.idTrabajador, id))

      await tx.delete(trabajadorTable).where(eq(trabajadorTable.id, id))
    }
  })
}

// Producto
export function obtenerProducto(id: number) {
  return db.select().from(productoTable).where(eq(productoTable.id, id)).get()
}

export function obtenerProductosPorNombre(value: string) {
  return db.select().from(productoTable).where(like(productoTable.nombre, value)).all()
}

export async function insertarProducto(data: ProductoInsert) {
  const insert = await db.insert(productoTable).values(data)
  return insert.lastInsertRowId
}

export async function actualizarPrecioProducto(id: number, precioTonelada: number) {
  const insert = await db.update(productoTable).set({ precioTonelada }).where(
    eq(productoTable.id, id)
  )
  return insert.lastInsertRowId
}

// Distribución descuento
export async function insertarDistribucionDescuento(idTrabajador: number, idTrabajadorProceso: number) {
  // await db.delete(distribucionDescuentoTable)
  const insert = await db.insert(distribucionDescuentoTable).values({ idTrabajador, idTrabajadorProceso })

  return insert.lastInsertRowId
}

export async function eliminarDistribucionDescuento(id: number) {
  await db.delete(distribucionDescuentoTable).where(
    eq(distribucionDescuentoTable.id, id)
  )
}

// Marca todos los demás trabajadores del producto procesado como receptores del
// restante (excepto el actual, que está deshabilitado), y deja registrado que la
// distribución ya fue inicializada para no reiniciarla si luego se desmarcan todos.
export async function inicializarDistribucion(
  idTrabajadorProceso: number,
  idProductoProcesado: number,
  idTrabajadorActual: number
) {
  // Si ya existen registros (p. ej. datos previos a esta función), se respeta la
  // selección existente y solo se marca el flag, evitando duplicados.
  const existentes = db.select({ id: distribucionDescuentoTable.id })
    .from(distribucionDescuentoTable)
    .where(eq(distribucionDescuentoTable.idTrabajadorProceso, idTrabajadorProceso))
    .all()

  const trabajadores = existentes.length ? [] : db.select({ idTrabajador: trabajadorProcesoTable.idTrabajador })
    .from(trabajadorProcesoTable)
    .where(eq(trabajadorProcesoTable.idProductoProcesado, idProductoProcesado))
    .all()
    .filter(t => t.idTrabajador !== idTrabajadorActual)

  await db.transaction(async (tx) => {
    if (trabajadores.length) {
      await tx.insert(distribucionDescuentoTable).values(
        trabajadores.map(t => ({ idTrabajador: t.idTrabajador, idTrabajadorProceso }))
      )
    }
    await tx.update(trabajadorProcesoTable)
      .set({ distribucionInicializada: true })
      .where(eq(trabajadorProcesoTable.id, idTrabajadorProceso))
  })
}

// Limpia la distribución cuando ya no hay restante que repartir y reinicia el flag,
// para que un futuro restante arranque de cero con todos marcados.
export async function limpiarDistribucion(idTrabajadorProceso: number) {
  await db.transaction(async (tx) => {
    await tx.delete(distribucionDescuentoTable).where(
      eq(distribucionDescuentoTable.idTrabajadorProceso, idTrabajadorProceso)
    )
    await tx.update(trabajadorProcesoTable)
      .set({ distribucionInicializada: false })
      .where(eq(trabajadorProcesoTable.id, idTrabajadorProceso))
  })
}

// Cuadre: esperado (toneladas × precio) vs asignado (suma de pagos) por sesión de la planilla
export interface FilaCuadre {
  idProductoProcesado: number
  etiqueta: string
  esperado: number
  asignado: number
  diferencia: number
}

export async function obtenerCuadrePlanilla(idPlanilla: number) {
  const productos = obtenerProductosProcesadosPorPlanilla(idPlanilla)
  const trabajos = await listarTrabajosPlanilla(idPlanilla)

  const asignadoPorProducto = new Map<number, Big>()
  for (const t of trabajos) {
    const pagoExtra = await obtenerCalculoPagoExtra(t.idTrabajador, t.idProductoProcesado)
    const pago = calcularPagoTrabajador(t.totalColaboradores, {
      precioTonelada: t.precioTonelada,
      toneladasProcesadas: t.toneladasProcesadas,
      extra: pagoExtra || '',
    })
    const acum = asignadoPorProducto.get(t.idProductoProcesado) ?? new Big(0)
    asignadoPorProducto.set(t.idProductoProcesado, acum.plus(pago))
  }

  let totalEsperado = new Big(0)
  let totalAsignado = new Big(0)
  const filas: FilaCuadre[] = productos.map(p => {
    const esperado = new Big(p.toneladas).mul(p.precioTonelada).round(2)
    const asignado = (asignadoPorProducto.get(p.id) ?? new Big(0)).round(2)
    totalEsperado = totalEsperado.plus(esperado)
    totalAsignado = totalAsignado.plus(asignado)

    return {
      idProductoProcesado: p.id,
      etiqueta: `${labelDiaSemana(p.diaSemana)} · ${p.nombreProducto}${p.etiqueta ? ` (${p.etiqueta})` : ''}`,
      esperado: esperado.toNumber(),
      asignado: asignado.toNumber(),
      diferencia: esperado.minus(asignado).toNumber(),
    }
  })

  return {
    filas,
    totalEsperado: totalEsperado.toNumber(),
    totalAsignado: totalAsignado.toNumber(),
    hayDescuadre: filas.some(f => f.diferencia !== 0),
  }
}

// Ajustes semanales (préstamos, castigos, suspensiones, etc.)
export function listarAjustesPorPlanilla(idPlanilla: number) {
  return db.select({
    id: ajusteSemanalTable.id,
    idTrabajador: ajusteSemanalTable.idTrabajador,
    nombreTrabajador: trabajadorTable.nombre,
    monto: ajusteSemanalTable.monto,
    motivo: ajusteSemanalTable.motivo,
    nota: ajusteSemanalTable.nota,
  }).from(ajusteSemanalTable)
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, ajusteSemanalTable.idTrabajador))
    .where(eq(ajusteSemanalTable.idPlanillaSemanal, idPlanilla))
    .orderBy(asc(trabajadorTable.nombre))
    .all()
}

// Mapa idTrabajador -> suma de ajustes de la planilla (para el reporte / pago neto)
export function obtenerAjustesPorTrabajadorPlanilla(idPlanilla: number) {
  const filas = db.select({
    idTrabajador: ajusteSemanalTable.idTrabajador,
    total: sql<number>`SUM(${ajusteSemanalTable.monto})`,
  }).from(ajusteSemanalTable)
    .where(eq(ajusteSemanalTable.idPlanillaSemanal, idPlanilla))
    .groupBy(ajusteSemanalTable.idTrabajador)
    .all()

  const mapa = new Map<number, number>()
  for (const f of filas) mapa.set(f.idTrabajador, f.total ?? 0)
  return mapa
}

export async function insertarAjuste(data: AjusteSemanalInsert) {
  const insert = await db.insert(ajusteSemanalTable).values(data)
  return insert.lastInsertRowId
}

export async function actualizarAjuste(id: number, data: { monto: number, motivo: string, nota?: string | null }) {
  await db.update(ajusteSemanalTable).set({
    monto: data.monto,
    motivo: data.motivo,
    nota: data.nota ?? null,
  }).where(eq(ajusteSemanalTable.id, id))
}

export async function eliminarAjuste(id: number) {
  await db.delete(ajusteSemanalTable).where(eq(ajusteSemanalTable.id, id))
}

// Otros
export async function listarTrabajosPlanilla(idPlanillaSemanal: number) {
  const data = await db.select({
    idTrabajadorProceso: trabajadorProcesoTable.id,
    idTrabajador: trabajadorProcesoTable.idTrabajador,
    nombreTrabajador: trabajadorTable.nombre,
    toneladasProcesadas: trabajadorProcesoTable.toneladasProcesadas,
    totalColaboradores: trabajadorProcesoTable.totalColaboradores,

    idProductoProcesado: productoProcesadoTable.id,
    diaSemana: sql<'J' | 'V' | 'S' | 'D' | 'L' | 'M' | 'X'>`${productoProcesadoTable.diaSemana}`,
    precioTonelada: productoProcesadoTable.precioTonelada,
    toneladasTotales: productoProcesadoTable.toneladas,
    nombreProducto: productoTable.nombre,
  }).from(trabajadorProcesoTable)
    .innerJoin(trabajadorTable, eq(trabajadorTable.id, trabajadorProcesoTable.idTrabajador))
    .innerJoin(productoProcesadoTable, eq(productoProcesadoTable.id, trabajadorProcesoTable.idProductoProcesado))
    .innerJoin(productoTable, eq(productoTable.id, productoProcesadoTable.idProducto))
    .where(eq(
      productoProcesadoTable.idPlanillaSemanal, idPlanillaSemanal
    )).orderBy(asc(trabajadorTable.nombre))
  return data
}