import { useState, useEffect } from 'react';
import './PWAInstallButton.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <button
      className="pwa-install-btn"
      onClick={handleInstallClick}
      title="Installa l'app"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 9H15L13 7H9L7 9H3C1.9 9 1 9.9 1 11V19C1 20.1 1.9 21 3 21H19C20.1 21 21 20.1 21 19V11C21 9.9 20.1 9 19 9ZM19 19H3V11H5.83L7.83 9H14.17L16.17 11H19V19Z" fill="currentColor"/>
        <path d="M12 17L16 13H13V5H11V13H8L12 17Z" fill="currentColor"/>
      </svg>
      INSTALLA APP
    </button>
  );
}