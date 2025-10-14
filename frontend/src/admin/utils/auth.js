import { jwtDecode } from 'jwt-decode'; // ✅ FIXED: named import

export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const { exp } = jwtDecode(token); // decode the token
    return Date.now() >= exp * 1000;   // check if expired
  } catch (error) {
    return true; // Treat any decoding error as expired
  }
};

export const getUserFromToken = (token) => {
  if (!token) return null;

  try {
    return jwtDecode(token); // returns full user payload
  } catch (error) {
    return null;
  }
};
