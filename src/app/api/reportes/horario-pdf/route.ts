import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from '@sitelevelai/xlsx-js-style';

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

    // 1. Fetch real data from the database
    const asignaciones = await prisma.asignacion.findMany({
      where: whereClause,
      include: {
        periodo: true,
        grupo: { include: { curso: true } },
        docente: { include: { usuario: true } },
        ambiente: true,
      },
      orderBy: [
        { dia: "asc" },
        { horaInicio: "asc" }
      ]
    });

    if (formato === 'excel') {
      const wb = XLSX.utils.book_new();
      const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
      const HORAS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

      const docenteNombre = asignaciones[0]?.docente?.usuario?.nombre ?? "Docente";
      const semestreNombre = asignaciones[0]?.periodo?.semestre ?? semestre ?? "Semestre";
      const escuelaNombre = asignaciones[0]?.periodo?.escuela ?? escuela ?? "Escuela";
      const ambienteNombreGlobal = asignaciones.length > 0 && modo === 'AULA' ? asignaciones[0].ambiente?.nombre : "Ambiente";

      let tituloPrincipal = "Horario Académico";
      if (modo === 'DOCENTE') tituloPrincipal = `Horario Docente: ${docenteNombre}`;
      else if (modo === 'CICLO') tituloPrincipal = `Horario Académico - Ciclo ${ciclo || ''} (Grupo ${grupo || 'Todos'})`;
      else if (modo === 'AULA') tituloPrincipal = `Horario Ambiente: ${ambienteNombreGlobal}`;

      const grid: any[][] = [
        [tituloPrincipal, "", "", "", "", "", ""],
        [`Semestre: ${semestreNombre}`, `Escuela: ${escuelaNombre}`, "", "", "", "", ""],
        ["Hora", ...DIAS.map((d) => d.charAt(0) + d.slice(1).toLowerCase())],
      ];
      HORAS.forEach((h) => grid.push([h, "", "", "", "", "", ""]));

      const wsHorario = XLSX.utils.aoa_to_sheet(grid);
      wsHorario["!cols"] = [{ wch: 10 }, ...Array.from({ length: 6 }, () => ({ wch: 28 }))];
      wsHorario["!merges"] = [];

      const rgb = (hex: string) => `FF${hex.replace("#", "").toUpperCase()}`;
      const borderThin = {
        top: { style: "thin", color: { rgb: rgb("E5E7EB") } },
        bottom: { style: "thin", color: { rgb: rgb("E5E7EB") } },
        left: { style: "thin", color: { rgb: rgb("E5E7EB") } },
        right: { style: "thin", color: { rgb: rgb("E5E7EB") } },
      };

      const setCell = (r: number, c: number, v: any, s?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell: any = (wsHorario as any)[addr] ?? { t: typeof v === "number" ? "n" : "s", v };
        cell.v = v;
        if (s) cell.s = s;
        (wsHorario as any)[addr] = cell;
      };

      let headerColor = "1E3A8A"; // Default Blue
      if (modo === 'CICLO') headerColor = "166534"; // Green for Ciclo
      if (modo === 'AULA') headerColor = "9A3412"; // Orange for Aula

      for (let c = 0; c <= 6; c++) {
        setCell(0, c, c === 0 ? tituloPrincipal : "", {
          font: { bold: true, sz: 16, color: { rgb: rgb("FFFFFF") } },
          fill: { patternType: "solid", fgColor: { rgb: rgb(headerColor) } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
        });
      }
      (wsHorario["!merges"] as any[]).push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });

      for (let c = 0; c <= 6; c++) {
        setCell(1, c, grid[1][c] ?? "", {
          font: { bold: c <= 1, sz: 11, color: { rgb: rgb("111827") } },
          fill: { patternType: "solid", fgColor: { rgb: rgb("F3F4F6") } },
          alignment: { horizontal: c <= 1 ? "left" : "center", vertical: "center", wrapText: true },
          border: borderThin,
        });
      }

      for (let c = 0; c <= 6; c++) {
        setCell(2, c, grid[2][c] ?? "", {
          font: { bold: true, sz: 11, color: { rgb: rgb("FFFFFF") } },
          fill: { patternType: "solid", fgColor: { rgb: rgb("334155") } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: borderThin,
        });
      }

      for (let r = 3; r < 3 + HORAS.length; r++) {
        setCell(r, 0, grid[r][0], {
          font: { bold: true, sz: 11, color: { rgb: rgb("0F172A") } },
          fill: { patternType: "solid", fgColor: { rgb: rgb("E2E8F0") } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderThin,
        });
        for (let c = 1; c <= 6; c++) {
          setCell(r, c, "", {
            font: { sz: 10, color: { rgb: rgb("0F172A") } },
            alignment: { horizontal: "left", vertical: "top", wrapText: true },
            border: borderThin,
          });
        }
      }

      wsHorario["!rows"] = [
        { hpt: 28 },
        { hpt: 18 },
        { hpt: 20 },
        ...Array.from({ length: HORAS.length }, () => ({ hpt: 54 })),
      ];

      const horaToRowIndex = new Map<string, number>();
      HORAS.forEach((h, idx) => {
        horaToRowIndex.set(h, idx + 3);
      });

      const diaToColIndex = new Map<string, number>();
      DIAS.forEach((d, idx) => {
        diaToColIndex.set(d, idx + 1);
      });

      for (const asig of asignaciones) {
        const rowStart = horaToRowIndex.get(asig.horaInicio);
        const col = diaToColIndex.get(asig.dia);
        if (rowStart === undefined || col === undefined) continue;

        const cursoNombre = asig.grupo?.curso?.nombre ?? "";
        const grupoNombre = asig.grupo?.nombre ?? "";
        const ambienteNombre = asig.ambiente?.nombre ?? "";
        const docenteClase = asig.docente?.usuario?.nombre ?? "";
        const tipoClase = asig.tipo ?? "";

        let value = "";
        if (modo === 'DOCENTE') {
           value = `${cursoNombre}\nG${grupoNombre}\n${ambienteNombre}\n${tipoClase}`;
        } else if (modo === 'CICLO') {
           value = `${cursoNombre}\n${docenteClase}\n${ambienteNombre}\n${tipoClase}`;
        } else if (modo === 'AULA') {
           value = `${cursoNombre}\n${docenteClase}\nG${grupoNombre}`;
        } else {
           value = `${cursoNombre}\nG${grupoNombre}\n${ambienteNombre}\n${tipoClase}`;
        }
        
        const cellAddr = XLSX.utils.encode_cell({ r: rowStart, c: col });
        const existing = (wsHorario as any)[cellAddr]?.v;
        const isAula = tipoClase === "AULA";
        const fillColor = isAula ? "DBEAFE" : "DCFCE7";
        const borderColor = isAula ? "93C5FD" : "86EFAC";
        (wsHorario as any)[cellAddr] = {
          t: "s",
          v: existing ? `${existing}\n\n${value}` : value,
          s: {
            font: { bold: true, sz: 10, color: { rgb: rgb("0F172A") } },
            fill: { patternType: "solid", fgColor: { rgb: rgb(fillColor) } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: rgb(borderColor) } },
              bottom: { style: "thin", color: { rgb: rgb(borderColor) } },
              left: { style: "thin", color: { rgb: rgb(borderColor) } },
              right: { style: "thin", color: { rgb: rgb(borderColor) } },
            },
          },
        };

        const startH = Number(asig.horaInicio.split(":")[0]);
        const endH = Number(asig.horaFin.split(":")[0]);
        const duration = Number.isFinite(startH) && Number.isFinite(endH) ? Math.max(1, endH - startH) : 1;

        if (duration > 1) {
          const rowEnd = Math.min(rowStart + duration - 1, 2 + HORAS.length);
          if (rowEnd > rowStart) {
            const overlaps = (wsHorario["!merges"] as any[]).some((m: any) => {
              if (m.s.c !== col) return false;
              return Math.max(m.s.r, rowStart) <= Math.min(m.e.r, rowEnd);
            });
            const cellAlreadyHadValue = Boolean(existing);
            if (!overlaps && !cellAlreadyHadValue) {
              (wsHorario["!merges"] as any[]).push({ s: { r: rowStart, c: col }, e: { r: rowEnd, c: col } });
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsHorario, "Horario");

      const rowsDetalle = asignaciones.map((asig) => ({
        Semestre: asig.periodo?.semestre ?? "",
        Escuela: asig.periodo?.escuela ?? "",
        Dia: asig.dia,
        HoraInicio: asig.horaInicio,
        HoraFin: asig.horaFin,
        Tipo: asig.tipo,
        Curso: asig.grupo?.curso?.nombre ?? "",
        CodigoCurso: asig.grupo?.curso?.codigo ?? "",
        Ciclo: asig.grupo?.curso?.ciclo ?? "",
        Grupo: asig.grupo?.nombre ?? "",
        Docente: asig.docente?.usuario?.nombre ?? "",
        Ambiente: asig.ambiente?.nombre ?? "",
      }));

      const wsDetalle = XLSX.utils.json_to_sheet(rowsDetalle, { skipHeader: false });
      wsDetalle["!cols"] = [
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
        { wch: 20 },
      ];
      const headerRangeStr = wsDetalle["!ref"];
      if (headerRangeStr) {
        const headerRange = XLSX.utils.decode_range(headerRangeStr);
        for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r: 0, c });
          if (!(wsDetalle as any)[addr]) continue;
          (wsDetalle as any)[addr].s = {
            font: { bold: true, sz: 11, color: { rgb: rgb("FFFFFF") } },
            fill: { patternType: "solid", fgColor: { rgb: rgb("1E3A8A") } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: borderThin,
          };
        }
      }
      wsDetalle["!rows"] = [{ hpt: 20 }];
      XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

      const safe = (s: string) => s ? s.replace(/[^\w.-]+/g, "_").slice(0, 80) : "reporte";
      let fileNameSuffix = safe(docenteNombre);
      if (modo === 'CICLO') fileNameSuffix = `Ciclo_${ciclo}_G${grupo}`;
      if (modo === 'AULA') fileNameSuffix = `Aula_${safe(ambienteNombreGlobal ?? '')}`;
      const fileName = `Horario_${fileNameSuffix}_${safe(semestreNombre)}.xlsx`;

      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(excelBuffer as any, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        },
      });
    }

    const escapeHtml = (value: any) => {
      const s = value == null ? '' : String(value);
      return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    };

    const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
    const HORAS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

    const docenteFiltroNombre =
      asignaciones[0]?.docente?.usuario?.nombre ??
      (docenteId
        ? (await prisma.docente.findUnique({
            where: { id: docenteId },
            select: { usuario: { select: { nombre: true } } },
          }))?.usuario?.nombre
        : null) ??
      null;

    const semestreNombre = asignaciones[0]?.periodo?.semestre ?? semestre ?? (periodoId ? (await prisma.periodo.findUnique({ where: { id: periodoId }, select: { semestre: true } }))?.semestre : null) ?? "—";
    const escuelaNombre = asignaciones[0]?.periodo?.escuela ?? escuela ?? (periodoId ? (await prisma.periodo.findUnique({ where: { id: periodoId }, select: { escuela: true } }))?.escuela : null) ?? "—";

    const total = asignaciones.length;
    const totalAula = asignaciones.filter((a) => a.tipo === "AULA").length;
    const totalLab = asignaciones.filter((a) => a.tipo === "LABORATORIO").length;

    const asignacionesPorCelda = new Map<string, any[]>();
    for (const a of asignaciones) {
      const key = `${a.dia}|${a.horaInicio}`;
      const list = asignacionesPorCelda.get(key) ?? [];
      list.push(a);
      asignacionesPorCelda.set(key, list);
    }

    const buildCardHtml = (asig: any) => {
      const cursoNombre = asig?.grupo?.curso?.nombre ?? "—";
      const codigoCurso = asig?.grupo?.curso?.codigo ?? "";
      const grupoNombre = asig?.grupo?.nombre ?? "—";
      const ambienteNombre = asig?.ambiente?.nombre ?? "—";
      const docenteNombre = asig?.docente?.usuario?.nombre ?? "—";
      const tipoClase = asig?.tipo ?? "—";
      const badgeClass = tipoClase === "AULA" ? "badge-aula" : "badge-lab";
      const cardClass = tipoClase === "AULA" ? "card-aula" : "card-lab";

      return `
        <div class="card ${cardClass}">
          <div class="card-row">
            <div class="card-title">${escapeHtml(cursoNombre)}</div>
            <div class="badge ${badgeClass}">${escapeHtml(tipoClase)}</div>
          </div>
          <div class="card-sub">
            <span class="muted">${escapeHtml(codigoCurso)}</span>
            <span class="dot"></span>
            <span>Grupo ${escapeHtml(grupoNombre)}</span>
          </div>
          <div class="card-meta">
            <span>${escapeHtml(ambienteNombre)}</span>
            <span class="dot"></span>
            <span>${escapeHtml(asig.horaInicio)}-${escapeHtml(asig.horaFin)}</span>
          </div>
          <div class="card-doc">${escapeHtml(docenteNombre)}</div>
        </div>
      `;
    };

    const buildCeldaHtml = (dia: string, hora: string) => {
      const list = asignacionesPorCelda.get(`${dia}|${hora}`) ?? [];
      if (list.length === 0) return `<div class="cell-empty">—</div>`;
      return list.map(buildCardHtml).join("");
    };

    const headerChips = [
      { label: "Semestre", value: semestreNombre },
      { label: "Escuela", value: escuelaNombre },
      ...(docenteFiltroNombre ? [{ label: "Docente", value: docenteFiltroNombre }] : []),
      ...(ciclo ? [{ label: "Ciclo", value: ciclo }] : []),
      ...(grupo ? [{ label: "Grupo", value: grupo }] : []),
      ...(tipo ? [{ label: "Tipo", value: tipo }] : []),
    ];

    const chipsHtml = headerChips
      .map(
        (c) => `
          <div class="chip">
            <div class="chip-label">${escapeHtml(c.label)}</div>
            <div class="chip-value">${escapeHtml(c.value)}</div>
          </div>
        `
      )
      .join("");

    const scheduleBodyHtml =
      asignaciones.length === 0
        ? `
          <div class="empty">
            <div class="empty-title">No hay horarios generados</div>
            <div class="empty-sub">Ajusta los filtros e intenta nuevamente.</div>
          </div>
        `
        : `
          <table class="grid">
            <thead>
              <tr>
                <th class="grid-time">Hora</th>
                ${DIAS.map((d) => `<th class="grid-day">${escapeHtml(d)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${HORAS.map(
                (h) => `
                  <tr>
                    <th class="grid-time">${escapeHtml(h)}</th>
                    ${DIAS.map((d) => `<td class="grid-cell">${buildCeldaHtml(d, h)}</td>`).join("")}
                  </tr>
                `
              ).join("")}
            </tbody>
          </table>
        `;

    const detalleRowsHtml =
      asignaciones.length === 0
        ? ""
        : asignaciones
            .map((asig) => {
              const cursoNombre = asig?.grupo?.curso?.nombre ?? "—";
              const codigoCurso = asig?.grupo?.curso?.codigo ?? "";
              const grupoNombre = asig?.grupo?.nombre ?? "—";
              const tipoClase = asig?.tipo ?? "—";
              const docenteNombre = asig?.docente?.usuario?.nombre ?? "—";
              const ambienteNombre = asig?.ambiente?.nombre ?? "—";
              const badgeClass = tipoClase === "AULA" ? "badge-aula" : "badge-lab";
              return `
                <tr>
                  <td class="td-strong">${escapeHtml(asig.dia)}</td>
                  <td>${escapeHtml(asig.horaInicio)}-${escapeHtml(asig.horaFin)}</td>
                  <td>
                    <div class="td-title">${escapeHtml(cursoNombre)}</div>
                    <div class="td-sub">${escapeHtml(codigoCurso)} · Grupo ${escapeHtml(grupoNombre)}</div>
                  </td>
                  <td><span class="badge ${badgeClass}">${escapeHtml(tipoClase)}</span></td>
                  <td>${escapeHtml(docenteNombre)}</td>
                  <td>${escapeHtml(ambienteNombre)}</td>
                </tr>
              `;
            })
            .join("");

    // 3. Launch Puppeteer - use @sparticuz/chromium on Vercel, regular puppeteer locally
    const { isVercel, puppeteer, chromium } = await getPuppeteerAndChromium();
    let browser;
    if (isVercel) {
      const executablePath = await chromium.executablePath();
      const args = chromium.args;
      browser = await puppeteer.launch({
        args,
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

    // 4. Professional HTML Content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            @page { size: A4 landscape; margin: 18mm 14mm; }
            html, body { height: 100%; }
            body { font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; background: #ffffff; }
            .wrap { padding: 0; }
            .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 0 0 12px 0; border-bottom: 2px solid #e2e8f0; }
            .brand { display: flex; flex-direction: column; gap: 4px; }
            .title { font-size: 18px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.2px; }
            .subtitle { font-size: 12px; color: #475569; }
            .meta { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
            .chip { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 8px 10px; min-width: 140px; }
            .chip-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
            .chip-value { font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px; }
            .summary { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 10px 0; }
            .summary-left { display: flex; gap: 10px; align-items: center; }
            .kpi { border: 1px solid #e2e8f0; background: #ffffff; border-radius: 10px; padding: 8px 10px; }
            .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
            .kpi-value { font-size: 14px; font-weight: 800; margin-top: 2px; }
            .legend { display: flex; gap: 10px; align-items: center; }
            .legend-item { display: flex; gap: 6px; align-items: center; font-size: 11px; color: #334155; }
            .legend-swatch { width: 10px; height: 10px; border-radius: 3px; border: 1px solid #cbd5e1; }
            .swatch-aula { background: #dbeafe; border-color: #93c5fd; }
            .swatch-lab { background: #dcfce7; border-color: #86efac; }
            .badge { padding: 3px 7px; border-radius: 999px; font-size: 9px; font-weight: 800; display: inline-flex; align-items: center; line-height: 1; border: 1px solid transparent; }
            .badge-aula { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
            .badge-lab { background: #dcfce7; color: #166534; border-color: #86efac; }
            .grid { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 6px; }
            .grid th, .grid td { border: 1px solid #e2e8f0; }
            .grid thead th { background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 6px; }
            .grid-time { width: 52px; background: #f1f5f9 !important; color: #0f172a !important; text-transform: none !important; font-size: 10px !important; font-weight: 800; }
            .grid tbody th.grid-time { padding: 10px 6px; vertical-align: top; }
            .grid-cell { padding: 6px; height: 62px; vertical-align: top; background: #ffffff; }
            .grid tbody tr:nth-child(even) .grid-cell { background: #fafafa; }
            .cell-empty { font-size: 10px; color: #cbd5e1; user-select: none; }
            .card { border-radius: 8px; padding: 6px 7px; margin-bottom: 6px; border: 1px solid #e2e8f0; background: #ffffff; }
            .card:last-child { margin-bottom: 0; }
            .card-aula { border-left: 4px solid #3b82f6; background: #eff6ff; }
            .card-lab { border-left: 4px solid #22c55e; background: #f0fdf4; }
            .card-row { display: flex; gap: 8px; align-items: flex-start; justify-content: space-between; }
            .card-title { font-size: 10.5px; font-weight: 800; color: #0f172a; line-height: 1.15; }
            .card-sub { font-size: 9.5px; color: #334155; margin-top: 3px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
            .card-meta { font-size: 9.5px; color: #334155; margin-top: 2px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
            .card-doc { font-size: 9px; color: #64748b; margin-top: 3px; }
            .dot { width: 3px; height: 3px; border-radius: 999px; background: #94a3b8; display: inline-block; }
            .muted { color: #64748b; }
            .page-break { page-break-before: always; }
            .detail-title { font-size: 13px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; }
            .detail-sub { font-size: 10px; color: #64748b; margin: 0 0 10px 0; }
            .table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .table th { background: #1e3a8a; color: #ffffff; padding: 8px 8px; text-align: left; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 8px 8px; vertical-align: top; }
            .td-strong { font-weight: 800; }
            .td-title { font-weight: 800; color: #0f172a; }
            .td-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
            .empty { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 22px; text-align: center; margin-top: 16px; }
            .empty-title { font-size: 14px; font-weight: 900; color: #0f172a; }
            .empty-sub { font-size: 11px; color: #64748b; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="header">
              <div style="display: flex; gap: 16px; align-items: center;">
                <img src="http://localhost:3000/logo-unt.png" alt="UNT" style="width: 48px; height: 48px; object-fit: contain; border-radius: 8px;">
                <div class="brand">
                  <div class="title">Visualización de Horarios - UNT</div>
                  <div class="subtitle">Consulta y gestiona los horarios por período académico</div>
                </div>
              </div>
              <div class="meta">
                ${chipsHtml}
              </div>
            </div>

            <div class="summary">
              <div class="summary-left">
                <div class="kpi">
                  <div class="kpi-label">Total</div>
                  <div class="kpi-value">${escapeHtml(total)}</div>
                </div>
                <div class="kpi">
                  <div class="kpi-label">Aula</div>
                  <div class="kpi-value">${escapeHtml(totalAula)}</div>
                </div>
                <div class="kpi">
                  <div class="kpi-label">Laboratorio</div>
                  <div class="kpi-value">${escapeHtml(totalLab)}</div>
                </div>
              </div>
              <div class="legend">
                <div class="legend-item"><span class="legend-swatch swatch-aula"></span> AULA</div>
                <div class="legend-item"><span class="legend-swatch swatch-lab"></span> LABORATORIO</div>
              </div>
            </div>

            ${scheduleBodyHtml}

            ${asignaciones.length === 0 ? "" : `
              <div class="page-break"></div>
              <h2 class="detail-title">Detalle de asignaciones</h2>
              <p class="detail-sub">Listado completo para verificación y edición.</p>
              <table class="table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Hora</th>
                    <th>Curso / Grupo</th>
                    <th>Tipo</th>
                    <th>Docente</th>
                    <th>Ambiente</th>
                  </tr>
                </thead>
                <tbody>
                  ${detalleRowsHtml}
                </tbody>
              </table>
            `}
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-family: Inter, Segoe UI, Arial; font-size: 9px; color: #64748b; padding: 6px 14mm;">
          <span>Reporte de Horarios</span>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-family: Inter, Segoe UI, Arial; font-size: 9px; color: #64748b; padding: 6px 14mm; display: flex; justify-content: space-between;">
          <span>Generado el ${escapeHtml(new Date().toLocaleDateString('es-PE'))} ${escapeHtml(new Date().toLocaleTimeString('es-PE'))}</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
    });

    await browser.close();

    // Use standard Response to properly return binary data
    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Reporte_Horarios_UNT.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json({ error: "No se pudo generar el reporte PDF" }, { status: 500 });
  }
}
