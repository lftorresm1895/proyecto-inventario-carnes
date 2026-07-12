// Genera el reporte imprimible de una descarga de canales.
// `ventana` debe abrirse con window.open('', '_blank') DENTRO del click
// (antes de cualquier await) para que el navegador no lo bloquee.
export function escribirReporteEntrada(canales, ventana, fechaLabel = null) {
  const lista = canales.map((c) => ({
    ...c,
    peso_lbs: parseFloat(c.peso_lbs) || 0,
  }));

  const fecha = new Date();
  const titulo = fechaLabel || fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const pesoSum = lista.reduce((s, c) => s + c.peso_lbs, 0);

  const filas = lista
    .map((c, i) => {
      const marcas = [
        !c.graso && !c.papada ? 'Light' : '',
        c.graso ? 'Grasa' : '',
        c.papada ? 'Papada' : '',
        c.golpeado ? 'Golpeado' : '',
      ]
        .filter(Boolean)
        .join(', ');
      return `<tr>
        <td>${i + 1}</td>
        <td class="num">${c.peso_lbs.toFixed(2)}</td>
        <td>${marcas}</td>
        <td>${c.ubicacion_riel > 0 ? 'Riel ' + c.ubicacion_riel : '—'}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Reporte de Descarga - ${titulo}</title>
<style>
  body { font-family: Arial, sans-serif; color: #222; margin: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #666; margin-bottom: 16px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #999; padding: 5px 8px; text-align: left; }
  th { background: #eee; }
  td.num { text-align: right; }
  .totales { margin-top: 16px; font-size: 14px; }
  .totales div { margin-bottom: 4px; }
  .peso-total { font-size: 18px; font-weight: bold; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <h1>🥩 Reporte de Descarga de Canales</h1>
  <div class="sub">${titulo}${fechaLabel ? '' : ' · ' + fecha.toLocaleTimeString()}</div>

  <table>
    <thead>
      <tr><th>#</th><th>Peso (lbs)</th><th>Características</th><th>Riel</th></tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <div class="totales">
    <div class="peso-total">PESO TOTAL: ${pesoSum.toFixed(2)} lbs</div>
    <div>Total canales: ${lista.length}</div>
    <div>Peso promedio: ${lista.length > 0 ? (pesoSum / lista.length).toFixed(2) : '0'} lbs</div>
    <div>Light (sin grasa/papada): ${lista.filter((c) => !c.graso && !c.papada).length}</div>
    <div>Con grasa: ${lista.filter((c) => c.graso).length}</div>
    <div>Con papada: ${lista.filter((c) => c.papada).length}</div>
    <div>Golpeados: ${lista.filter((c) => c.golpeado).length}</div>
  </div>

  <p class="no-print" style="margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 20px;font-size:15px;">🖨 Imprimir / Guardar como PDF</button>
  </p>
</body>
</html>`;

  ventana.document.write(html);
  ventana.document.close();
}
