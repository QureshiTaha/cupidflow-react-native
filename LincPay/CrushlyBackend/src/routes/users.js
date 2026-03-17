const express = require('express');
const { userController, testController } = require('../controllers');
const { verifyToken, isAdmin } = require('../Modules/authJwt');
const refreshToken = require('../Modules/refreshToken');
const payoutController = require('../controllers/users/userPayoutDetails.controllers');
const {
  loginController,
  signupController,
  logoutController,
  editUserController,
  getAllUsersController,
  getUserByUserEmailController,
  getUserByUserPhoneController,
  changePasswordController,
  deleteUsersController,
  getUserByUserIdController,
  forgotPasswordController,
  verifyOtpController,
  resetPasswordController,
  googleCallbackController,
  googleApiAuthController,
  googleAuthController
} = userController();

const { testingController } = testController();
const { addPayoutDetails, updatePayoutDetails,getPayoutDetails } = payoutController();

const router = express.Router();
router.route('/').get(testingController);
router.route('/:userID').delete(isAdmin, deleteUsersController);
router.route('/change-password').post(changePasswordController);
router.route('/refresh-token').post(refreshToken);
router.route('/login').post(loginController);
router.route('/signup').post(signupController);
router.route('/logout').delete(logoutController);
router.route('/allUsers').get(verifyToken, getAllUsersController);
router.route('/getUserByEmail/:userEmail').get(getUserByUserEmailController);
router.route('/getUserByPhone/:userPhone').get(getUserByUserPhoneController);
router.route('/update-user').post(editUserController);
router.route('/test').get(testingController);
router.route('/by-userID/:userID').get(getUserByUserIdController);
router.route('/forgot-password').post(forgotPasswordController);
router.route('/verify-otp').post(verifyOtpController);
router.route('/reset-password').post(resetPasswordController);
router.route('/google-callback').get(googleCallbackController);
router.route('/auth/google').get(googleAuthController);
router.route('/google-login').post(googleApiAuthController); //api/auth/google
router.route('/details/payout/:userID').get(getPayoutDetails);
router.route('/details/payout').post(addPayoutDetails);
router.route('/details/payout').put(updatePayoutDetails);



module.exports = router;
