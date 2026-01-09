// Utility functions for generating URLs and content types

export function stripExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return filename;
  return filename.substring(0, idx);
}

export function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.substring(idx).toLowerCase();
}

export function getContentTypeByExt(ext) {
  switch (ext) {
    case '.json':
      return 'application/json';
    case '.xml':
      return 'application/xml';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export function generateCollectionUrl(lang, type, filenameWithoutExt) {
  return `/api/collections/${encodeURIComponent(lang)}/${encodeURIComponent(type)}/${encodeURIComponent(filenameWithoutExt)}`;
}

export function generateTableUrl(table, filenameWithoutExt) {
  return `/api/${encodeURIComponent(table)}/${encodeURIComponent(filenameWithoutExt)}`;
}
