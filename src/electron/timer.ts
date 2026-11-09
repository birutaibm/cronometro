import { BrowserWindow } from 'electron';

interface System {
  getMainWindow(): BrowserWindow | null;
  alert(text: string): void;
}

export class Timer {
  private remainingSeconds = 0;
  private totalTime = 0;
  private timerFinishAt = 0;
  private timerStartTime = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private onFinishedCallback: (() => void | Promise<void>) | null = null;

  constructor(
    private readonly system: System,
    onFinishedCallback?: () => void | Promise<void>
  ) {
    this.onFinishedCallback = onFinishedCallback ?? null;
  }

  start(hours: number, minutes: number, seconds: number, title: string): number {
    this.totalTime = hours * 3600 + minutes * 60 + seconds;
    this.remainingSeconds = this.totalTime;
    this.timerStartTime = Date.now();
    this.timerFinishAt = this.timerStartTime + this.totalTime * 1000;

    this.clear();

    this.timerInterval = setInterval(async () => {
      const elapsed = Date.now() - this.timerStartTime;
      this.remainingSeconds = Math.max(0, this.totalTime - Math.floor(elapsed / 1000));
      this.system.getMainWindow()?.webContents.send('timer:tick', {
        remainingSeconds: this.remainingSeconds,
      });
      if (this.remainingSeconds <= 0) {
        this.clear();
        this.system.getMainWindow()?.webContents.send('timer:finished');
        this.system.alert(title);
        try {
          await this.onFinishedCallback?.();
        } catch (err) {
          console.error('Erro ao notificar finalização do timer:', err);
        }
      }
    }, 1000);

    return this.timerFinishAt;
  }

  cancel(): void {
    this.clear();
  }

  isStopped(): boolean {
    return this.timerInterval === null;
  }

  getTotalTime(): number {
    return this.totalTime;
  }

  private clear(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
