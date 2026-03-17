const loginController = require('./login.controller');
const signupController = require('./signup.controller');
const logoutController = require('./logout.controller');
const editUserController = require('./editUser.controller');
const getAllUsersController = require('./getAllUsers.controller');
const getUserByUserEmailController = require('./getUserByUserEmail.controller.js');
const getUserByUserPhoneController = require('./getUserByUserPhone.controller');
const changePasswordController = require('./changePassword.controller.js');
const deleteUsersController = require('./deleteUsers.controller');
const getUserByUserIdController = require('./getUserByUserId.controller');
const forgotPasswordController = require('./forgotPassword.controller');
const verifyOtpController = require('./verifyOtp.controller');
const resetPasswordController = require('./resetPassword.controller');
const googleCallbackController = require('./googleCallback.controller');
const googleApiAuthController = require('./googleApiAuth.controller.js');
const googleAuthController = require('./googleAuth.controller.js');


module.exports = (dependencies) => {
  return {
    loginController: loginController(dependencies),
    signupController: signupController(dependencies),
    logoutController: logoutController(dependencies),
    editUserController: editUserController(dependencies),
    getAllUsersController: getAllUsersController(dependencies),
    getUserByUserEmailController: getUserByUserEmailController(dependencies),
    getUserByUserPhoneController: getUserByUserPhoneController(dependencies),
    changePasswordController: changePasswordController(dependencies),
    deleteUsersController: deleteUsersController(dependencies),
    getUserByUserIdController: getUserByUserIdController(dependencies),
    forgotPasswordController: forgotPasswordController(dependencies),
    verifyOtpController: verifyOtpController(dependencies),
    resetPasswordController: resetPasswordController(dependencies),
    googleCallbackController: googleCallbackController(dependencies),
    googleApiAuthController: googleApiAuthController(dependencies),
    googleAuthController: googleAuthController(dependencies),
  };
};
