'use strict'

class User {
    userId: string
    email: string
    emailVerified: boolean
    phoneNumber?: string
    phoneNumberVerified?: boolean
    name?: string
    constructor(userId: string, email: string, emailVerified: boolean, phoneNumber?: string, phoneNumberVerified?: boolean, name?: string) {
        this.userId = userId
        this.email = email
        this.emailVerified = emailVerified
        this.phoneNumber = phoneNumber
        this.phoneNumberVerified = phoneNumberVerified
        this.name = name
    }
}

export {User}