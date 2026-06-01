
import { NextResponse } from 'next/server';
import { getReporteGestionStats } from '@/services/dashboard.service';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getReporteGestionStats();
    const { resumen, cargaDocente } = stats;

    // Initialize jsPDF with portrait A4
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const leftMargin = 15;
    let yPos = 20;

    // --- HEADER ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('Reporte de Gestión y Cumplimiento', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Estado actual de la carga docente y asignaciones', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Blue line separator
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 15;

    // --- SUMMARY CARDS ---
    const cardWidth = 43;
    const cardHeight = 25;
    const gap = 7;

    // Helper to draw a card
    const drawCard = (x: number, title: string, value: string, topColor: [number, number, number]) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'FD');

      doc.setFillColor(topColor[0], topColor[1], topColor[2]);
      doc.rect(x, yPos, cardWidth, 2, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(title, x + cardWidth / 2, yPos + 10, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text(value, x + cardWidth / 2, yPos + 20, { align: 'center' });
    };

    drawCard(leftMargin, 'Total Asignaciones', String(resumen.totalAsignaciones), [37, 99, 235]);
    drawCard(leftMargin + cardWidth + gap, 'Completos', String(resumen.completas), [22, 163, 74]);
    drawCard(leftMargin + 2 * (cardWidth + gap), 'Sin Docente', String(resumen.sinDocente), [202, 138, 4]);
    drawCard(leftMargin + 3 * (cardWidth + gap), 'Sin Aula', String(resumen.sinAula), [220, 38, 38]);
    yPos += cardHeight + 15;

    // --- TABLE TITLE ---
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Detalle de Cumplimiento de Carga Docente', leftMargin, yPos);
    yPos += 8;

    // --- TABLE ---
    const tableWidth = pageWidth - (2 * leftMargin);
    const colWidths = [55, 30, 35, 30, 30];
    const headers = ['Docente', 'Categoría', 'Condición', 'Horas', 'Estado'];
    const rowHeight = 8;

    // Table header
    doc.setFillColor(243, 244, 246);
    doc.rect(leftMargin, yPos, tableWidth, rowHeight, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    
    let xPos = leftMargin;
    headers.forEach((header, idx) => {
      doc.text(header, xPos + colWidths[idx] / 2, yPos + 5.5, { align: 'center' });
      if (idx < headers.length - 1) {
        doc.setDrawColor(209, 213, 219);
        doc.line(xPos + colWidths[idx], yPos, xPos + colWidths[idx], yPos + rowHeight);
      }
      xPos += colWidths[idx];
    });
    
    yPos += rowHeight;

    // Table rows
    cargaDocente.forEach((docente: any, idx: number) => {
      // Check if we need a new page
      if (yPos + rowHeight > 275) {
        doc.addPage();
        yPos = 20;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(leftMargin, yPos, tableWidth, rowHeight, 'F');
      }

      xPos = leftMargin;

      // Docente
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(docente.nombre.length > 20 ? 8 : 9);
      doc.setTextColor(31, 41, 55);
      doc.text(docente.nombre, xPos + 2, yPos + 5.5);
      
      xPos += colWidths[0];
      doc.setDrawColor(229, 231, 235);
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // Categoría
      doc.setFont('helvetica', 'normal');
      doc.text(docente.categoria, xPos + 2, yPos + 5.5);
      
      xPos += colWidths[1];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // Condición
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(docente.tipo === 'NOMBRADO' ? 219 : 243, docente.tipo === 'NOMBRADO' ? 234 : 232, docente.tipo === 'NOMBRADO' ? 254 : 255);
      doc.setTextColor(docente.tipo === 'NOMBRADO' ? 30 : 107, docente.tipo === 'NOMBRADO' ? 64 : 33, docente.tipo === 'NOMBRADO' ? 175 : 168);
      doc.roundedRect(xPos + 5, yPos + 1.5, colWidths[2] - 10, 5, 2, 2, 'F');
      doc.text(docente.tipo, xPos + colWidths[2] / 2, yPos + 5, { align: 'center' });

      xPos += colWidths[2];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // Horas
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(`${docente.horasAsignadas} hrs`, xPos + colWidths[3] / 2, yPos + 5.5, { align: 'center' });

      xPos += colWidths[3];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // Estado
      let estadoText = 'Adecuada';
      let estadoRgb: [number, number, number] = [22, 163, 74];
      if (docente.estado === 'SOBRECARGA') {
        estadoText = 'Excede límite';
        estadoRgb = [220, 38, 38];
      } else if (docente.estado === 'SIN_CARGA') {
        estadoText = '0 Horas';
        estadoRgb = [156, 163, 175];
      }
      doc.setTextColor(estadoRgb[0], estadoRgb[1], estadoRgb[2]);
      doc.text(estadoText, xPos + colWidths[4] / 2, yPos + 5.5, { align: 'center' });

      yPos += rowHeight;
    });

    // --- FOOTER ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('Sistema de Gestión de Horarios - UNT © 2026', pageWidth / 2, 285, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-PE')}`, pageWidth / 2, 292, { align: 'center' });

    // Return PDF as inline response
    const pdfBuffer = doc.output('arraybuffer');
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="reporte-gestion.pdf"'
      }
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json({ error: 'No se pudo generar el reporte' }, { status: 500 });
  }
}
