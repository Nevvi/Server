'use strict'

class Address {
    street: string
    unit: string
    city: string
    state: string
    zipCode: string
    constructor(body: object) {
        // @ts-ignore
        const {street, unit, city, state, zipCode} = body;

        // data fields
        this.street = street
        this.unit = unit
        this.city = city
        this.state = state
        this.zipCode = zipCode ? zipCode.toString() : null
    }
}

export {Address}