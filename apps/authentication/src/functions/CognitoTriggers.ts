'use strict'

import {Callback, Context, Handler} from "aws-lambda";

export const preSignUp: Handler = (event: any, context: Context, callback: Callback<any>) => {
    event.response.autoConfirmUser=true;
    callback(null, event);
};
