/**
 * Constantes compartidas del dominio financiero
 */

// Tipos de producto de crédito (usados en riesgos y cartera)
const TIPOS_PRODUCTO_CREDITO = [
  'CREDITO_PERSONAL',
  'TARJETA_CREDITO',
  'HIPOTECARIO',
  'CREDITO_AUTO',
  'CREDITO_PYME'
];

// Clasificaciones de cartera (en orden de severidad)
const CLASIFICACIONES_CARTERA = ['NORMAL', 'CPP', 'DEFICIENTE', 'DUDOSO', 'PERDIDA'];

// Estatus de cuentas
const ESTATUS_CUENTA = {
  ACTIVA: 'ACTIVA',
  INACTIVA: 'INACTIVA',
  CERRADA: 'CERRADA'
};

// Tipos de movimiento transaccional
const TIPOS_MOVIMIENTO = {
  CREDITO: 'CREDITO',
  DEBITO: 'DEBITO'
};

module.exports = {
  TIPOS_PRODUCTO_CREDITO,
  CLASIFICACIONES_CARTERA,
  ESTATUS_CUENTA,
  TIPOS_MOVIMIENTO
};
