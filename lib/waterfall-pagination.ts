// Keep the existing batch size to avoid increasing Worker requests while browsing.
export const WATERFALL_BATCH_SIZE = 180;

export function waterfallPageWindow(totalCount: number, requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / WATERFALL_BATCH_SIZE));
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, Math.trunc(requestedPage)), totalPages)
    : 1;
  const start = (page - 1) * WATERFALL_BATCH_SIZE;
  return { page, totalPages, start, end: Math.min(totalCount, start + WATERFALL_BATCH_SIZE) };
}

export function waterfallPageForIndex(index: number) {
  return Math.floor(Math.max(0, index) / WATERFALL_BATCH_SIZE) + 1;
}
