const express = require("express");
const { testController } =  require('../controllers');



const{
    testingController
} = testController()

    const router = express.Router();
    router.route("/").get( testingController );
    

module.exports = router;
