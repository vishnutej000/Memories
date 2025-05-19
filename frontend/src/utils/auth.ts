const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Get authentication token from local storage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set authentication token in local storage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove authentication token from local storage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Get user data from local storage
export const getUser = (): any | null => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Set user data in local storage
export const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Remove user data from local storage
export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Logout user
export const logout = (): void => {
  removeToken();
  removeUser();
};