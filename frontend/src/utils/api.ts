// Get the API URL from environment variables or use a default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Check if we're in production or development
const isProduction = import.meta.env.PROD;

/**
 * Creates a properly formatted API URL based on the environment
 * In development: uses the proxy defined in vite.config.ts
 * In production: uses the full Hugging Face Spaces URL with HTTPS
 */
export function getApiUrl(endpoint: string): string {
    if (isProduction) {
        // In production, always ensure we're using HTTPS to avoid mixed content errors
        let baseUrl = API_BASE_URL;

        // Force HTTPS regardless of environment variable content
        if (baseUrl.startsWith('http://')) {
            baseUrl = baseUrl.replace('http://', 'https://');
            console.warn('API URL was using HTTP, forcing HTTPS to prevent mixed content errors');
        }

        // If no scheme is provided, assume HTTPS
        if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://')) {
            baseUrl = `https://${baseUrl}`;
            console.warn('API URL had no scheme, prefixing with HTTPS');
        }

        // Ensure there's no trailing slash in the base URL
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        // Build the final URL
        return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    } else {
        // In development, use the local proxy
        return `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    }
}

/**
 * Fetch wrapper that handles API calls with proper URLs
 */
export async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = getApiUrl(endpoint);
    console.log('Fetching from:', url); // Add this log for debugging

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get ${endpoint.split('/').pop()} data: ${response.status}`);
    }

    return response.json();
} 