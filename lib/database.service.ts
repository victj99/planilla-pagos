import Big from 'big.js'
import { and, asc, desc, eq, like, sql } from 'drizzle-orm'
import { db } from './database'
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
  await db.delete(distribucionDescuentoTable).where(
    eq(distribucionDescuentoTable.idTrabajadorProceso, id)
  )

  await db.delete(trabajadorProcesoTable).where(
    eq(trabajadorProcesoTable.id, id)
  )
}

// Trabajador
export function obtenerTrabajadoresPorNombre(value: string) {
  return db.select().from(trabajadorTable).where(like(trabajadorTable.nombre, value)).all()
}

export function obtenerTrabajador(id: number) {
  const data = db.select().from(trabajadorTable).where(eq(trabajadorTable.id, id)).limit(1).all()

  return data[0]
}

export async function insertarTrabajador(data: TrabajadorInsert) {
  const insert = await db.insert(trabajadorTable).values(data)
  return insert.lastInsertRowId
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