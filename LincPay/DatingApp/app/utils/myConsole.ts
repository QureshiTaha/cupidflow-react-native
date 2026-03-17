export const myConsole = (key: string, value?: any) => {
  if (value === undefined) {
    console.log(key);
    return;
  }

  const type = typeof value;
  console.log(key, type === 'string' ? value : JSON.stringify(value, null, 2));
};
