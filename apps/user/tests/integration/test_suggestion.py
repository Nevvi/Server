from tests.integration.integration_test import IntegrationTest


class TestSuggestionIntegration(IntegrationTest):

    def test_refresh_suggestions_not_enough_overlap(self):
        test_user_one = self.create_user()
        test_user_two = self.create_user()
        test_user_three = self.create_user()

        """
        Me <-> User One
        Me <-> User Two
        User One <-> User Three
        """
        self.create_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id)
        self.create_connection(user_id=test_user_two.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_two.id)

        self.create_connection(user_id=test_user_one.id, connected_user_id=test_user_three.id)
        self.create_connection(user_id=test_user_three.id, connected_user_id=test_user_one.id)

        self.suggestion_service.refresh_suggestions(user_id=self.user.id)

        # User three only has one mutual connection so they shouldn't be suggested
        suggestions = self.suggestion_service.get_suggested_users(user_id=self.user.id)
        assert len(suggestions) == 0

    def test_refresh_suggestions_with_enough_overlap(self):
        test_user_one = self.create_user()
        test_user_two = self.create_user()
        test_user_three = self.create_user()
        test_user_four = self.create_user()

        """
        Me <-> User One
        Me <-> User Two
        Me <-> User Three
        User One <-> User Four
        User Two <-> User Four
        User Three <-> User Four
        """
        self.create_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id)
        self.create_connection(user_id=test_user_two.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_two.id)
        self.create_connection(user_id=test_user_three.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_three.id)

        self.create_connection(user_id=test_user_one.id, connected_user_id=test_user_four.id)
        self.create_connection(user_id=test_user_four.id, connected_user_id=test_user_one.id)
        self.create_connection(user_id=test_user_two.id, connected_user_id=test_user_four.id)
        self.create_connection(user_id=test_user_four.id, connected_user_id=test_user_two.id)
        self.create_connection(user_id=test_user_three.id, connected_user_id=test_user_four.id)
        self.create_connection(user_id=test_user_four.id, connected_user_id=test_user_three.id)

        self.suggestion_service.refresh_suggestions(user_id=self.user.id)

        # User one and two (our connections) are also connected to user three. User three should be suggested now
        suggestions = self.suggestion_service.get_suggested_users(user_id=self.user.id)
        assert len(suggestions) == 1
        assert suggestions[0].id == test_user_four.id

    def test_refresh_suggestions_with_enough_overlap_already_requested(self):
        test_user_one = self.create_user()
        test_user_two = self.create_user()
        test_user_three = self.create_user()

        """
        Me <-> User One
        Me <-> User Two
        User One <-> User Three
        User Two <-> User Three
        """
        self.create_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id)
        self.create_connection(user_id=test_user_two.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_two.id)

        self.create_connection(user_id=test_user_one.id, connected_user_id=test_user_three.id)
        self.create_connection(user_id=test_user_three.id, connected_user_id=test_user_one.id)
        self.create_connection(user_id=test_user_two.id, connected_user_id=test_user_three.id)
        self.create_connection(user_id=test_user_three.id, connected_user_id=test_user_two.id)

        self.create_connection_request(user=self.user, connected_user_id=test_user_three.id)

        self.suggestion_service.refresh_suggestions(user_id=self.user.id)

        # User one and two (our connections) are also connected to user three. User three should be suggested now,
        # but we already requested that user so filter them out
        suggestions = self.suggestion_service.get_suggested_users(user_id=self.user.id)
        assert len(suggestions) == 0
