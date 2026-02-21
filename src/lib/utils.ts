export const formatUGX = (amount: number): string => `UGX ${amount.toLocaleString('en-UG')}`;

export const normalizePhoneNumber = (phone: string): string => {
  let normalized = phone.replace(/\s+/g, '');
  if (normalized.startsWith('+256')) normalized = `0${normalized.substring(4)}`;
  if (normalized.startsWith('256')) normalized = `0${normalized.substring(3)}`;
  return normalized;
};

export const maskPhoneNumber = (phone: string): string => {
  if (phone.length === 10) return `${phone.substring(0, 4)} XXX XXX`;
  return phone;
};

export const formatDate = (date: Date): string => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

export const isOwner = (email: string) => email === 'william@boss.com';
