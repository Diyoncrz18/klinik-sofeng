import type { DoctorDesignPageId } from "./doctorDesignRouting";

import DoctorDesignPage from "./DoctorDesignPage";

export default function DoctorDesignRoutePage({
  pageId,
}: {
  pageId: DoctorDesignPageId;
}) {
  return <DoctorDesignPage initialPageId={pageId} />;
}
