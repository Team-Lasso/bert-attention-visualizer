// Get the API URL from environment variables or use a default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Check if we're in production or development
const isProduction = import.meta.env.PROD;

/**
 * Creates a properly formatted API URL based on the environment
 * In development: uses the proxy defined in vite.config.ts
 * In production: uses the full Hugging Face Spaces URL
 */
export function getApiUrl(endpoint: string): string {
    if (isProduction) {
        // In production, use the full URL to the Hugging Face Space
        // IMPORTANT: Do NOT add /api prefix when using HF Spaces
        // Force HTTPS for production to avoid mixed content errors
        let url = API_BASE_URL;
        // Ensure the URL starts with https://
        if (url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        } else if (!url.startsWith('https://')) {
            url = 'https://' + url;
        }
        return `${url}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
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