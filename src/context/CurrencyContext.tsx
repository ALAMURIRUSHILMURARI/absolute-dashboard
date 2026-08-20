import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyCode } from '../types';
import { useAuth } from './AuthContext';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  symbol: string;
  setCurrency: (code: CurrencyCode) => void;
  formatMoney: (amount: number, showSign?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (user?.preferences?.currency as CurrencyCode) || 'INR';
  });

  useEffect(() => {
    if (user?.preferences?.currency) {
      setCurrencyState(user.preferences.currency);
    }
  }, [user?.preferences?.currency]);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
  };

  const symbol = CURRENCIES[currency]?.symbol || '₹';

  const formatMoney = (amount: number, showSign = false): string => {
    const absVal = Math.abs(amount || 0);
    let formatted = '';

    if (currency === 'INR') {
      // Indian numbering format (e.g. 1,50,000)
      formatted = absVal.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: absVal % 1 === 0 ? 0 : 2,
      });
    } else {
      formatted = absVal.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: absVal % 1 === 0 ? 0 : 2,
      });
    }

    if (showSign) {
      if (amount > 0) return `+ ${symbol}${formatted}`;
      if (amount < 0) return `- ${symbol}${formatted}`;
      return `${symbol}${formatted}`;
    }

    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
