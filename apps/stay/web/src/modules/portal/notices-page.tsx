import { EmptyState, Tag } from '@itclabs/react-ui';
import { usePortalNotices } from '@stay/sdk/react';
import { isoDateInTimeZone } from '@stay/shared';
import { displayDate } from '@/libraries/format';
import { ContactLinks, PortalQuery, PortalSection } from './portal-ui';

const dateOf = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

/** T-10 `/p/notices`: announcements (pinned first), house rules and the contact phone. */
export default function PortalNoticesPage() {
  const notices = usePortalNotices();

  return (
    <>
      <h1 className="text-heading font-bold">Thông báo và nội quy</h1>
      <PortalQuery query={notices}>
        {(data) => (
          <>
            <PortalSection title="Thông báo" testId="portal-notices">
              {data.announcements.length === 0 ? (
                <EmptyState title="Chưa có thông báo" />
              ) : (
                <ul className="grid gap-4">
                  {data.announcements.map((notice) => (
                    <li key={notice.id} className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold break-words">{notice.title}</p>
                        {notice.pinned ? (
                          <Tag tone="info" size="sm">
                            Ghim
                          </Tag>
                        ) : null}
                      </div>
                      <p className="text-ui-sm text-muted">{dateOf(notice.createdAt)}</p>
                      <p className="whitespace-pre-wrap break-words">{notice.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </PortalSection>
            <PortalSection title={`Nội quy ${data.buildingName}`}>
              {data.rulesText ? (
                <p className="whitespace-pre-wrap break-words">{data.rulesText}</p>
              ) : (
                <p className="text-muted">Toà chưa có nội quy.</p>
              )}
            </PortalSection>
            <PortalSection title="Liên hệ chủ trọ">
              <ContactLinks phone={data.contactPhone} />
            </PortalSection>
          </>
        )}
      </PortalQuery>
    </>
  );
}
