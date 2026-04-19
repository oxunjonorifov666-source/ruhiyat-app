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
  tokenExp?: number;
}

@WebSocketGateway({
  cors: { 
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
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
      let token: string | undefined;

      /**
       * Umumiy `/chat` namespace: mobil ilova (`ruhiyat_at` — @ruhiyat/config) va superadmin panel
       * (`ruhiyat_sa_at`) bir xil JWT_SECRET bilan imzolangan access tokenlarni HttpOnly cookie orqali yuboradi.
       * Imkoniyat (rol) payload.sub / DB `user.role` dan keladi — cookie nomi privilege bermaydi.
       * Faqat ushbu ikki nom qabul qilinadi (Authorization: Bearer yoki `auth.token` ishlatilmaydi).
       */
      if (client.handshake.headers.cookie) {
        const match = client.handshake.headers.cookie.match(/(?:^|;)\s*(ruhiyat_sa_at|ruhiyat_at)=([^;]+)/);
        if (match) token = match[2];
      }

      if (!token) {
        this.logger.warn(`Connection rejected: strict HttpOnly cookie required but missing.`);
        client.disconnect();
        return;
      }
      
      const payload = this.jwt.verify(token);
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        this.logger.warn(`Connection rejected: user ${payload.sub} inactive.`);
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.userRole = user.role;
      client.tokenExp = payload.exp;
      this.onlineUsers.set(user.id, client.id);
      
      const chats = await this.prisma.chatParticipant.findMany({
        where: { userId: user.id },
        select: { chatId: true },
      });
      chats.forEach((c: any) => client.join(`chat:${c.chatId}`));
      this.server.emit('userOnline', { userId: user.id });
      this.logger.log(`User ${user.id} connected securely`);
    } catch (e) {
      this.logger.error(`Connection failed: auth error`, e);
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

  private validateSession(client: AuthSocket): boolean {
    if (!client.userId || !client.tokenExp) return false;
    if (Date.now() / 1000 >= client.tokenExp) {
      this.logger.warn(`Disconnecting ${client.userId}: token expired.`);
      client.disconnect();
      return false;
    }
    return true;
  }

  private async checkSocketScope(chatId: number, client: AuthSocket): Promise<boolean> {
    if (!this.validateSession(client)) return false;
    
    const user = await this.prisma.user.findUnique({
      where: { id: client.userId },
      select: { isActive: true, role: true }
    });
    
    if (!user?.isActive) {
      client.disconnect();
      return false;
    }

    if (user.role === 'SUPERADMIN') return true;
    
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: client.userId! } },
    });

    if (!participant) {
      this.logger.warn(`Unauthorized scope interception blocked for user ${client.userId} on chat ${chatId}.`);
      return false;
    }

    return true;
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { chatId: number; content: string; type?: string },
  ) {
    if (!client.userId) return;
    if (!(await this.checkSocketScope(data.chatId, client))) return;

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
    if (!(await this.checkSocketScope(data.chatId, client))) return;
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
    if (!(await this.checkSocketScope(data.chatId, client))) return;
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
    if (!(await this.checkSocketScope(data.chatId, client))) return;
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
    if (!(await this.checkSocketScope(data.chatId, client))) return;
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
