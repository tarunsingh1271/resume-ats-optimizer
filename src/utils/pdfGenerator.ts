import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { OptimizationResult } from '../types/interfaces';

export async function generateOptimizedResumePDF(result: OptimizationResult): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 12;
  const margin = 50;

  page.drawText('ATS-Optimized Resume', {
    x: margin,
    y: height - margin,
    size: 18,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Optimization Score: ${result.score.toFixed(2)}%`, {
    x: margin,
    y: height - margin - 30,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText('Recommendations:', {
    x: margin,
    y: height - margin - 60,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });

  result.recommendations.forEach((rec, index) => {
    page.drawText(`• ${rec}`, {
      x: margin + 20,
      y: height - margin - 90 - (index * 20),
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

export function downloadPDF(blob: Blob, filename: string = 'optimized-resume.pdf') {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}