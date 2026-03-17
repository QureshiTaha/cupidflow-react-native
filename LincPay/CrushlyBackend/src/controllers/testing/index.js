const testingController = require("./test.controller")
module.exports=(dependencies)=>{
    return{
        testingController:testingController(dependencies)
    }
}