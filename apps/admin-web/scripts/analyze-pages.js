const fs = require('fs');
const path = require('path');

const dashboardDir = 'd:/Рабочий стол/Asset-Linker (1)/Asset-Linker/apps/admin-web/src/app/(dashboard)';

function analyzePage(dirPath, route) {
    const pagePath = path.join(dirPath, 'page.tsx');
    if (!fs.existsSync(pagePath)) return null;

    const content = fs.readFileSync(pagePath, 'utf8');

    const usesApiClient = content.includes('apiClient');
    const usesUseApiData = content.includes('useApiData');
    const hasDataFetching = usesApiClient || usesUseApiData;
    
    const usesDataTable = content.includes('<DataTable');
    const supportsPagination = content.includes('page') && content.includes('limit') && usesDataTable;
    const supportsSearch = content.includes('search') && content.includes('setSearch');
    
    // Check if it passes additional filters to the API call
    // Search is standard, let's see if there are select/filter dropdowns
    const usesSelect = content.match(/<Select/g) !== null;
    const hasFilters = usesSelect || (content.includes('status') && content.includes('filter('));

    const usesDialog = content.includes('<Dialog');
    const usesSheet = content.includes('<Sheet');
    const hasModalActions = usesDialog || usesSheet;

    const usesRecharts = content.includes('recharts') || content.includes('<BarChart') || content.includes('<LineChart');

    // Page classification (list/detail/dashboard/settings)
    let type = 'unknown';
    if (content.includes('<DataTable')) {
        type = 'list';
    } else if (content.includes('dashboard/admin/stats') || content.includes('stats: {')) {
        type = 'dashboard';
    } else if (content.includes('securitySections') || content.includes('Settings')) {
        type = 'settings';
    } else {
        type = 'thin_shell/generic';
    }

    // Role-guard checking
    const hasRoleCheck = content.includes('role ===') || content.includes('permissions.') || content.includes('hasPermission');

    // Admin isolation
    // The previous code showed `centerId = user?.administrator?.centerId`, which maps the data to the specific center
    const enforcesCenterIsolation = content.includes('centerId');

    // Verify layout usage - usually handled at the parent (layout.tsx)
    // But verify if page itself uses PageHeader
    const usesPageHeader = content.includes('<PageHeader');

    // Check for "ModulePlaceholder"
    const isPlaceholder = content.includes('ModulePlaceholder');

    return {
        route,
        path: `src/app/(dashboard)/${route}/page.tsx`,
        type,
        isPlaceholder,
        dataFetching: hasDataFetching,
        search: !!supportsSearch,
        filters: hasFilters,
        pagination: !!supportsPagination,
        modals: !!hasModalActions,
        charts: !!usesRecharts,
        roleGuard: !!hasRoleCheck,
        adminIsolation: !!enforcesCenterIsolation,
        usesPageHeader,
        implDepth: (usesDialog || usesSheet || usesDataTable || usesRecharts) ? 'deep' : 'shallow/read-only'
    };
}

const routes = fs.readdirSync(dashboardDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const results = routes.map(route => analyzePage(path.join(dashboardDir, route), route)).filter(Boolean);

console.log(JSON.stringify(results, null, 2));
