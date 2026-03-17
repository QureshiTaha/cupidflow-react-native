const followUserController = require('./followUser.controller');
const getFollowingListController = require('./getFollowingList.controller');
const getFollowersListController = require('./getFollowersList.controller');
const unfollowController = require('./unfollowController');
const checkFollowController = require('./checkFollow.controller');

module.exports = (dependencies) => {
  return {
    followUserController: followUserController(dependencies),
    getFollowingListController: getFollowingListController(dependencies),
    getFollowersListController: getFollowersListController(dependencies),
    unfollowController: unfollowController(dependencies),
    checkFollowController: checkFollowController(dependencies),
  };
};
