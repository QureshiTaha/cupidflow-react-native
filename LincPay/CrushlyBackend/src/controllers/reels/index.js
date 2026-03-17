const addReelsController = require('./addReels.controller');
const archiveReelsController = require('./archiveReels.controller');
const getReelsByUserIDController = require('./getReelsByUserID.controller');
const getAllReelsController = require('./getAllReels.controller');
const deleteReelController = require('./deleteReel.controller');
const likeReelController = require('./likeReel.controller');
const dislikeReelController = require('./dislikeReel.controller');
const addCommentsController = require('./addComments.controller');
const deleteCommentsController = require('./deleteComments.controller');
const interactionStatusController = require('./InteractionStatus.controller');
const getAllCommentsController = require('./getAllComments.controller');
const editCommentsController = require('./editComments.controller');


module.exports = (dependencies) => {
  return {
    addReelsController: addReelsController(dependencies),
    archiveReelsController: archiveReelsController(dependencies),
    getReelsByUserIDController: getReelsByUserIDController(dependencies),
    getAllReelsController: getAllReelsController(dependencies),
    deleteReelController: deleteReelController(dependencies),
    likeReelController: likeReelController(dependencies),
    dislikeReelController: dislikeReelController(dependencies),
    addCommentsController: addCommentsController(dependencies),
    deleteCommentsController: deleteCommentsController(dependencies),
    interactionStatusController: interactionStatusController(dependencies),
    getAllCommentsController: getAllCommentsController(dependencies),
    editCommentsController: editCommentsController(dependencies),
  };
};
