import knex from 'knex';

export interface TimerConfigRow {
  id: number;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  created_at: string;
  updated_at: string;
}

export interface TimerExecutionRow {
  id: number;
  configuration_id: number;
  finish_at: string;
  status: 'RUNNING' | 'FINISHED' | 'CANCELLED';
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimerExecutionWithConfig extends TimerExecutionRow {
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
}

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

  async createConfiguration(data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  }): Promise<{ id: number }> {
    const { title, hours, minutes, seconds } = data;

    validateDuration(hours, minutes, seconds);

    const [id] = await this.dbInstance('timer_configurations').insert({
      title,
      hours,
      minutes,
      seconds,
      created_at: toUtcString(new Date()),
      updated_at: toUtcString(new Date()),
    });

    return { id: Number(id) };
  }

  async getConfigurations(): Promise<TimerConfigRow[]> {
    return this.dbInstance('timer_configurations')
      .select('*')
      .orderBy('created_at', 'desc') as Promise<TimerConfigRow[]>;
  }

  async getConfigurationById(id: number): Promise<TimerConfigRow | null> {
    const row = await this.dbInstance('timer_configurations').where({ id }).first();
    return row ? (row as TimerConfigRow) : null;
  }

  async createExecution(data: {
    configurationId: number;
    finishAt: Date;
    status: 'RUNNING' | 'FINISHED' | 'CANCELLED';
  }): Promise<{ id: number }> {
    const { configurationId, finishAt, status } = data;

    const [id] = await this.dbInstance('timer_executions').insert({
      configuration_id: configurationId,
      finish_at: toUtcString(finishAt),
      status,
      cancelled_at: null,
      created_at: toUtcString(new Date()),
      updated_at: toUtcString(new Date()),
    });

    return { id: Number(id) };
  }

  async getExecutionById(id: number): Promise<TimerExecutionWithConfig | null> {
    const row = await this.dbInstance('timer_executions as te')
      .select(
        'te.id',
        'te.configuration_id',
        'te.finish_at',
        'te.status',
        'te.cancelled_at',
        'te.created_at',
        'te.updated_at',
        'tc.title',
        'tc.hours',
        'tc.minutes',
        'tc.seconds'
      )
      .join('timer_configurations as tc', 'tc.id', 'te.configuration_id')
      .where('te.id', id)
      .first();
    return row ? (row as TimerExecutionWithConfig) : null;
  }

  async updateExecutionStatus(
    id: number,
    status: 'RUNNING' | 'FINISHED' | 'CANCELLED',
    cancelledAt?: Date
  ): Promise<void> {
    const data: Record<string, unknown> = {
      status,
      updated_at: toUtcString(new Date()),
    };
    if (cancelledAt) {
      data['cancelled_at'] = toUtcString(cancelledAt);
    }
    await this.dbInstance('timer_executions').where({ id }).update(data);
  }

  async getExecutions(): Promise<TimerExecutionWithConfig[]> {
    return this.dbInstance('timer_executions as te')
      .select(
        'te.id',
        'te.configuration_id',
        'te.finish_at',
        'te.status',
        'te.cancelled_at',
        'te.created_at',
        'te.updated_at',
        'tc.title',
        'tc.hours',
        'tc.minutes',
        'tc.seconds'
      )
      .join('timer_configurations as tc', 'tc.id', 'te.configuration_id')
      .orderBy('te.created_at', 'desc') as Promise<TimerExecutionWithConfig[]>;
  }
}

export { DatabaseRepository };
