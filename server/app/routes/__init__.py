from app.routes.auth import router as auth_router
from app.routes.preferences import router as preferences_router
from app.routes.users import router as users_router
from app.routes.cookbooks import router as cookbooks_router
from app.routes.recipes import router as recipes_router
from app.routes.planning import router as planning_router

__all__ = [
    "auth_router",
    "preferences_router",
    "users_router",
    "cookbooks_router",
    "recipes_router",
    "planning_router",
]
