/**
 * Generates an endpoint scoped to the given center.
 * By default, this enforces nested scoping (e.g. `/education-centers/:id/:resource`).
 * For endpoints that are generic on the backend but need logical scoping,
 * it optionally appends `?centerId=` to avoid backend breakage while still securing the payload.
 */
export function buildCenterEndpoint(
  resource: string, 
  centerId: number | undefined | null,
  forceNested: boolean = true
): string {
  // If no center provides context, we fallback to global context handling on backend
  if (!centerId) {
    return resource.startsWith('/') ? resource : `/${resource}`;
  }

  const cleanResource = resource.startsWith('/') ? resource.slice(1) : resource;

  if (forceNested) {
    return `/education-centers/${centerId}/${cleanResource}`;
  }

  // Backup strategy: use query parameter
  const base = `/${cleanResource}`;
  return `${base}?centerId=${centerId}`;
}

/** Query for flat `StudentsController` routes: GET/POST/PATCH/DELETE `/students` and `/students/:id`. */
export function centerIdQuery(centerId: number | undefined | null): Record<string, number> | undefined {
  if (centerId == null) return undefined;
  return { centerId };
}

/** Preserve superadmin center context in client navigations (e.g. /students/12?centerId=3). */
export function withCenterQuery(path: string, centerId: number | null | undefined): string {
  if (centerId == null) return path;
  const q = `centerId=${centerId}`;
  return path.includes("?") ? `${path}&${q}` : `${path}?${q}`;
}
