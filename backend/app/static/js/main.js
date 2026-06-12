// RoadPay AI - Core client side scripts

// 1. Cookie Utilities
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days = 1) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// 2. Secure API fetch helper
async function apiRequest(endpoint, options = {}) {
    const token = getCookie("access_token");
    
    // Set headers
    const headers = options.headers || {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Auto-detect content-type if JSON body passed
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(endpoint, config);
        
        // Handle unauthorized session redirects
        if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
            deleteCookie("access_token");
            window.location.href = "/login?expired=true";
            return;
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong.");
        }
        return data;
    } catch (error) {
        console.error("API Request Error:", error);
        throw error;
    }
}

// 3. Theme Toggle Setup
function initTheme() {
    const theme = localStorage.getItem("theme") || 
                  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
}

// Initialize theme on script load
initTheme();

// 4. Decode JWT payload (without validating signature on client)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Mobile sidebar helper
function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar-drawer");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}
