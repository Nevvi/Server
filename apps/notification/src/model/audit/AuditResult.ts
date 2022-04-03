'use strict'

enum AuditResult {
    SUCCESS = "Successfully processed",
    NO_MATCHING_USER = "No matching user",
    NO_MATCHING_GROUP = "No matching group",
    DUPLICATE = "Duplicate message received"
}

export {AuditResult}