import { NextResponse } from 'next/server';
import { getReporteGestionStats } from '@/services/dashboard.service';

// Dynamic import function to avoid webpack bundling issues
async function getPuppeteerAndChromium() {
  const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL === '1';
  if (isVercel) {
    // @ts-ignore
    const chromium = await import(/* webpackIgnore: true */ '@sparticuz/chromium');
    // @ts-ignore
    const puppeteer = await import(/* webpackIgnore: true */ 'puppeteer-core');
    return { isVercel, puppeteer: puppeteer.default || puppeteer, chromium };
  } else {
    // @ts-ignore
    const puppeteer = await import(/* webpackIgnore: true */ 'puppeteer');
    return { isVercel, puppeteer: puppeteer.default || puppeteer, chromium: null };
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Obtener la data del reporte de gestión desde el servicio
    const stats = await getReporteGestionStats();
    const { resumen, cargaDocente } = stats;

    // 2. Construir las filas de la tabla de docentes
    let rowsHtml = '';
    if (cargaDocente.length === 0) {
      rowsHtml = `<tr><td colSpan="5" style="text-align: center; padding: 20px;">No hay docentes registrados.</td></tr>`;
    } else {
      cargaDocente.forEach((docente: any) => {
        let estadoLabel = 'Adecuada';
        let estadoColor = '#16a34a'; // verde
        if (docente.estado === 'SOBRECARGA') {
          estadoLabel = 'Excede límite';
          estadoColor = '#dc2626'; // rojo
        } else if (docente.estado === 'SIN_CARGA') {
          estadoLabel = '0 Horas';
          estadoColor = '#9ca3af'; // gris
        }

        const tipoBg = docente.tipo === 'NOMBRADO' ? '#dbeafe' : '#f3e8ff';
        const tipoColor = docente.tipo === 'NOMBRADO' ? '#1e40af' : '#6b21a8';

        rowsHtml += `
          <tr>
            <td style="font-weight: 600;">${docente.nombre}</td>
            <td>${docente.categoria}</td>
            <td>
              <span style="background-color: ${tipoBg}; color: ${tipoColor}; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${docente.tipo}
              </span>
            </td>
            <td style="text-align: center; font-weight: bold;">${docente.horasAsignadas} hrs</td>
            <td style="color: ${estadoColor}; font-weight: bold; text-align: center;">${estadoLabel}</td>
          </tr>
        `;
      });
    }

    // 3. Launch Puppeteer - use @sparticuz/chromium on Vercel, regular puppeteer locally
    const { isVercel, puppeteer, chromium } = await getPuppeteerAndChromium();
    let browser;
    if (isVercel) {
      // @ts-ignore: @sparticuz/chromium API differs by version
      const executablePath = await chromium.path;
      // @ts-ignore: @sparticuz/chromium API differs by version
      const chromiumArgs = chromium.args;
      browser = await puppeteer.launch({
        args: chromiumArgs,
        executablePath,
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();

    // 4. Plantilla HTML Profesional para el Reporte
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1f2937; margin: 0; padding: 20px; background-color: #fff; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; }
            .title { color: #1e3a8a; font-size: 24px; font-weight: 700; text-transform: uppercase; margin: 0 0 5px 0; }
            .subtitle { color: #6b7280; font-size: 14px; margin: 0; }
            
            /* Resumen Ejecutivo Cards */
            .summary-container { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
            .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; text-align: center; border-top: 4px solid #2563eb; }
            .card.success { border-top-color: #16a34a; }
            .card.warning { border-top-color: #eab308; }
            .card.danger { border-top-color: #dc2626; }
            .card-title { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 8px; }
            .card-value { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0; }
            
            /* Tabla */
            .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px; }
            .table th { background-color: #f3f4f6; color: #4b5563; padding: 10px; text-align: left; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #d1d5db; }
            .table td { border-bottom: 1px solid #e5e7eb; padding: 10px; vertical-align: middle; }
            .table tr:nth-child(even) { background-color: #fcfcfc; }
            
            .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Reporte de Gestión y Cumplimiento</h1>
            <p class="subtitle">Estado actual de la carga docente y asignaciones</p>
          </div>
          
          <h2 class="section-title">Resumen Ejecutivo</h2>
          <div class="summary-container">
            <div class="card">
              <div class="card-title">Total Asignaciones</div>
              <div class="card-value">${resumen.totalAsignaciones}</div>
            </div>
            <div class="card success">
              <div class="card-title">Completas</div>
              <div class="card-value" style="color: #16a34a;">${resumen.completas}</div>
            </div>
            <div class="card warning">
              <div class="card-title">Sin Docente</div>
              <div class="card-value" style="color: #ca8a04;">${resumen.sinDocente}</div>
            </div>
            <div class="card danger">
              <div class="card-title">Sin Aula</div>
              <div class="card-value" style="color: #dc2626;">${resumen.sinAula}</div>
            </div>
          </div>

          <h2 class="section-title">Detalle de Cumplimiento de Carga Docente</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Categoría</th>
                <th>Condición</th>
                <th style="text-align: center;">Horas Asignadas</th>
                <th style="text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Sistema de Gestión de Horarios - UNT &copy; ${new Date().getFullYear()} <br/>
            Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-family: Inter, Segoe UI, Arial; font-size: 9px; color: #64748b; padding: 6px 14mm;">
          <span>Reporte de Gestión y Cumplimiento</span>
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
        'Content-Disposition': 'inline; filename="Reporte_Gestion_UNT.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generando PDF de gestión:", error);
    return NextResponse.json({ error: "No se pudo generar el reporte PDF" }, { status: 500 });
  }
}
