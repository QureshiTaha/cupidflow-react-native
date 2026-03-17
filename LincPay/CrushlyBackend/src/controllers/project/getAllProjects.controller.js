const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;

      const _page = page ? page : 1;
      const _limit = limit ? limit : 10;
      const _search = search ? search : '';

      const projects = await sqlQuery(
        `SELECT * FROM db_projects WHERE name LIKE '%${_search}%' LIMIT ${_limit} OFFSET ${(_page - 1) * _limit}`
      );

      if (projects.length === 0) {
        res.status(400).json({ success: false, message: 'Projects not found' });
      } else {
        res.status(200).json({ success: true, message: 'Projects found successfully!', data: projects });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Editing project StackTrace: ${error}` });
    }
  };
};
