'use strict'

import {SuggestionsDao} from "../dao/SuggestionsDao";
import {RefreshSuggestionsDao} from "../dao/RefreshSuggestionsDao";
import {SlimUser} from "../model/user/SlimUser";
import {UserDao} from "../dao/UserDao";
import {ConnectionDao} from "../dao/ConnectionDao";

class SuggestionService {
    private userDao: UserDao;
    private connectionDao: ConnectionDao;
    private suggestionsDao: SuggestionsDao;
    private refreshSuggestionsDao: RefreshSuggestionsDao;
    constructor() {
        this.userDao = new UserDao()
        this.connectionDao = new ConnectionDao()
        this.suggestionsDao = new SuggestionsDao()
        this.refreshSuggestionsDao = new RefreshSuggestionsDao()
    }

    async getSuggestedUsers(userId: string): Promise<SlimUser[]> {
        return await this.suggestionsDao.getSuggestions(userId)
    }

    async removeSuggestion(userId: string, suggestedUserId: string) {
        await this.suggestionsDao.removeSuggestion(userId, suggestedUserId)
        await this.tryRefreshEmptySuggestions(userId)
    }

    async ignoreSuggestion(userId: string, suggestedUserId: string) {
        await this.suggestionsDao.ignoreSuggestion(userId, suggestedUserId)
        await this.tryRefreshEmptySuggestions(userId)
    }


    async refreshAllSuggestions() {
        let page = 0
        const pageSize = 1000

        while(true) {
            const users = await this.userDao.getUsers(page * pageSize, pageSize)
            if (users.length === 0) {
                console.log("No more users to refresh")
                return
            }
            console.log(`Refreshing ${users.length} user suggestions`)
            await Promise.all(users.map(user => {
                return this.refreshSuggestionsDao.sendRefreshSuggestionsRequest(user.id)
            }))
            page++
        }
    }

    async refreshSuggestions(userId: string) {
        console.log(`Refreshing suggestions for user ${userId}`)
        // Get all possible suggestions
        const possibleSuggestions = await this.suggestionsDao.findPossibleSuggestions(userId)

        // check if userId is blocked
        const validSuggestions = possibleSuggestions.filter(suggestion => {
            return !suggestion.blockedUsers.includes(userId)
        })

        // check if request already exists between the userId and the suggestions
        const relevantSuggestions = []
        for(let suggestion of validSuggestions) {
            const [sentRequest, receivedRequest] = await Promise.all([
                this.connectionDao.getConnectionRequest(userId, suggestion.id),
                this.connectionDao.getConnectionRequest(suggestion.id, userId)
            ])

            if(sentRequest == null && receivedRequest == null) {
                relevantSuggestions.push(suggestion)
            }
        }

        // filter to top 10 and insert into the db
        const finalSuggestions = relevantSuggestions.slice(0, 10).map(suggestion => suggestion.id)
        console.log(`Setting ${finalSuggestions.length} suggestions for user ${userId}`)
        await this.suggestionsDao.updateSuggestions(userId, finalSuggestions)
    }

    private async tryRefreshEmptySuggestions(userId: string) {
        const currentSuggestions = await this.getSuggestedUsers(userId)
        if(currentSuggestions.length == 0) {
            await this.refreshSuggestionsDao.sendRefreshSuggestionsRequest(userId)
        }
    }
}

export {SuggestionService}