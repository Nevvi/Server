'use strict'

class User {
    userId: string
    phoneNumber: string
    phoneNumberVerified: boolean
    email?: string
    emailVerified?: boolean
    name?: string
    constructor(userId: string, phoneNumber: string, phoneNumberVerified: boolean, email?: string, emailVerified?: boolean, name?: string) {
        this.userId = userId
        this.phoneNumber = phoneNumber
        this.phoneNumberVerified = phoneNumberVerified

        this.email = email
        this.emailVerified = emailVerified
        this.name = name
    }
}

export {User}