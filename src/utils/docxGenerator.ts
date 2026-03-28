import { Document, Packer, Paragraph, TextRun, HeadingLevel, Header, AlignmentType } from 'docx';

export const generateDocx = async (text: string, title: string): Promise<Blob> => {
  // Split the AI-optimized plain text by newlines.
  const lines = text.split('\n');
  
  const paragraphs = lines.map(line => {
    line = line.trim();
    
    // Check if it's a heading (all caps, or starting with #, or very short)
    if (line.startsWith('#')) {
        const cleanContent = line.replace(/#/g, '').trim();
        return new Paragraph({
            text: cleanContent,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
        });
    }

    // Check if it's a bullet point
    if (line.startsWith('-') || line.startsWith('*')) {
        const cleanContent = line.replace(/^[-*]\s*/, '').trim();
        return new Paragraph({
            children: [new TextRun(cleanContent)],
            bullet: { level: 0 },
            spacing: { after: 100 }
        });
    }

    // Default to normal text
    return new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 100 }
    });
  });

  const doc = new Document({
    sections: [{
      headers: {
          default: new Header({
              children: [
                new Paragraph({
                    text: "Resume - ATS Optimized Format",
                    alignment: AlignmentType.RIGHT,
                }),
              ],
          }),
      },
      properties: {},
      children: [
        new Paragraph({
          text: title.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),
        ...paragraphs
      ],
    }]
  });

  return await Packer.toBlob(doc);
};
