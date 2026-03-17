const database = require('./config');
con = database();

module.exports = {
  query: async function (sqlQuery) {
    try {
      const getData = await new Promise((resolve, reject) => {
        if (!sqlQuery || typeof sqlQuery === 'undefined')
          reject(`Validation Error sql Query Not Defines.\n sqlQuery is RequiiredFields`);
        con.query(sqlQuery, function (err, result, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      return getData;
    } catch (error) {
      console.log('\n=-=-=-=-=-=-=-\nSQLHandlerError\n\n', error, '\nSQLHandlerError\n=-=-=-=-=-=-=-\n');
      throw new Error(error);
    }
  },
  sqlQuery: async function sqlQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      try {
        // Execute the query
        connection.query(query, params, (error, results) => {
          if (error) {
            console.error('SQL Query Error:', error.message);
            return reject(error);
          }
          resolve(results);
        });
      } catch (error) {
        console.error('Unexpected Error:', error.message);
        reject(error);
      }
    });
  }
};
