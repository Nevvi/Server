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

    getCommand() {
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
}

export {UserResponse, Command}