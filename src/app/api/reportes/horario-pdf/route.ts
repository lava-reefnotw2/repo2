
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from '@sitelevelai/xlsx-js-style';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formato = searchParams.get('formato');
    const periodoId = searchParams.get('periodoId');
    const semestre = searchParams.get('semestre');
    const escuela = searchParams.get('escuela');
    const docenteId = searchParams.get('docenteId');
    const ciclo = searchParams.get('ciclo');
    const grupo = searchParams.get('grupo');
    const tipo = searchParams.get('tipo');
    const modo = searchParams.get('modo');
    const ambienteId = searchParams.get('ambienteId');

    const whereClause: any = {};
    if (periodoId) whereClause.periodoId = periodoId;
    if (semestre || escuela) {
      whereClause.periodo = {};
      if (semestre) whereClause.periodo.semestre = semestre;
      if (escuela) whereClause.periodo.escuela = escuela;
    }
    if (docenteId) whereClause.docenteId = docenteId;
    if (tipo) whereClause.tipo = tipo;
    if (ambienteId) whereClause.ambienteId = ambienteId;
    if (ciclo || grupo) {
      whereClause.grupo = {};
      if (grupo) whereClause.grupo.nombre = grupo;
      if (ciclo) {
        const cicloParsed = Number(ciclo);
        if (Number.isFinite(cicloParsed)) whereClause.grupo.curso = { ciclo: cicloParsed };
      }
    }

    const asignaciones = await prisma.asignacion.findMany({
      where: whereClause,
      include: {
        periodo: true,
        grupo: { include: { curso: true } },
        docente: { include: { usuario: true } },
        ambiente: true
      },
      orderBy: [
        { dia: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    if (formato === 'excel') {
      const wb = XLSX.utils.book_new();
      const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const HORAS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

      const docenteNombre = asignaciones[0]?.docente?.usuario?.nombre ?? 'Docente';
      const semestreNombre = asignaciones[0]?.periodo?.semestre ?? semestre ?? 'Semestre';
      const escuelaNombre = asignaciones[0]?.periodo?.escuela ?? escuela ?? 'Escuela';

      let tituloPrincipal = 'Horario Académico';
      if (modo === 'DOCENTE') tituloPrincipal = `Horario Docente: ${docenteNombre}`;
      else if (modo === 'CICLO') tituloPrincipal = `Horario Académico - Ciclo ${ciclo || ''} (Grupo ${grupo || 'Todos'})`;

      const grid: any[][] = [
        [tituloPrincipal, '', '', '', '', '', ''],
        [`Semestre: ${semestreNombre}`, `Escuela: ${escuelaNombre}`, '', '', '', '', ''],
        ['Hora', ...DIAS.map((d) => d.charAt(0) + d.slice(1).toLowerCase())]
      ];
      HORAS.forEach((h) => grid.push([h, '', '', '', '', '', '']));

      const wsHorario = XLSX.utils.aoa_to_sheet(grid);
      wsHorario['!cols'] = [{ wch: 10 }, ...Array.from({ length: 6 }, () => ({ wch: 28 }))];
      wsHorario['!merges'] = [];

      const rgb = (hex: string) => `FF${hex.replace('#', '')}`;
      const borderThin = {
        top: { style: 'thin', color: { rgb: rgb('E5E7EB') } },
        bottom: { style: 'thin', color: { rgb: rgb('E5E7EB') } },
        left: { style: 'thin', color: { rgb: rgb('E5E7EB') } },
        right: { style: 'thin', color: { rgb: rgb('E5E7EB') } }
      };

      const setCell = (r: number, c: number, v: any, s?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell: any = (wsHorario as any)[addr] ?? { t: typeof v === 'number' ? 'n' : 's', v };
        cell.v = v;
        if (s) cell.s = s;
        (wsHorario as any)[addr] = cell;
      };

      let headerColor = '1E3A8A';
      if (modo === 'CICLO') headerColor = '166534';

      for (let c = 0; c <= 6; c++) {
        setCell(0, c, c === 0 ? tituloPrincipal : '', {
          font: { bold: true, sz: 16, color: { rgb: rgb('FFFFFF') } },
          fill: { patternType: 'solid', fgColor: { rgb: rgb(headerColor) } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        });
      }
      (wsHorario['!merges'] as any[]).push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });

      for (let c = 0; c <= 6; c++) {
        setCell(1, c, grid[1][c] ?? '', {
          font: { bold: c <= 1, sz: 11, color: { rgb: rgb('111827') } },
          fill: { patternType: 'solid', fgColor: { rgb: rgb('F3F4F6') } },
          alignment: { horizontal: c <= 1 ? 'left' : 'center', vertical: 'center', wrapText: true },
          border: borderThin
        });
      }

      for (let c = 0; c <= 6; c++) {
        setCell(2, c, grid[2][c] ?? '', {
          font: { bold: true, sz: 11, color: { rgb: rgb('FFFFFF') } },
          fill: { patternType: 'solid', fgColor: { rgb: rgb('334155') } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: borderThin
        });
      }

      for (let r = 3; r < 3 + HORAS.length; r++) {
        setCell(r, 0, grid[r][0], {
          font: { bold: true, sz: 11, color: { rgb: rgb('0F172A') } },
          fill: { patternType: 'solid', fgColor: { rgb: rgb('E2E8F0') } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        for (let c = 1; c <= 6; c++) {
          setCell(r, c, '', {
            font: { sz: 10, color: { rgb: rgb('0F172A') } },
            alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
            border: borderThin
          });
        }
      }

      wsHorario['!rows'] = [
        { hpt: 28 },
        { hpt: 18 },
        { hpt: 20 },
        ...Array.from({ length: HORAS.length }, () => ({ hpt: 54 }))
      ];

      const horaToRowIndex = new Map<string, number>();
      HORAS.forEach((h, idx) => horaToRowIndex.set(h, idx + 3));
      const diaToColIndex = new Map<string, number>();
      DIAS.forEach((d, idx) => diaToColIndex.set(d, idx + 1));

      for (const asig of asignaciones) {
        const rowStart = horaToRowIndex.get(asig.horaInicio);
        const col = diaToColIndex.get(asig.dia);
        if (rowStart === undefined || col === undefined) continue;

        const cursoNombre = asig.grupo?.curso?.nombre ?? '';
        const grupoNombre = asig.grupo?.nombre ?? '';
        const ambienteNombre = asig.ambiente?.nombre ?? '';
        const docenteClase = asig.docente?.usuario?.nombre ?? '';
        const tipoClase = asig.tipo ?? '';

        let value = '';
        if (modo === 'DOCENTE') value = `${cursoNombre}\nG${grupoNombre}\n${ambienteNombre}\n${tipoClase}`;
        else if (modo === 'CICLO') value = `${cursoNombre}\n${docenteClase}\n${ambienteNombre}\n${tipoClase}`;
        else value = `${cursoNombre}\nG${grupoNombre}\n${ambienteNombre}\n${tipoClase}`;

        const cellAddr = XLSX.utils.encode_cell({ r: rowStart, c: col });
        const existing = (wsHorario as any)[cellAddr]?.v;
        const isAula = tipoClase === 'AULA';
        const fillColor = isAula ? 'DBEAFE' : 'DCFCE7';
        const borderColor = isAula ? '93C5FD' : '86EFAC';

        (wsHorario as any)[cellAddr] = {
          t: 's',
          v: existing ? `${existing}\n\n${value}` : value,
          s: {
            font: { bold: true, sz: 10, color: { rgb: rgb('0F172A') } },
            fill: { patternType: 'solid', fgColor: { rgb: rgb(fillColor) } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: rgb(borderColor) } },
              bottom: { style: 'thin', color: { rgb: rgb(borderColor) } },
              left: { style: 'thin', color: { rgb: rgb(borderColor) } },
              right: { style: 'thin', color: { rgb: rgb(borderColor) } }
            }
          }
        };
      }

      XLSX.utils.book_append_sheet(wb, wsHorario, 'Horario');

      const rowsDetalle = asignaciones.map((asig) => ({
        Semestre: asig.periodo?.semestre ?? '',
        Escuela: asig.periodo?.escuela ?? '',
        Día: asig.dia,
        'Hora Inicio': asig.horaInicio,
        'Hora Fin': asig.horaFin,
        Tipo: asig.tipo,
        Curso: asig.grupo?.curso?.nombre ?? '',
        'Código Curso': asig.grupo?.curso?.codigo ?? '',
        Ciclo: asig.grupo?.curso?.ciclo ?? '',
        Grupo: asig.grupo?.nombre ?? '',
        Docente: asig.docente?.usuario?.nombre ?? '',
        Ambiente: asig.ambiente?.nombre ?? ''
      }));

      const wsDetalle = XLSX.utils.json_to_sheet(rowsDetalle, { skipHeader: false });
      wsDetalle['!cols'] = [
        { wch: 10 },
        { wch: 28 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 14 },
        { wch: 38 },
        { wch: 12 },
        { wch: 6 },
        { wch: 8 },
        { wch: 28 },
        { wch: 20 }
      ];

      const headerRangeStr = wsDetalle['!ref'];
      if (headerRangeStr) {
        const headerRange = XLSX.utils.decode_range(headerRangeStr);
        for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r: 0, c });
          if (!(wsDetalle as any)[addr]) continue;
          (wsDetalle as any)[addr].s = {
            font: { bold: true, sz: 11, color: { rgb: rgb('FFFFFF') } },
            fill: { patternType: 'solid', fgColor: { rgb: rgb('1E3A8A') } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: borderThin
          };
        }
      }

      wsDetalle['!rows'] = [{ hpt: 20 }];
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

      const safe = (s: string) => s ? s.replace(/[^\\w.-]+/g, '_').slice(0, 80) : 'reporte';
      let fileNameSuffix = safe(asignaciones[0]?.docente?.usuario?.nombre ?? '');
      if (modo === 'CICLO') fileNameSuffix = `Ciclo_${ciclo}_G${grupo}`;
      const fileName = `Horario_${fileNameSuffix}_${safe(asignaciones[0]?.periodo?.semestre ?? semestre ?? '')}.xlsx`;

      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new Response(excelBuffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }

    // --- PDF Generation ---
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const leftMargin = 10;
    const rightMargin = 10;
    let yPos = 15;

    // --- HEADER ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('Horario Académico - Listado', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Detalle de asignaciones', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 10;

    // --- SUMMARY KPIs ---
    const total = asignaciones.length;
    const totalAula = asignaciones.filter((a) => a.tipo === 'AULA').length;
    const totalLab = asignaciones.filter((a) => a.tipo === 'LABORATORIO').length;
    const kpiWidth = 58;
    const gapKpi = 8;

    const drawKpi = (x: number, label: string, value: string, colorRgb: [number, number, number]) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, yPos, kpiWidth, 15, 2, 2, 'FD');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(label, x + kpiWidth / 2, yPos + 6, { align: 'center' });
      
      doc.setFontSize(13);
      doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
      doc.text(value, x + kpiWidth / 2, yPos + 12, { align: 'center' });
    };

    drawKpi(leftMargin, 'Total', String(total), [31, 41, 55]);
    drawKpi(leftMargin + kpiWidth + gapKpi, 'Aula', String(totalAula), [59, 130, 246]);
    drawKpi(leftMargin + 2 * (kpiWidth + gapKpi), 'Lab', String(totalLab), [34, 197, 94]);
    yPos += 22;

    // --- TABLE ---
    const tableWidth = pageWidth - leftMargin - rightMargin;
    const colWidths = [22, 20, 52, 18, 48, 28];
    const headers = ['Día', 'Hora', 'Curso', 'Tipo', 'Docente', 'Ambiente'];
    const rowHeight = 7;

    doc.setFillColor(30, 58, 138);
    doc.rect(leftMargin, yPos, tableWidth, rowHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');

    let xPos = leftMargin;
    headers.forEach((header, idx) => {
      doc.text(header, xPos + colWidths[idx] / 2, yPos + 5, { align: 'center' });
      if (idx < headers.length - 1) {
        doc.setDrawColor(79, 107, 185);
        doc.line(xPos + colWidths[idx], yPos, xPos + colWidths[idx], yPos + rowHeight);
      }
      xPos += colWidths[idx];
    });
    yPos += rowHeight;

    // Helper function to truncate text with ellipsis
    const truncateText = (text: string, maxWidth: number, fontSize: number = 8) => {
      doc.setFontSize(fontSize);
      let truncated = text;
      while (doc.getTextWidth(truncated) > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      if (truncated.length < text.length) {
        while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
      }
      return truncated;
    };

    asignaciones.forEach((asig, idx) => {
      if (yPos + rowHeight > 280) {
        doc.addPage();
        yPos = 15;
        // Redraw header on new page
        doc.setFillColor(30, 58, 138);
        doc.rect(leftMargin, yPos, tableWidth, rowHeight, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        
        let xPosNew = leftMargin;
        headers.forEach((header, idx) => {
          doc.text(header, xPosNew + colWidths[idx] / 2, yPos + 5, { align: 'center' });
          if (idx < headers.length - 1) {
            doc.setDrawColor(79, 107, 185);
            doc.line(xPosNew + colWidths[idx], yPos, xPosNew + colWidths[idx], yPos + rowHeight);
          }
          xPosNew += colWidths[idx];
        });
        yPos += rowHeight;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(leftMargin, yPos, tableWidth, rowHeight, 'F');
      }

      xPos = leftMargin;

      // --- Día ---
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(asig.dia, xPos + colWidths[0] / 2, yPos + 4.8, { align: 'center' });
      
      xPos += colWidths[0];
      doc.setDrawColor(229, 231, 235);
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // --- Hora ---
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`${asig.horaInicio}-${asig.horaFin}`, xPos + colWidths[1] / 2, yPos + 4.8, { align: 'center' });
      
      xPos += colWidths[1];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // --- Curso ---
      const curso = asig.grupo?.curso?.nombre ?? '—';
      const grupo = asig.grupo?.nombre ?? '';
      const cursoGrupo = grupo ? `${curso} (${grupo})` : curso;
      doc.setFontSize(7);
      doc.text(truncateText(cursoGrupo, colWidths[2] - 4), xPos + 2, yPos + 4.8);
      
      xPos += colWidths[2];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // --- Tipo ---
      const isAula = asig.tipo === 'AULA';
      doc.setFillColor(isAula ? 219 : 220, isAula ? 234 : 252, isAula ? 254 : 231);
      doc.setTextColor(isAula ? 30 : 22, isAula ? 64 : 101, isAula ? 175 : 52);
      doc.roundedRect(xPos + 2, yPos + 1, colWidths[3] - 4, 5, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(asig.tipo === 'AULA' ? 'AULA' : 'LAB', xPos + colWidths[3] / 2, yPos + 4.5, { align: 'center' });
      
      xPos += colWidths[3];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // --- Docente ---
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(truncateText(asig.docente?.usuario?.nombre ?? '—', colWidths[4] - 4), xPos + 2, yPos + 4.8);
      
      xPos += colWidths[4];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);

      // --- Ambiente ---
      doc.text(truncateText(asig.ambiente?.nombre ?? '—', colWidths[5] - 4), xPos + 2, yPos + 4.8);

      yPos += rowHeight;
    });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('Sistema de Gestión de Horarios - UNT © 2026', pageWidth / 2, 290, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-PE')}`, pageWidth / 2, 295, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="horario.pdf"'
      }
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json({ error: 'No se pudo generar el reporte' }, { status: 500 });
  }
}
