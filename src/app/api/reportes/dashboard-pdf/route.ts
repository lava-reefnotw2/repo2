import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getDashboardStats } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getDashboardStats();

    // 1. Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 2. Prepare Data for Chart.js
    const ocupacionLabels = stats.dataOcupacionAulas.map((d: any) => d.nombre);
    const ocupacionData = stats.dataOcupacionAulas.map((d: any) => d.horas);

    const cargaLabels = stats.dataCargaDocente.map((d: any) => d.rango);
    const cargaData = stats.dataCargaDocente.map((d: any) => d.cantidad);

    const distribucionLabels = stats.dataDistribucion.map((d: any) => d.name);
    const distribucionData = stats.dataDistribucion.map((d: any) => d.cantidad);

    // 3. HTML Content with Chart.js
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1f2937; 
              margin: 0; 
              padding: 20px 40px; 
              background-color: #fff; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 15px; 
              margin-bottom: 25px; 
            }
            .title { 
              color: #1e3a8a; 
              font-size: 24px; 
              font-weight: 700; 
              text-transform: uppercase; 
              margin: 0 0 5px 0; 
            }
            .subtitle { 
              color: #6b7280; 
              font-size: 14px; 
              margin: 0; 
            }
            
            /* Resumen Ejecutivo Cards */
            .summary-container { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px; 
              gap: 15px; 
            }
            .card { 
              flex: 1; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 15px; 
              background: #f9fafb; 
              text-align: center; 
              border-top: 4px solid #2563eb; 
            }
            .card.green { border-top-color: #10b981; }
            .card.purple { border-top-color: #8b5cf6; }
            .card-title { 
              font-size: 11px; 
              text-transform: uppercase; 
              color: #6b7280; 
              font-weight: 600; 
              margin-bottom: 8px; 
            }
            .card-value { 
              font-size: 24px; 
              font-weight: 700; 
              color: #1f2937; 
              margin: 0; 
            }
            
            /* Grid para Gráficos 1 y 2 */
            .charts-row {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
              height: 280px;
            }
            .chart-box {
              flex: 1;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 15px;
              background: #fff;
              display: flex;
              flex-direction: column;
            }
            .chart-title {
              font-size: 14px;
              font-weight: 600;
              text-align: center;
              margin-bottom: 10px;
              color: #374151;
            }
            .canvas-container {
              flex: 1;
              position: relative;
              width: 100%;
              height: 100%;
            }

            /* Gráfico Principal 3 */
            .chart-box-full {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 15px;
              background: #fff;
              height: 320px;
              margin-bottom: 20px;
              display: flex;
              flex-direction: column;
            }
            
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 10px; 
              color: #9ca3af; 
              border-top: 1px solid #e5e7eb; 
              padding-top: 15px; 
            }
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
              <div class="canvas-container">
                <canvas id="chartOcupacion"></canvas>
              </div>
            </div>
            <div class="chart-box">
              <div class="chart-title">Distribución de Carga Docente</div>
              <div class="canvas-container">
                <canvas id="chartCarga"></canvas>
              </div>
            </div>
          </div>

          <div class="chart-box-full">
            <div class="chart-title">Distribución de Docentes por Categoría</div>
            <div class="canvas-container">
              <canvas id="chartDistribucion"></canvas>
            </div>
          </div>

          <div class="footer">
            Sistema de Gestión de Horarios - UNT &copy; ${new Date().getFullYear()} <br/>
            Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
          </div>

          <script>
            // Configuración Global para impresión estática
            Chart.defaults.animation = false;
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
            
            // 1. Gráfico de Ocupación (Barra Horizontal)
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
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: { beginAtZero: true, grid: { display: true } },
                  y: { grid: { display: false } }
                }
              }
            });

            // 2. Gráfico de Carga Docente (Dona)
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
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                }
              }
            });

            // 3. Gráfico de Distribución por Categoría (Barras Verticales)
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
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }
            });
          </script>
        </body>
      </html>
    `;

    // 4. Render HTML and wait for network (to load Chart.js)
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait a little bit just in case ChartJS needs a tick to draw on canvas
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    // 5. Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' } // handled by body padding
    });

    await browser.close();

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Reporte_Dashboard_Inicio.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generando PDF del dashboard:", error);
    return NextResponse.json({ error: "No se pudo generar el reporte PDF del dashboard" }, { status: 500 });
  }
}
