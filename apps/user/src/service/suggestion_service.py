from typing import List

from src.model.user.user import SlimUserView
from src.dao.connection_dao import ConnectionDao
from src.dao.connection_request_dao import ConnectionRequestDao
from src.dao.refresh_suggestions_dao import RefreshSuggestionsDao
from src.dao.suggestions_dao import SuggestionsDao
from src.dao.user_dao import UserDao


class SuggestionService:
    def __init__(self):
        self.user_dao = UserDao()
        self.connection_dao = ConnectionDao()
        self.connection_request_dao = ConnectionRequestDao()
        self.suggestions_dao = SuggestionsDao()
        self.refresh_suggestions_dao = RefreshSuggestionsDao()

    def get_suggested_users(self, user_id: str) -> List[SlimUserView]:
        suggestions = self.suggestions_dao.get_suggestions(user_id=user_id)
        return [SlimUserView.from_suggested_user(s) for s in suggestions]

    def remove_suggestion(self, user_id: str, suggested_user_id: str):
        self.suggestions_dao.remove_suggestions(user_id=user_id, suggested_user_id=suggested_user_id)
        self.__try_refresh_suggestions(user_id=user_id)

    def ignore_suggestion(self, user_id: str, suggested_user_id: str):
        self.suggestions_dao.ignore_suggestions(user_id=user_id, suggested_user_id=suggested_user_id)
        self.__try_refresh_suggestions(user_id=user_id)

    def refresh_all_suggestions(self):
        page = 0
        size = 1000

        while True:
            users = self.user_dao.get_users(skip=page * size, limit=size)
            if not len(users):
                break

            for user in users:
                self.refresh_suggestions_dao.send_refresh_suggestions_request(user_id=user.get("_id"))

            page = page + 1

    def refresh_suggestions(self, user_id: str):
        possible_suggestions = self.suggestions_dao.find_possible_suggestions(user_id=user_id)
        print(f"{len(possible_suggestions)} possible suggestions for user {user_id}")
        valid_suggestions = [s for s in possible_suggestions if user_id not in s.blockedUsers]

        relevant_suggestions = []
        for suggestion in valid_suggestions:
            sent_request = self.connection_request_dao.get_connection_request(requesting_user_id=user_id,
                                                                              requested_user_id=suggestion.id)
            received_request = self.connection_request_dao.get_connection_request(requesting_user_id=suggestion.id,
                                                                                  requested_user_id=user_id)
            if not sent_request and not received_request:
                relevant_suggestions.append(suggestion)

        # Only insert the top 10 suggestions
        final_suggestions = [s.id for s in relevant_suggestions][:10]
        self.suggestions_dao.update_suggestions(user_id=user_id, suggestions=final_suggestions)

    def __try_refresh_suggestions(self, user_id: str):
        suggestions = self.get_suggested_users(user_id=user_id)
        if not len(suggestions):
            self.refresh_suggestions_dao.send_refresh_suggestions_request(user_id=user_id)
