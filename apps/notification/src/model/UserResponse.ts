'use strict'

enum Command {
    HELP,
    STOP,
    UNSTOP,
    LIST,
    SEND,
    SUBSCRIBE,
    UNSUBSCRIBE,
    UNKNOWN
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
        if (keyword === 'STOP') return Command.STOP
        if (keyword === 'UNSTOP') return Command.UNSTOP
        if (keyword === 'LIST') return Command.LIST
        if (keyword === 'SEND') return Command.SEND
        if (keyword === 'SUBSCRIBE') return Command.SUBSCRIBE
        if (keyword === 'UNSUBSCRIBE') return Command.UNSUBSCRIBE

        return Command.UNKNOWN
    }

    getGroupCode(): number | undefined {
        if (!this.message) return undefined

        const parts = this.message.trim().toUpperCase().split(" ")

        // first part should be the command
        if (parts.length < 2) return undefined

        // group code should always follow the command
        const code = parseInt(parts[1])
        if (isNaN(code)) return undefined

        return code
    }
}

export {UserResponse, Command}