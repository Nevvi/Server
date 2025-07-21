from dataclasses import dataclass

from model.document import ConnectionDocument
from model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME
from model.user.address import AddressView
from model.user.user import UserView
from model.view import View


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
    def from_connected_user(user: UserView, permission_group_name: str):
        permission_group = next((pg for pg in user.permissionGroups if pg.name == permission_group_name), None)

        show_all_fields = permission_group is None or permission_group_name == DEFAULT_ALL_PERMISSION_GROUP_NAME

        def can_show_field(field: str) -> bool:
            return show_all_fields or field in permission_group.fields

        email = user.email if user.email and user.emailConfirmed and can_show_field("email") else None
        phone_number = user.phoneNumber if can_show_field("phoneNumber") else None
        address = user.address if can_show_field("address") else None
        mailing_address = user.mailingAddress if can_show_field("mailingAddress") else None
        birthday = user.birthday if can_show_field("birthday") else None

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
            permissionGroup=permission_group_name
        )
