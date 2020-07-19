'use strict'

module.exports.preSignUp = (event, context, callback) => {
    event.response.autoConfirmUser=true;
    callback(null, event);
};
