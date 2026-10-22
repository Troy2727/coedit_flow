'use client';

import { useInboxNotifications, useUnreadInboxNotificationsCount } from '@liveblocks/react/suspense';
import { InboxNotification, InboxNotificationList, LiveblocksUiConfig } from '@liveblocks/react-ui';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** Bell icon with a dot for unread notifications; opens the unread list. */
export default function Notifications() {
  const { inboxNotifications } = useInboxNotifications();
  const { count } = useUnreadInboxNotificationsCount();
  const unread = inboxNotifications.filter((n) => !n.readAt);

  return (
    <Popover>
      <PopoverTrigger
        className="relative flex size-10 items-center justify-center rounded-lg"
        aria-label={count ? `Notifications (${count} unread)` : 'Notifications'}
      >
        <Bell className="size-6 text-white" />
        {count > 0 && <span className="absolute right-2 top-2 z-20 size-2 rounded-full bg-blue-500" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="shad-popover">
        <LiveblocksUiConfig overrides={{ INBOX_NOTIFICATION_TEXT_MENTION: (user) => <>{user} mentioned you.</> }}>
          <InboxNotificationList>
            {unread.length === 0 && <p className="py-2 text-center text-dark-500">No new notifications</p>}
            {unread.map((notification) => (
              <InboxNotification
                key={notification.id}
                inboxNotification={notification}
                href={`/documents/${notification.roomId}`}
                className="bg-dark-200 text-white"
                showActions={false}
                kinds={{
                  thread: (props) => <InboxNotification.Thread {...props} showActions={false} showRoomName={false} />,
                  textMention: (props) => <InboxNotification.TextMention {...props} showRoomName={false} />,
                  // Sent by updateDocumentAccess when someone shares a document with you.
                  $documentAccess: (props) => {
                    const { title, avatar } = props.inboxNotification.activities[0].data;
                    return (
                      <InboxNotification.Custom
                        {...props}
                        title={title as string}
                        aside={
                          <InboxNotification.Icon className="bg-transparent">
                            <Image src={(avatar as string) || ''} alt="" width={36} height={36} className="rounded-full" />
                          </InboxNotification.Icon>
                        }
                      >
                        {props.children}
                      </InboxNotification.Custom>
                    );
                  },
                }}
              />
            ))}
          </InboxNotificationList>
        </LiveblocksUiConfig>
      </PopoverContent>
    </Popover>
  );
}
