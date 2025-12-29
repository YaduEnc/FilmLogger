/**
 * Basic Cookie Utilities
 */

export function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
}

export function setCookie(
    name: string,
    value: string,
    options: { expires?: number; path?: string } = {}
): void {
    const { expires, path = '/' } = options;
    let cookieString = `${name}=${value};path=${path}`;

    if (expires) {
        const date = new Date();
        date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
        cookieString += `;expires=${date.toUTCString()}`;
    }

    document.cookie = cookieString;
}

export function deleteCookie(name: string, path: string = '/'): void {
    setCookie(name, '', { expires: -1, path });
}
