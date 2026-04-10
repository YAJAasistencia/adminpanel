// Utility to create page URLs for Next.js routing
export function createPageUrl(pageName: string): string {
  // Convert PascalCase to kebab-case
  const kebabCase = pageName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  // Handle special cases
  const specialCases: Record<string, string> = {
    'admin-login': '/admin-login',
    'road-assist-app': '/road-assist-app',
    'driver-app': '/driver-app',
  };

  return specialCases[kebabCase] || `/${kebabCase}`;
}