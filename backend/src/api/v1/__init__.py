# DO NOT import modules this way as it creates circular imports:
# from src.api.v1 import export

# Instead, directly expose the routers from each module:
from src.api.v1.chats import router as chats_router
from src.api.v1.audio import router as audio_router

# Create the export.py file first, then uncomment this line:
# from src.api.v1.export import router as export_router

# You can also add a list of available routers if that's needed:
# available_routers = [chats_router, audio_router, export_router]