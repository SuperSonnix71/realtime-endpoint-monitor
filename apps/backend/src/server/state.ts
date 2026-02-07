let schedulerRunning = false;

export function setSchedulerRunning(isRunning: boolean): void {
  schedulerRunning = isRunning;
}

export function schedulerStatus(): 'running' | 'stopped' {
  return schedulerRunning ? 'running' : 'stopped';
}
