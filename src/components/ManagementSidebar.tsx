import './ManagementSidebar.css'

type ManagementSection = 'appointments' | 'dashboard' | 'calendar'

interface ManagementSidebarProps {
  activeSection: ManagementSection
  onSectionChange: (section: ManagementSection) => void
  onSidebarClose?: () => void
}

export function ManagementSidebar({ activeSection, onSectionChange, onSidebarClose }: ManagementSidebarProps) {
  const menuItems = [
    {
      id: 'appointments' as ManagementSection,
      label: 'Appuntamenti',
      icon: '📅',
      available: true
    },
    {
      id: 'dashboard' as ManagementSection,
      label: 'Dashboard',
      icon: '📊',
      available: true
    },
    {
      id: 'calendar' as ManagementSection,
      label: 'Calendario',
      icon: '🗓️',
      available: true
    }
  ]

  return (
    <div className="management-sidebar">
      <div className="sidebar-header">
        <h3>GESTIONALE</h3>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => {
              onSectionChange(item.id)
              onSidebarClose?.()
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}