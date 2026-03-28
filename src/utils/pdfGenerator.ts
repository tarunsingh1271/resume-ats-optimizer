import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { OptimizationResult, JobDescription } from '../types/interfaces';

export async function generateOptimizedResumePDF(
  result: OptimizationResult,
  originalText: string,
  jd: JobDescription
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const fontSize = 11;
  const padding = 50;
  const lineHeight = 16;
  const usableWidth = width - (padding * 2);

  let currentY = height - padding;

  const addNewPageIfNecessary = (requiredSpace: number) => {
    if (currentY - requiredSpace < padding) {
      page = pdfDoc.addPage();
      currentY = height - padding;
    }
  };

  // Helper function to draw multi-line text and return how much Y space was used
  const drawTextWrapped = (text: string, currentFont: any, size: number, color: any, x = padding) => {
    // split string into words
    const words = text.split(' ');
    let line = '';
    
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = currentFont.widthOfTextAtSize(testLine, size);
      
      if (testWidth > usableWidth && n > 0) {
        addNewPageIfNecessary(lineHeight);
        page.drawText(line, { x, y: currentY, size, font: currentFont, color });
        currentY -= lineHeight;
        line = words[n] + ' ';
      }
      else {
        line = testLine;
      }
    }
    addNewPageIfNecessary(lineHeight);
    page.drawText(line, { x, y: currentY, size, font: currentFont, color });
    currentY -= lineHeight;
  };

  // --- 1. ATS Header ---
  page.drawText('ATS-OPTIMIZED RESUME', {
    x: padding,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  currentY -= 25;

  page.drawText(`Target Role: ${jd.title}`, {
    x: padding,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  currentY -= 20;

  // --- 2. Main Extracted Content (The actual ATS valid text) ---
  const textParagraphs = originalText.split('\n');
  
  textParagraphs.forEach(para => {
    if(para.trim() !== '') {
      drawTextWrapped(para.trim(), font, fontSize, rgb(0, 0, 0));
    }
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

export function downloadPDF(blob: Blob, filename: string = 'optimized-resume.pdf') {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  if(filename.endsWith('.pdf')) {
    link.download = filename;
  } else {
    link.download = filename + '.pdf';
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}