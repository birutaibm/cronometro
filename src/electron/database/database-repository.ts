import knex from 'knex';

function validateDuration(hours: number, minutes: number, seconds: number): void {
  if (hours < 0) {
    throw new Error('Hours must be >= 0');
  }
  if (minutes < 0 || minutes > 59) {
    throw new Error('Minutes must be between 0 and 59');
  }
  if (seconds < 0 || seconds > 59) {
    throw new Error('Seconds must be between 0 and 59');
  }
}

function toUtcString(date: Date): string {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '');
}

class DatabaseRepository {
  constructor(private readonly dbInstance: ReturnType<typeof knex>) {}

  async createSession(data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
    finishAt: Date;
  }): Promise<{ id: number }> {
    const { title, hours, minutes, seconds, finishAt } = data;

    validateDuration(hours, minutes, seconds);

    const [id] = await this.dbInstance('timers').insert({
      title,
      hours,
      minutes,
      seconds,
      finish_at: toUtcString(finishAt),
      created_at: toUtcString(new Date()),
      updated_at: toUtcString(new Date()),
    });

    return { id: Number(id) };
  }

  async getSessions(): Promise<Array<Record<string, unknown>>> {
    return this.dbInstance('timers').select('*').orderBy('created_at', 'desc');
  }
}

export { DatabaseRepository };
