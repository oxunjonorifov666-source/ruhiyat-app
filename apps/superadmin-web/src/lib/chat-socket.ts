import { io, type Socket } from 'socket.io-client'
import { fetchSocketAccessToken } from './auth'

let socket: Socket | null = null
let connectInflight: Promise<Socket | null> | null = null

async function connectOnce(): Promise<Socket | null> {
  const token = await fetchSocketAccessToken()
  if (!token) return null

  if (socket?.connected) return socket

  socket = io('/chat', {
    path: '/api/socket.io',
    transports: ['websocket'],
    auth: { token },
  })

  return socket
}

export function getChatSocket(): Promise<Socket | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (socket?.connected) return Promise.resolve(socket)
  if (!connectInflight) {
    connectInflight = connectOnce().finally(() => {
      connectInflight = null
    })
  }
  return connectInflight
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
