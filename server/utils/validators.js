export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 8;
};

export const checkRequiredFields = (fields, body) => {
  const missing = [];
  for (const field of fields) {
    const val = body[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
};
