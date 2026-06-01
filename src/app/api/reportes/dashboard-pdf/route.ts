import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/services/dashboard.service';

// Dynamic import function to avoid webpack bundling issues
async function getPuppeteerAndChromium() {
  const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL === '1';
  if (isVercel) {
    // @ts-ignore
    const chromiumModule = await import(/* webpackIgnore: true */ '@sparticuz/chromium');
    // @ts-ignore
    const puppeteer = await import(/* webpackIgnore: true */ 'puppeteer-core');
    return { isVercel, puppeteer: puppeteer.default || puppeteer, chromium: chromiumModule.default || chromiumModule };
  } else {
    // @ts-ignore
    const puppeteer = await import(/* webpackIgnore: true */ 'puppeteer');
    return { isVercel, puppeteer: puppeteer.default || puppeteer, chromium: null };
  }
}

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

    // Launch Puppeteer
    const { isVercel, puppeteer, chromium } = await getPuppeteerAndChromium();
    let browser;
    const viewport = {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    };
    if (isVercel) {
      const executablePath = await chromium.executablePath();
      const args = await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" });
      browser = await puppeteer.launch({
        args,
        executablePath,
        headless: "shell",
        defaultViewport: viewport
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: viewport
      });
    }

    const page = await browser.newPage();

    // HTML Content with Chart.js
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
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
            
            .charts-row {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
              height: 350px;
            }
            .chart-box {
              flex: 1;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 15px;
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .chart-title {
              font-size: 14px;
              font-weight: 600;
              text-align: center;
              margin-bottom: 10px;
              color: #374151;
            }
            canvas {
              max-width: 100%;
              max-height: 100%;
            }

            .chart-box-full {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 15px;
              background: #fff;
              margin-bottom: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
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
              <canvas id="chartOcupacion"></canvas>
            </div>
            <div class="chart-box">
              <div class="chart-title">Distribución de Carga Docente</div>
              <canvas id="chartCarga"></canvas>
            </div>
          </div>

          <div class="chart-box-full">
            <div class="chart-title">Distribución de Docentes por Categoría</div>
            <canvas id="chartDistribucion"></canvas>
          </div>

          <div class="footer">
            Sistema de Gestión de Horarios - UNT &copy; ${new Date().getFullYear()} <br/>
            Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
          </div>

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

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    // Wait for charts to render
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-family: Inter, Segoe UI, Arial; font-size: 9px; color: #64748b; padding: 6px 14mm;">
          <span>Reporte Estadístico de Horarios</span>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-family: Inter, Segoe UI, Arial; font-size: 9px; color: #64748b; padding: 6px 14mm; display: flex; justify-content: space-between;">
          <span>Generado el ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
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
