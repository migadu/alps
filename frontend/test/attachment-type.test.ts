import { describe, expect, it } from 'vitest';
import { getAttachmentTypeInfo } from '../src/utils/attachment-type';

describe('getAttachmentTypeInfo', () => {
  it('identifies PDF by content type and extension', () => {
    const pdfByMime = getAttachmentTypeInfo('application/pdf', 'unnamed');
    expect(pdfByMime.category).toBe('pdf');
    expect(pdfByMime.icon).toBe('filePdf');
    expect(pdfByMime.isPdf).toBe(true);
    expect(pdfByMime.previewKind).toBe('pdf');
    expect(pdfByMime.isPreviewable).toBe(true);

    const pdfByExt = getAttachmentTypeInfo('application/octet-stream', 'report.pdf');
    expect(pdfByExt.category).toBe('pdf');
    expect(pdfByExt.icon).toBe('filePdf');
    expect(pdfByExt.isPdf).toBe(true);
  });

  it('identifies Images', () => {
    const img1 = getAttachmentTypeInfo('image/png', 'photo.png');
    expect(img1.category).toBe('image');
    expect(img1.icon).toBe('image');
    expect(img1.isImage).toBe(true);
    expect(img1.previewKind).toBe('image');

    const img2 = getAttachmentTypeInfo(undefined, 'diagram.svg');
    expect(img2.category).toBe('image');
    expect(img2.isImage).toBe(true);
  });

  it('identifies Spreadsheets and marks CSV/TSV as text previewable', () => {
    const csv = getAttachmentTypeInfo('text/csv', 'data.csv');
    expect(csv.category).toBe('spreadsheet');
    expect(csv.icon).toBe('fileXls');
    expect(csv.previewKind).toBe('text');
    expect(csv.isPreviewable).toBe(true);

    const xlsx = getAttachmentTypeInfo('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'sheet.xlsx');
    expect(xlsx.category).toBe('spreadsheet');
    expect(xlsx.icon).toBe('fileXls');
    expect(xlsx.previewKind).toBe('none');
    expect(xlsx.isPreviewable).toBe(false);
  });

  it('identifies Code and Text files as text previewable', () => {
    const code = getAttachmentTypeInfo('application/json', 'config.json');
    expect(code.category).toBe('code');
    expect(code.icon).toBe('fileCode');
    expect(code.previewKind).toBe('text');
    expect(code.isPreviewable).toBe(true);

    const py = getAttachmentTypeInfo(undefined, 'script.py');
    expect(py.category).toBe('code');
    expect(py.icon).toBe('fileCode');
    expect(py.previewKind).toBe('text');

    const txt = getAttachmentTypeInfo('text/plain', 'notes.txt');
    expect(txt.category).toBe('text');
    expect(txt.icon).toBe('fileText');
    expect(txt.previewKind).toBe('text');
  });

  it('identifies Audio and Video', () => {
    const audio = getAttachmentTypeInfo('audio/mpeg', 'song.mp3');
    expect(audio.category).toBe('audio');
    expect(audio.icon).toBe('fileAudio');
    expect(audio.isAudio).toBe(true);
    expect(audio.previewKind).toBe('audio');

    const video = getAttachmentTypeInfo('video/mp4', 'movie.mp4');
    expect(video.category).toBe('video');
    expect(video.icon).toBe('fileVideo');
    expect(video.isVideo).toBe(true);
    expect(video.previewKind).toBe('video');
  });

  it('identifies Documents, Presentations, and Archives', () => {
    const doc = getAttachmentTypeInfo(undefined, 'document.docx');
    expect(doc.category).toBe('document');
    expect(doc.icon).toBe('fileDoc');

    const ppt = getAttachmentTypeInfo(undefined, 'slides.pptx');
    expect(ppt.category).toBe('presentation');
    expect(ppt.icon).toBe('filePpt');

    const zip = getAttachmentTypeInfo('application/zip', 'archive.zip');
    expect(zip.category).toBe('archive');
    expect(zip.icon).toBe('fileArchive');
  });

  it('falls back to generic for unknown types', () => {
    const bin = getAttachmentTypeInfo('application/octet-stream', 'firmware.bin');
    expect(bin.category).toBe('generic');
    expect(bin.icon).toBe('file');
    expect(bin.previewKind).toBe('none');
    expect(bin.isPreviewable).toBe(false);
  });
});

