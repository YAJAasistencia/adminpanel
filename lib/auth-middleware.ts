import { jwtDecode } from 'jwt-decode';

export interface AuthPayload {
  iss: string;
  ref: string;
  role: string;
  iat: number;
  exp: number;
}

export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

export function requireAdmin(token?: string): boolean {
  if (!token) return false;

  try {
    const decoded = jwtDecode<AuthPayload>(token);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }

    return decoded.role === 'service_role';
  } catch (error) {
    return false;
  }
}

export function verifyServiceRole(token?: string): boolean {
  return requireAdmin(token);
}
