import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { UserMenu } from '~/components/auth/UserMenu';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center justify-between px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      {/* Left: Logo + Sidebar Button */}
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <div className="p-1 hover:bg-bolt-elements-background-depth-2 rounded-md transition-colors">
          <div className="i-ph:sidebar-simple-duotone text-xl" />
        </div>
        <a href="/" className="text-2xl font-semibold text-accent flex items-center cursor-pointer">
          <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
      </div>

      {/* Center: Chat Description (only when chat started) */}
      {chat.started && (
        <div className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </div>
      )}

      {/* Right: Action Buttons + User Menu */}
      <div className="flex items-center gap-2">
        {chat.started && (
          <ClientOnly>
            {() => <HeaderActionButtons chatStarted={chat.started} />}
          </ClientOnly>
        )}
        <ClientOnly>
          {() => <UserMenu />}
        </ClientOnly>
      </div>
    </header>
  );
}
