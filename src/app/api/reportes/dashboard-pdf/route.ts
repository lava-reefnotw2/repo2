
import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getDashboardStats();

    // Prepare data for charts
    const ocupacionLabels = stats.dataOcupacionAulas.map((d: any) => d.nombre);
    const ocupacionData = stats.dataOcupacionAulas.map((d: any) => d.horas);

    const cargaLabels = stats.dataCargaDocente.map((d: any) => d.rango);
    const cargaData = stats.dataCargaDocente.map((d: any) => d.cantidad);

    const distribucionLabels = stats.dataDistribucion.map((d: any) => d.name);
    const distribucionData = stats.dataDistribucion.map((d: any) => d.cantidad);

    // HTML Content with Chart.js
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              .no-print { display: none !important; }
            }
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1f2937; 
              margin: 0; 
              padding: 20px; 
              background-color: #fff; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .title { 
              color: #1e3a8a; 
              font-size: 20px; 
              font-weight: 700; 
              text-transform: uppercase; 
              margin: 0 0 3px 0; 
            }
            .subtitle { 
              color: #6b7280; 
              font-size: 12px; 
              margin: 0; 
            }
            
            .summary-container { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 15px; 
              gap: 10px; 
            }
            .card { 
              flex: 1; 
              border: 1px solid #e5e7eb; 
              border-radius: 6px; 
              padding: 10px; 
              background: #f9fafb; 
              text-align: center; 
              border-top: 4px solid #2563eb; 
            }
            .card.green { border-top-color: #10b981; }
            .card.purple { border-top-color: #8b5cf6; }
            .card-title { 
              font-size: 10px; 
              text-transform: uppercase; 
              color: #6b7280; 
              font-weight: 600; 
              margin-bottom: 5px; 
            }
            .card-value { 
              font-size: 20px; 
              font-weight: 700; 
              color: #1f2937; 
              margin: 0; 
            }
            
            .charts-row {
              display: flex;
              gap: 15px;
              margin-bottom: 15px;
              height: 200px;
            }
            .chart-box {
              flex: 1;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .chart-title {
              font-size: 12px;
              font-weight: 600;
              text-align: center;
              margin-bottom: 8px;
              color: #374151;
            }
            canvas {
              max-width: 100%;
              max-height: 100%;
            }

            .chart-box-full {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              background: #fff;
              margin-bottom: 15px;
              display: flex;
              flex-direction: column;
              align-items: center;
              height: 180px;
            }
            
            .footer { 
              text-align: center; 
              margin-top: 10px; 
              font-size: 9px; 
              color: #9ca3af; 
              border-top: 1px solid #e5e7eb; 
              padding-top: 10px; 
            }

            .print-btn {
              position: fixed; bottom: 20px; right: 20px;
              background-color: #2563eb; color: white;
              padding: 10px 20px; border-radius: 8px;
              font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px;
              cursor: pointer; border: none;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); z-index: 9999;
            }
            .print-btn:hover { background-color: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Reporte Estadístico de Horarios</h1>
            <p class="subtitle">Panel de Control General</p>
          </div>
          
          <div class="summary-container">
            <div class="card">
              <div class="card-title">Docentes Registrados</div>
              <div class="card-value">${stats.totalDocentes}</div>
            </div>
            <div class="card green">
              <div class="card-title">Cursos Activos</div>
              <div class="card-value">${stats.totalCursos}</div>
            </div>
            <div class="card purple">
              <div class="card-title">Aulas Disponibles</div>
              <div class="card-value">${stats.totalAulas}</div>
            </div>
          </div>

          <div class="charts-row">
            <div class="chart-box">
              <div class="chart-title">Ocupación de Aulas (Top 10)</div>
              <canvas id="chartOcupacion"></canvas>
            </div>
            <div class="chart-box">
              <div class="chart-title">Distribución de Carga Docente</div>
              <canvas id="chartCarga"></canvas>
            </div>
          </div>

          <div class="chart-box-full">
            <div class="chart-title">Distribución por Categoría</div>
            <canvas id="chartDistribucion"></canvas>
          </div>

          <div class="footer">
            Sistema de Gestión de Horarios - UNT © ${new Date().getFullYear()} <br/>
            Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
          </div>

          <button class="print-btn no-print" onclick="window.print()">
            <svg style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir / Guardar PDF
          </button>

          <script>
            // Chart 1: Ocupación de Aulas
            new Chart(document.getElementById('chartOcupacion'), {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(ocupacionLabels)},
                datasets: [{
                  label: 'Horas Semanales',
                  data: ${JSON.stringify(ocupacionData)},
                  backgroundColor: '#8b5cf6',
                  borderRadius: 4
                }]
              },
              options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, grid: { display: true } }, y: { grid: { display: false } } }
              }
            });

            // Chart 2: Carga Docente
            new Chart(document.getElementById('chartCarga'), {
              type: 'doughnut',
              data: {
                labels: ${JSON.stringify(cargaLabels)},
                datasets: [{
                  data: ${JSON.stringify(cargaData)},
                  backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
                  borderWidth: 1
                }]
              },
              options: {
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
              }
            });

            // Chart 3: Distribución
            new Chart(document.getElementById('chartDistribucion'), {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(distribucionLabels)},
                datasets: [{
                  label: 'Cantidad de Docentes',
                  data: ${JSON.stringify(distribucionData)},
                  backgroundColor: '#3b82f6',
                  borderRadius: 4
                }]
              },
              options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }
            });
          </script>
        </body>
      </html>
    `;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error("Error generando Vista PDF del dashboard:", error);
    return NextResponse.json({ error: "No se pudo generar el reporte PDF del dashboard" }, { status: 500 });
  }
}
