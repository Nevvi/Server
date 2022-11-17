'use strict'

class Address {
    street: string
    city: string
    state: string
    zipCode: number
    constructor(body: object) {
        // @ts-ignore
        const {street, city, state, zipCode} = body;

        // data fields
        this.street = street
        this.city = city
        this.state = state
        this.zipCode = zipCode
    }
}

export {Address}