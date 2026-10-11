from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """En JSON los campos van en camelCase (como en la web); en Python, en snake_case."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)
