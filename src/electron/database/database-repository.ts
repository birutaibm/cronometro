import knex from 'knex';

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
    const finishAtStr = finishAt.toISOString();

    const [id] = await this.dbInstance('sessions').insert({
      title,
      hours,
      minutes,
      seconds,
      finish_at: finishAtStr,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return { id: Number(id) };
  }

  async getSessions(): Promise<Array<Record<string, unknown>>> {
    return this.dbInstance('sessions').select('*').orderBy('created_at', 'desc');
  }
}

export { DatabaseRepository };
