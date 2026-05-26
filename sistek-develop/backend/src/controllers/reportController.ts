import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import * as reportService from '../services/reportService';

// Colores corporativos
const COLOR_PRIMARY   = '#6366f1';
const COLOR_DARK      = '#1e293b';
const COLOR_GRAY      = '#64748b';
const COLOR_LIGHT_BG  = '#f8fafc';
const COLOR_BORDER    = '#e2e8f0';
const COLOR_RED       = '#ef4444';
const COLOR_YELLOW    = '#f59e0b';
const COLOR_GREEN     = '#10b981';

export const getReport = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, agent_id, status } = req.query;

    if (req.userRole !== 'administrador') {
      return res.status(403).json({ error: 'Solo administradores pueden ver reportes' });
    }

    const filters: reportService.ReportFilters = {};
    if (start_date && typeof start_date === 'string') filters.start_date = start_date;
    if (end_date   && typeof end_date   === 'string') filters.end_date   = end_date;
    if (agent_id   && typeof agent_id   === 'string') filters.agent_id   = parseInt(agent_id);
    if (status     && typeof status     === 'string') filters.status     = status;

    const data = await reportService.getReportData(filters);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al generar reporte: ' + error.message });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    if (req.userRole !== 'administrador') {
      return res.status(403).json({ error: 'Solo administradores pueden descargar reportes' });
    }

    const { start_date, end_date, agent_id, status } = req.query;
    const filters: reportService.ReportFilters = {};
    if (start_date && typeof start_date === 'string') filters.start_date = start_date;
    if (end_date   && typeof end_date   === 'string') filters.end_date   = end_date;
    if (agent_id   && typeof agent_id   === 'string') filters.agent_id   = parseInt(agent_id);
    if (status     && typeof status     === 'string') filters.status     = status;

    const [reportData, tickets] = await Promise.all([
      reportService.getReportData(filters),
      reportService.getTicketsForExport(filters),
    ]);

    const now = new Date();
    const fechaGeneracion = now.toLocaleString('es-CL', { timeZone: 'America/Santiago' });
    const filtrosTexto = [
      filters.start_date ? `Desde ${filters.start_date}` : null,
      filters.end_date   ? `Hasta ${filters.end_date}`   : null,
      filters.status     ? `Estado: ${filters.status}`   : null,
      filters.agent_id   ? `Agente ID: ${filters.agent_id}` : null,
    ].filter(Boolean).join('  ·  ') || 'Sin filtros (todos los datos)';

    const { resumen, por_agente } = reportData;

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    const filename = `reporte_sistek_${now.toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const pageW = doc.page.width;
    const margin = 45;
    const contentW = pageW - margin * 2;

    // ── ENCABEZADO ──────────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 75).fill(COLOR_PRIMARY);
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
       .text('Sistek', margin, 18);
    doc.fontSize(11).font('Helvetica')
       .text('Reporte de Gestión de Tickets', margin, 42);
    doc.fillColor('white').fontSize(9)
       .text(fechaGeneracion, pageW - margin - 150, 30, { width: 150, align: 'right' });

    doc.moveDown(3.5);

    // ── FILTROS ─────────────────────────────────────────────────────────────
    doc.roundedRect(margin, doc.y, contentW, 28, 4)
       .fill(COLOR_LIGHT_BG);
    doc.fillColor(COLOR_GRAY).fontSize(8).font('Helvetica-Bold')
       .text('FILTROS APLICADOS', margin + 10, doc.y - 22);
    doc.fillColor(COLOR_DARK).fontSize(9).font('Helvetica')
       .text(filtrosTexto, margin + 10, doc.y - 10, { width: contentW - 20 });

    doc.moveDown(1.5);

    // ── SECCIÓN: MÉTRICAS GENERALES ──────────────────────────────────────────
    sectionTitle(doc, 'Métricas Generales', margin, contentW);

    const metricas = [
      { label: 'Total',        value: String(resumen.total),        color: COLOR_PRIMARY },
      { label: 'Abiertos',     value: String(resumen.abiertos),     color: COLOR_RED    },
      { label: 'En progreso',  value: String(resumen.en_progreso),  color: COLOR_YELLOW },
      { label: 'Cerrados',     value: String(resumen.cerrados),     color: COLOR_GREEN  },
      { label: 'Alta',         value: String(resumen.alta),         color: COLOR_RED    },
      { label: 'Media',        value: String(resumen.media),        color: COLOR_YELLOW },
      { label: 'Baja',         value: String(resumen.baja),         color: COLOR_GREEN  },
      { label: 'Prom. resp.',  value: resumen.avg_respuesta_horas  != null ? `${resumen.avg_respuesta_horas} h`  : '—', color: COLOR_PRIMARY },
      { label: 'Prom. resol.', value: resumen.avg_resolucion_horas != null ? `${resumen.avg_resolucion_horas} h` : '—', color: COLOR_PRIMARY },
    ];

    const cardW = Math.floor((contentW - 8 * 6) / 9);
    const cardH = 52;
    let cx = margin;
    const cy = doc.y;

    metricas.forEach(m => {
      doc.roundedRect(cx, cy, cardW, cardH, 4).fill(COLOR_LIGHT_BG);
      doc.rect(cx, cy, 3, cardH).fill(m.color);
      doc.fillColor(COLOR_GRAY).fontSize(7).font('Helvetica')
         .text(m.label.toUpperCase(), cx + 6, cy + 7, { width: cardW - 8 });
      doc.fillColor(m.color).fontSize(14).font('Helvetica-Bold')
         .text(m.value, cx + 6, cy + 20, { width: cardW - 8 });
      cx += cardW + 6;
    });

    doc.y = cy + cardH + 16;

    // ── SECCIÓN: DETALLE POR AGENTE ──────────────────────────────────────────
    if (por_agente.length > 0) {
      sectionTitle(doc, 'Detalle por Agente', margin, contentW);

      const agenteCols = [
        { header: 'Agente',          width: 130 },
        { header: 'Total',           width: 50  },
        { header: 'Abiertos',        width: 60  },
        { header: 'En progreso',     width: 75  },
        { header: 'Cerrados',        width: 65  },
        { header: 'Prom. resolución',width: 100 },
      ];

      const agentRows = por_agente.map(a => [
        a.agente,
        String(a.total),
        String(a.abiertos),
        String(a.en_progreso),
        String(a.cerrados),
        a.avg_resolucion_horas != null ? `${a.avg_resolucion_horas} h` : '—',
      ]);

      drawTable(doc, agenteCols, agentRows, margin, contentW);
    }

    // ── SECCIÓN: LISTADO DE TICKETS ──────────────────────────────────────────
    sectionTitle(doc, 'Listado de Tickets', margin, contentW);

    if (tickets.length === 0) {
      doc.fillColor(COLOR_GRAY).fontSize(10).font('Helvetica')
         .text('No hay tickets con los filtros seleccionados.', margin, doc.y);
    } else {
      const ticketCols = [
        { header: 'ID',          width: 30  },
        { header: 'Título',      width: 130 },
        { header: 'Estado',      width: 70  },
        { header: 'Prioridad',   width: 55  },
        { header: 'Agente',      width: 90  },
        { header: 'Creado por',  width: 80  },
        { header: 'Resolución',  width: 60  },
      ];

      const ticketRows = tickets.map(t => [
        String(t.id),
        t.title,
        t.status,
        t.priority,
        t.agente_asignado ?? 'Sin asignar',
        t.creado_por,
        t.resolucion_horas != null ? `${t.resolucion_horas} h` : '—',
      ]);

      drawTable(doc, ticketCols, ticketRows, margin, contentW);
    }

    // ── PIE DE PÁGINA ────────────────────────────────────────────────────────
    const pageCount = (doc as any)._pageCount ?? 1;
    doc.fontSize(8).fillColor(COLOR_GRAY).font('Helvetica')
       .text(
         `Generado por Sistek  ·  ${fechaGeneracion}  ·  ${tickets.length} ticket(s)`,
         margin, doc.page.height - 35,
         { width: contentW, align: 'center' }
       );

    doc.end();
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar descarga: ' + error.message });
    }
  }
};

// ── HELPERS ──────────────────────────────────────────────────────────────────

function sectionTitle(doc: PDFKit.PDFDocument, title: string, margin: number, contentW: number) {
  doc.moveDown(0.4);
  const y = doc.y;
  doc.rect(margin, y, contentW, 22).fill(COLOR_PRIMARY);
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
     .text(title.toUpperCase(), margin + 10, y + 6);
  doc.y = y + 30;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  cols: { header: string; width: number }[],
  rows: string[][],
  margin: number,
  contentW: number,
) {
  const rowH    = 18;
  const headerH = 20;
  let y = doc.y;

  // Encabezado
  doc.rect(margin, y, contentW, headerH).fill('#e2e8f0');
  let x = margin;
  cols.forEach(col => {
    doc.fillColor(COLOR_DARK).fontSize(8).font('Helvetica-Bold')
       .text(col.header, x + 4, y + 6, { width: col.width - 8, ellipsis: true });
    x += col.width;
  });
  y += headerH;

  // Filas
  rows.forEach((row, ri) => {
    // Salto de página si no cabe la fila
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = 45;
    }

    if (ri % 2 === 1) {
      doc.rect(margin, y, contentW, rowH).fill(COLOR_LIGHT_BG);
    }

    x = margin;
    row.forEach((cell, ci) => {
      const colW = cols[ci]?.width ?? 80;
      // Color por estado/prioridad
      let textColor = COLOR_DARK;
      if (cell === 'Abierto')      textColor = COLOR_RED;
      if (cell === 'En progreso')  textColor = COLOR_YELLOW;
      if (cell === 'Cerrado')      textColor = COLOR_GREEN;
      if (cell === 'Alta')         textColor = COLOR_RED;
      if (cell === 'Media')        textColor = COLOR_YELLOW;
      if (cell === 'Baja')         textColor = COLOR_GREEN;

      doc.fillColor(textColor).fontSize(8).font('Helvetica')
         .text(cell ?? '—', x + 4, y + 5, { width: colW - 8, ellipsis: true });
      x += colW;
    });

    // Línea divisora
    doc.moveTo(margin, y + rowH).lineTo(margin + contentW, y + rowH)
       .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
    y += rowH;
  });

  doc.y = y + 10;
}
