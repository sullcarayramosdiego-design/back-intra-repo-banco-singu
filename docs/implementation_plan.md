# Transaction Activity KPIs Dashboard Plan

We will add a row of high-impact, premium KPI cards at the top of the "Actividad Transaccional" page in the frontend dashboard. These KPIs will calculate and display aggregate transaction insights dynamically based on the active filters (period and channel).

## Proposed Changes

---

### Frontend Components

#### [NEW] [transacciones-kpis.tsx](file:///d:/DD/intranet-confinza/frontend-intranet-financiera-confianza/src/modules/transacciones/components/transacciones-kpis.tsx)
- Create a client component containing 4-5 premium KPI cards.
- The KPIs will show:
  1. **Total de Operaciones**: Total count of transactions.
  2. **Total de Abonos (Ingresos)**: Total value of DEPOSITO, PAGO, and TRANSFERENCIA.
  3. **Total de Cargos (Egresos)**: Total absolute value of RETIRO, CARGO, and COMISION.
  4. **Balance Neto**: The net sum of inflows vs. outflows.
  5. **Monto Promedio**: The average absolute transaction size.
- Include icons from `lucide-react` (e.g., `ArrowUpRight`, `ArrowDownRight`, `Activity`, `Wallet`, `Scale`).
- Apply rich styling (modern glassmorphism, subtle borders, curated HSL/OKLCH color accents for positive/negative balances).

#### [MODIFY] [index.ts](file:///d:/DD/intranet-confinza/frontend-intranet-financiera-confianza/src/modules/transacciones/types/index.ts)
- Update the `ActividadTransaccionalItem` interface to include the `tipo_movimiento` field (which is returned by the backend but was missing from the type definition):
  ```typescript
  export interface ActividadTransaccionalItem {
    periodo: string;
    canal: string;
    tipo_movimiento?: string; // Added field
    cantidad_transacciones: number;
    monto_total: number;
  }
  ```

#### [MODIFY] [page.tsx](file:///d:/DD/intranet-confinza/frontend-intranet-financiera-confianza/src/app/(dashboard)/transacciones/page.tsx)
- Import and render the new `TransaccionesKpis` component at the top of the main dashboard content panel (above the charts).

---

## Verification Plan

### Manual Verification
1. Boot the application using `npm run dev`.
2. Navigate to the "Actividad Transaccional" page.
3. Verify that the KPI cards load correctly and show accurate values.
4. Apply filters (e.g., period, channel) and verify that the KPI values update dynamically.
