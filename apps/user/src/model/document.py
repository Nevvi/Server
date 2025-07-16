from dataclasses import dataclass
from typing import Mapping, Optional

from util.json_utils import convert_keys_to_camelcase, convert_keys_to_snake_case


@dataclass
class Document:
    create_date: str
    create_by: str
    update_date: str
    update_by: str

    @classmethod
    def from_dict(cls, obj: Mapping[str, any]):
        converted = convert_keys_to_snake_case(obj)
        return cls(**converted)

    def to_dict(self) -> Mapping[str, any]:
        return convert_keys_to_camelcase(self.__dict__, preserved_keys=["_id"])
