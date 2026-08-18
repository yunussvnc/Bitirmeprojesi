export function isAllowedAdminPath(path: string[]): boolean {
  return (
    path.length >= 2 &&
    path[0] === 'admin' &&
    path.every(
      (segment) =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        !segment.includes('/') &&
        !segment.includes('\\'),
    )
  );
}
