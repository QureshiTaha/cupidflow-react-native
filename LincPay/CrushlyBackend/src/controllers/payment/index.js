
const callBackHandler = require('./callBackHandler');
const payoutCallBackHandler = require('./payoutCallBackHandler');
const paymentInitiate = require('./paymentInitiate');
const payoutInitiate = require('./payoutInitiate');
module.exports = (dependencies) => {
    return {
        callBackHandler: callBackHandler(dependencies),
        paymentInitiate: paymentInitiate(dependencies),
        payoutInitiate: payoutInitiate(dependencies),
        payoutCallBackHandler: payoutCallBackHandler(dependencies),
    }
}