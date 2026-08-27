import { listActivities } from "@/app/activities/actions";
import { ActivityList } from "@/components/activity-list";

export const metadata = { title: "Aktivitäten — ActivitySlot" };

export default async function ActivitiesPage() {
  const activities = await listActivities();
  return <ActivityList activities={activities} />;
}
