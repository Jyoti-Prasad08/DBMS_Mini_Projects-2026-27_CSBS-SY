/**
 * UserContext.jsx
 * Single-profile context for the logged-in customer.
 * Keeps only one user profile throughout the app — no profile switching.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCustomers } from '../api/customers';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    getCustomers()
      .then(res => {
        const list = res.data?.data || res.data?.customers || res.data || [];
        const arr = Array.isArray(list) ? list : [];
        if (arr.length > 0) {
          // Always lock to the primary customer profile
          setCurrentUser(arr[0]);
        }
      })
      .catch(err => console.warn('Could not load profile:', err.message))
      .finally(() => setLoadingUsers(false));
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, loadingUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
