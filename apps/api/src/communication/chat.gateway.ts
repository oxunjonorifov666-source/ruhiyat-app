import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { PushNotificationService } from '../push/push-notification.service';

interface AuthSocket extends Socket {
  userId?: number;
  userRole?: string;
}

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private onlineUsers = new Map<number, string>();

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly pushNotification: PushNotificationService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwt.verify(token);
      client.userId = payload.sub;
      client.userRole = payload.role;
      this.onlineUsers.set(payload.sub, client.id);
      const chats = await this.prisma.chatParticipant.findMany({
        where: { userId: payload.sub },
        select: { chatId: true },
      });
      chats.forEach((c: any) => client.join(`chat:${c.chatId}`));
      this.server.emit('userOnline', { userId: payload.sub });
      this.logger.log(`User ${payload.sub} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.onlineUsers.delete(client.userId);
      this.server.emit('userOffline', { userId: client.userId });
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  private async isParticipantOrAdmin(chatId: number, client: AuthSocket): Promise<boolean> {
    if (ADMIN_ROLES.includes(client.userRole || '')) return true;
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: client.userId! } },
    });
    return !!participant;
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { chatId: number; content: string; type?: string },
  ) {
    if (!client.userId) return;
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId: client.userId } },
    });
    if (!participant) return;

    const chat = await this.prisma.chat.findUnique({ where: { id: data.chatId } });
    if (!chat || !chat.isActive) return;

    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: client.userId,
        content: data.content,
        type: data.type || 'text',
      },
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    void this.pushNotification
      .notifyAfterChatMessage({
        chatId: data.chatId,
        senderId: client.userId,
        content: message.content,
        type: message.type,
        attachmentUrl: message.attachmentUrl,
        sender: message.sender,
      })
      .catch(() => undefined);

    this.server.to(`chat:${data.chatId}`).emit('newMessage', message);
    return message;
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { chatId: number },
  ) {
    if (!client.userId) return;
    if (!(await this.isParticipantOrAdmin(data.chatId, client))) return;
    client.to(`chat:${data.chatId}`).emit('userTyping', {
      chatId: data.chatId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { chatId: number },
  ) {
    if (!client.userId) return;
    if (!(await this.isParticipantOrAdmin(data.chatId, client))) return;
    client.to(`chat:${data.chatId}`).emit('userStopTyping', {
      chatId: data.chatId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { chatId: number },
  ) {
    if (!client.userId) return;
    if (!(await this.isParticipantOrAdmin(data.chatId, client))) return;
    const row = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId: client.userId } },
    });
    if (!row) return;
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId: data.chatId, userId: client.userId } },
      data: { lastReadAt: new Date() },
    });
    this.server.to(`chat:${data.chatId}`).emit('messagesRead', {
      chatId: data.chatId,
      readBy: client.userId,
    });
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { chatId: number },
  ) {
    if (!client.userId) return;
    if (!(await this.isParticipantOrAdmin(data.chatId, client))) return;
    client.join(`chat:${data.chatId}`);
  }

  emitToUser(userId: number, event: string, data: any) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers.keys());
  }
}
