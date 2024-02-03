'use strict'

const DEFAULT_FIELDS = ["id", "firstName", "lastName", "bio", "profileImage"]

class PermissionGroup {
    name: string;
    private fields: string[];
    constructor(body: object) {
        // @ts-ignore
        const {name, fields} = body;
        this.name = name
        this.fields = fields
    }

    getFields(): string[] {
        return this.fields.concat(DEFAULT_FIELDS)
    }
}

export {PermissionGroup}