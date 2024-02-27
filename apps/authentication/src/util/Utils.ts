import {InvalidRequestError} from "../error/Errors";

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const APP_STORE_CONNECT_PHONE = "+19876543210"

function formatPhoneNumber(phoneNumber: string): string {
    if(phoneNumber == APP_STORE_CONNECT_PHONE) {
        return phoneNumber
    }

    const phoneNumberParsed = phoneUtil.parseAndKeepRawInput(phoneNumber, 'US');

    if (!phoneUtil.isValidNumberForRegion(phoneNumberParsed, 'US')) {
        throw new InvalidRequestError('Invalid phone number format')
    }
    return phoneUtil.format(phoneNumberParsed, PNF.E164);
}

export {formatPhoneNumber}