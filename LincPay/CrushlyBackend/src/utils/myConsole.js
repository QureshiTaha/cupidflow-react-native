function myConsole(key, value) {
  let type = typeof value;
  return type === 'string'
    ? console.log(key, value)
    : console.log(key, JSON.stringify(value, null, 2));
}

module.exports = { myConsole };
