import * as Calendar from 'expo-calendar';

export async function addPsychologySessionToCalendar(opts: {
  title: string;
  start: Date;
  end: Date;
  notes?: string;
}): Promise<string> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Kalendarga yozish uchun ruxsat berilmadi.');
  }

  let calId: string | null = null;
  const def = await Calendar.getDefaultCalendarAsync();
  if (def?.id) {
    calId = def.id;
  } else {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const primary = cals.find((c) => c.allowsModifications) ?? cals[0];
    if (!primary?.id) {
      throw new Error('Faol kalendar topilmadi.');
    }
    calId = primary.id;
  }

  const eventId = await Calendar.createEventAsync(calId, {
    title: opts.title,
    startDate: opts.start,
    endDate: opts.end,
    notes: opts.notes,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return eventId;
}
