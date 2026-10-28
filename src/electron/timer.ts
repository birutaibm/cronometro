interface System {
  getMainWindow(): void;
  alert(text: string): void;
}

export class Timer {
  private remainingSeconds = 0;
  private totalTime = 0;
  private timerFinishAt = 0;
  private timerStartTime = 0;

  constructor(private readonly system: System) {
  }
}