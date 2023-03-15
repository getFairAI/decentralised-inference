export const formatNumbers = (value: string) => {
  try {
    return parseFloat(value).toFixed(4);
  } catch (error) {
    return '0';
  }
};