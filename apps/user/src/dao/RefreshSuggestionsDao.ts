'use strict'

import {SQS} from "aws-sdk";

const AWS = require("aws-sdk")

class RefreshSuggestionsDao {
    private sqs: SQS
    private readonly refreshSuggestionsQueueUrl: string

    constructor() {
        this.sqs = new AWS.SQS()
        // @ts-ignore
        this.refreshSuggestionsQueueUrl = process.env.REFRESH_SUGGESTIONS_QUEUE_URL
    }

    async sendRefreshSuggestionsRequest(userId: string) {
        const data = { userId }

        await this.sqs.sendMessage({
            QueueUrl: this.refreshSuggestionsQueueUrl,
            MessageBody: JSON.stringify(data)
        }).promise()
    }
}

export {RefreshSuggestionsDao}