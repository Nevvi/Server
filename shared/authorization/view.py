import json

from authorization.json_utils import convert_keys_to_camelcase


class View:
    def __str__(self):
        return json.dumps(convert_keys_to_camelcase(self.__dict__))
