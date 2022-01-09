'use strict'

import {AuthenticationResultType, SignUpResponse} from "aws-sdk/clients/cognitoidentityserviceprovider";

class LoginResponse {
    private id: string;
    private accessToken?: string;
    private idToken?: string;
    private refreshToken?: string;
    constructor(id: string, authResult: AuthenticationResultType) {
        this.id = id;
        this.accessToken = authResult.AccessToken;
        this.idToken = authResult.IdToken;
        this.refreshToken = authResult.RefreshToken;

    }
}

class ConfirmResponse {

}

class LogoutResponse {

}

class RegisterResponse {
    private id: string;
    private isConfirmed: boolean;
    private codeDeliveryDestination?: string;
    private codeDeliveryMedium?: string;
    private codeDeliveryAttribute?: string;

    constructor(signupResponse: SignUpResponse) {
        this.id = signupResponse.UserSub;
        this.isConfirmed = signupResponse.UserConfirmed;
        this.codeDeliveryDestination = signupResponse.CodeDeliveryDetails?.Destination;
        this.codeDeliveryMedium = signupResponse.CodeDeliveryDetails?.DeliveryMedium;
        this.codeDeliveryAttribute = signupResponse.CodeDeliveryDetails?.AttributeName;
    }

}

export {LoginResponse, LogoutResponse, RegisterResponse, ConfirmResponse}