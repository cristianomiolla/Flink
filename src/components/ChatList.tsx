import './ChatList.css'
import { Avatar } from './Avatar'

interface ChatListProps {
  chats: Array<{
    id: string
    participant: {
      name: string
      avatar?: string | null
    }
    lastMessage: string
    timestamp: string
    unreadCount: number
  }>
  selectedChatId: string | null
  onChatSelect: (chatId: string) => void
  onRequestDeleteChat: (chat: { id: string; participant: { name: string } }) => void
  showOnMobile?: boolean
}

export function ChatList({ chats, selectedChatId, onChatSelect, onRequestDeleteChat, showOnMobile = true }: ChatListProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 48) {
      return 'Ieri'
    } else {
      return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, chat: { id: string; participant: { name: string } }) => {
    e.stopPropagation()
    onRequestDeleteChat(chat)
  }

  return (
    <div className={`chat-list ${showOnMobile ? 'mobile-visible' : ''}`}>
      <div className="chat-list-header">
        <h2 className="chat-list-title">MESSAGGI</h2>
        <span className="chat-count">{chats.length} conversazioni</span>
      </div>
      
      <div className="chat-list-items">
        {chats.length === 0 ? (
          <div className="empty-chat-list">
            <div className="empty-chat-icon">💬</div>
            <p className="empty-chat-text">Nessuna conversazione ancora</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="chat-avatar">
                <Avatar
                  src={chat.participant.avatar}
                  name={chat.participant.name}
                  alt={`Avatar di ${chat.participant.name}`}
                  size="sm"
                  variant="default"
                />
              </div>
              
              <div className="chat-content">
                <div className="chat-header">
                  <h3 className="chat-participant-name">
                    {chat.participant.name}
                  </h3>
                  <div className="chat-header-actions">
                    <span className="chat-timestamp">
                      {formatTimestamp(chat.timestamp)}
                    </span>
                    <button
                      className="chat-delete-btn"
                      onClick={(e) => handleDeleteClick(e, { id: chat.id, participant: { name: chat.participant.name } })}
                      title="Elimina conversazione"
                      aria-label="Elimina conversazione"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="chat-preview">
                  <p className="chat-last-message">
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="chat-unread-count">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}