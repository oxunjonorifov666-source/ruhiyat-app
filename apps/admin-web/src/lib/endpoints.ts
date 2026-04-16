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
