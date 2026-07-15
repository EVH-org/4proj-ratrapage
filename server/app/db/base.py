from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    # on pourrait y coller un TimestampMixin si on refacto les modeles un jour
    pass