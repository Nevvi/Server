'use strict'

enum Command {
    HELP= "HELP",
    LIST = "LIST",
    INFO = "INFO",
    SEND = "SEND",
    DELETE = "DELETE",
    SUBSCRIBE = "SUBSCRIBE",
    UNSUBSCRIBE = "UNSUBSCRIBE",
    UNKNOWN = "UNKNOWN"
}

class UserResponse {
    originatingNumber: string;
    message: string;
    constructor(originatingNumber: string, message: string) {
        this.originatingNumber = originatingNumber
        this.message = message
    }

    getCommand(): Command {
        if (!this.message) return Command.UNKNOWN

        const keyword = this.message.trim().toUpperCase().split(" ")[0]
        if (keyword === 'HELP') return Command.HELP
        if (keyword === 'INFO') return Command.INFO
        if (keyword === 'LIST') return Command.LIST
        if (keyword === 'SEND') return Command.SEND
        if (keyword === 'DELETE') return Command.DELETE
        if (keyword === 'SUBSCRIBE') return Command.SUBSCRIBE
        if (keyword === 'UNSUBSCRIBE') return Command.UNSUBSCRIBE

        return Command.UNKNOWN
    }

    getGroupId(): string | undefined {
        if (!this.message) return undefined

        const parts = this.message.trim().toUpperCase().split(" ")

        // first part should be the command
        if (parts.length < 2) return undefined

        // group code should always follow the command
        return parts[1]
    }

    getMessageText(): string | undefined {
        if (!this.message) return undefined

        const parts = this.message.trim().split(" ")

        // first part should be the command
        if (parts.length < 3) return undefined

        return parts.slice(2).filter(p => p.trim() !== "").map(p => p.trim()).join(" ")
    }
}

export {UserResponse, Command}