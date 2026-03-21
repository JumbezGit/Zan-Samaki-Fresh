import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import FishCatch

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.group_name = f'user_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'notification_message',
                'message': message
            }
        )

    async def notification_message(self, event):
        message = event['message']
        
        await self.send(text_data=json.dumps({
            'message': message
        }))

