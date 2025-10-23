from dataclasses import dataclass

from src.model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME
from src.model.document import ConnectionDocument
from src.model.user.address import AddressView
from src.model.user.user import UserView
from shared.authorization.view import View


@dataclass
class ConnectionView(View):
    userId: str
    permissionGroupName: str
    inSync: bool

    @staticmethod
    def from_doc(doc: ConnectionDocument):
        return ConnectionView(
            userId=doc.get("userId"),
            permissionGroupName=doc.get("permissionGroupName"),
            inSync=doc.get("inSync")
        )


@dataclass
class UserConnectionView(View):
    id: str
    firstName: str
    lastName: str
    bio: str
    email: str
    phoneNumber: str
    address: AddressView
    mailingAddress: AddressView
    profileImage: str
    birthday: str
    permissionGroup: str

    @staticmethod
    def from_connected_user(user: UserView, connection_to_me: ConnectionDocument,
                            connection_to_them: ConnectionDocument):
        # Only show the user data that I have access to, dictated by what permission group the other user has set for me
        my_permission_group_name = connection_to_me.get("permissionGroupName")
        permission_group = next((pg for pg in user.permissionGroups if pg.name == my_permission_group_name), None)
        show_all_fields = permission_group is None or my_permission_group_name == DEFAULT_ALL_PERMISSION_GROUP_NAME

        def can_show_field(field: str) -> bool:
            return show_all_fields or field in permission_group.fields

        email = user.email if user.email and user.emailConfirmed and can_show_field("email") else None
        phone_number = user.phoneNumber if can_show_field("phoneNumber") else None
        address = user.address if can_show_field("address") else None
        mailing_address = user.mailingAddress if can_show_field("mailingAddress") else None
        birthday = user.birthday if can_show_field("birthday") else None

        # We still want to return our configured permission group for the other user so that it can be updated
        their_permission_group_name = connection_to_them.get("permissionGroupName")
        return UserConnectionView(
            id=user.id,
            firstName=user.firstName,
            lastName=user.lastName,
            bio=user.bio,
            profileImage=user.profileImage,
            email=email,
            phoneNumber=phone_number,
            address=address,
            mailingAddress=mailing_address,
            birthday=birthday,
            permissionGroup=their_permission_group_name
        )
