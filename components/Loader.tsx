import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="loader" role="status">
      <Loader2 className="size-8 animate-spin" aria-hidden />
      Loading...
    </div>
  );
}
