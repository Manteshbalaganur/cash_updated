
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchWithAuth(endpoint: string, userId: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint.replace('{userId}', userId)}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response.json();
}

export async function uploadFile(file: File, userId: string) {
    const url = `${API_BASE_URL}/api/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clerk_user_id', userId);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload error: ${response.status}`);
    }

    return response.json();
}

export async function addExpense(data: any) {
    const url = `${API_BASE_URL}/api/add-expense`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Add expense error: ${response.status}`);
    }

    return response.json();
}
