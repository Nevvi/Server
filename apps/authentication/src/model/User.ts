'use strict'

class User {
    private userId: string
    private email: string
    private emailVerified: boolean
    private phone: string
    private phoneVerified: boolean
    private name?: string
    constructor(userId: string, email: string, emailVerified: boolean, phone: string, phoneVerified: boolean, name?: string) {
        this.userId = userId
        this.email = email
        this.emailVerified = emailVerified
        this.phone = phone
        this.phoneVerified = phoneVerified
        this.name = name
    }
}

export {User}