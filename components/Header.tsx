import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Top bar: the logo (full wordmark on desktop, icon on mobile) followed by page-specific controls. */
export default function Header({ children, className }: HeaderProps) {
  return (
    <header className={cn('header', className)}>
      <Link href="/" className="md:flex-1" aria-label="LiveDocs home">
        <Image src="/assets/icons/logo.svg" alt="" width={120} height={32} className="hidden md:block" />
        <Image src="/assets/icons/logo-icon.svg" alt="" width={32} height={32} className="mr-2 md:hidden" />
      </Link>
      {children}
    </header>
  );
}
