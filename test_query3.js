const kpiService = require('./src/services/kpi.service');

async function main() {
  try {
    const res1 = await kpiService.getResumenDashboard({});
    console.log('Unfiltered dashboard resumen:', res1);

    const res2 = await kpiService.getResumenDashboard({ region: 'Centro', producto: 'CUENTA_AHORRO' });
    console.log('Filtered (Centro, CUENTA_AHORRO) dashboard resumen:', res2);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
