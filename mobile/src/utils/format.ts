import type { StockStatusApi } from '@/lib/api/types';

export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const formatDate = (value: string) => {
  const [datePart, timePart = ''] = value.split('T');
  const [year, month, day] = datePart.split('-');
  const time = timePart.slice(0, 5);
  return `${day}/${month}/${year}${time ? ` às ${time}` : ''}`;
};
export const stockStatus = (quantity: number): StockStatusApi => quantity === 0 ? 'OUT_OF_STOCK' : quantity <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
export const parseMoney = (value: string) => {
  const normalized = value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  return normalized === '' ? null : Number(normalized);
};
export const maskMoneyInput = (value: string, previous = '') => {
  const deletingLastCharacter = previous && value === previous.slice(0, -1);
  const cents = (deletingLastCharacter ? previous.replace(/\D/g, '').slice(0, -1) : value.replace(/\D/g, ''))
    .replace(/^0+/, '').slice(0, 14);
  return cents ? formatCurrency(Number(cents) / 100) : '';
};
export const parseMaskedMoney = (value: string) => {
  const cents = value.replace(/\D/g, '');
  return cents ? Number(cents) / 100 : null;
};
export const fileIsPdf = (name?: string, mimeType?: string) => mimeType === 'application/pdf' || !!name?.toLowerCase().endsWith('.pdf');
