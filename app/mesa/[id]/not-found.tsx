import { EmptyState } from "@/components/ui/empty-state";
import { DinerShell, ScrollBody } from "@/components/ui/page-shell";

export default function NotFound() {
  return (
    <DinerShell>
      <ScrollBody>
        <EmptyState
          title="No encontramos esa mesa"
          description="Revisa el código e inténtalo de nuevo."
        />
      </ScrollBody>
    </DinerShell>
  );
}
