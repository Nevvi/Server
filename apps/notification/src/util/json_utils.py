import re


def snake_to_camel(snake_str, preserved_keys: list):
    if snake_str in preserved_keys:
        return snake_str

    """Converts a snake_case string to camelCase."""
    components = [component for component in snake_str.split('_') if len(component)]
    # Capitalize each component after the first, then join
    return components[0] + ''.join(x.title() for x in components[1:])


def convert_keys_to_camelcase(obj, preserved_keys=None):
    """Recursively converts keys in a dictionary or list to camelCase."""
    preserved_keys = preserved_keys if preserved_keys is not None else []
    if isinstance(obj, dict):
        return {snake_to_camel(k, preserved_keys): convert_keys_to_camelcase(v, preserved_keys) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys_to_camelcase(elem, preserved_keys) for elem in obj]
    else:
        return obj


def camel_to_snake(name):
    """Converts a camelCase string to snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def convert_keys_to_snake_case(data):
    """
    Recursively converts all string keys in a dictionary (and nested structures)
    from camelCase to snake_case.
    """
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            new_key = camel_to_snake(key)
            new_dict[new_key] = convert_keys_to_snake_case(value)
        return new_dict
    elif isinstance(data, list):
        return [convert_keys_to_snake_case(item) for item in data]
    else:
        return data
