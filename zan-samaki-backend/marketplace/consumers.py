import json
from django.utils import timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Auction
from .serializers import AuctionSerializer

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


class AuctionConsumer(AsyncWebsocketConsumer):
    group_name = 'auctions_live'

    async def connect(self):
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        await self.send_current_snapshot()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data or '{}')
        if text_data_json.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def auction_snapshot(self, event):
        await self.send(text_data=json.dumps({
            'type': 'auction_snapshot',
            'auctions': event['auctions']
        }))

    async def send_current_snapshot(self):
        auctions = await self.get_open_auctions()
        await self.send(text_data=json.dumps({
            'type': 'auction_snapshot',
            'auctions': auctions
        }))

    @database_sync_to_async
    def get_open_auctions(self):
        snapshot_time = timezone.now()
        queryset = Auction.objects.select_related(
            'catch',
            'seller',
            'highest_bidder'
        ).prefetch_related('bids__buyer').filter(status='open').order_by('-created_at')
        return AuctionSerializer(queryset, many=True, context={'snapshot_time': snapshot_time}).data

