const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;

module.exports = (dependencies) => {
    return async (req, res) => {
        try {
            const { reelID, isArchive } = req.params;
            if (!reelID || !isArchive) {
                res.status(400).json({
                    status: false,
                    msg: 'reelID, isArchive is Required'
                });
                return
            }

            const result = await sqlQuery(`UPDATE db_reels SET isArchive = '${isArchive}' WHERE db_reels.reelId = '${reelID}'`);
            const reel = await sqlQuery(`select * FROM db_reels WHERE db_reels.reelId = '${reelID}'`);
            if (result.affectedRows > 0) {
                res.status(200).json({
                    status: true,
                    msg: `Successfully ${isArchive == 1 ? 'archived' : 'unarchived'} Reels'}`,
                    data: reel.length > 0 ? reel[0] : null
                });
            } else {
                res.status(400).json({
                    status: false,
                    msg: `Error while ${isArchive == 1 ? 'archiving' : 'unarchiving'} Reels'}`,
                    data: result
                });
            }

        } catch (error) {
            console.error('Error archiving reel:', error);
            res.status(500).json({ success: false, message: `Error while archiving reel StackTrace: ${error}` });
        }
    }
}