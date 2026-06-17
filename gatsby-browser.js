import React from 'react';
import { AuthProvider } from './src/components/AuthContext';

export const wrapRootElement = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>;
};
