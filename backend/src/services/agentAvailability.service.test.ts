import { describe, expect, it } from 'vitest';
import { AgentAvailabilityService } from './agentAvailability.service';

describe('AgentAvailabilityService.isAvailableForRoutingNow', () => {
  it('allows routing during enabled Asia/Manila weekly schedule hours', () => {
    const sched = AgentAvailabilityService.createDefaultSchedule('agent-1', 'available');
    const wedMorningManila = new Date('2026-11-25T10:30:00+08:00');
    expect(AgentAvailabilityService.isAvailableForRoutingNow(sched, 2, wedMorningManila)).toEqual({
      available: true,
    });
  });

  it('blocks routing outside enabled Asia/Manila weekly schedule hours or on disabled Sunday', () => {
    const sched = AgentAvailabilityService.createDefaultSchedule('agent-1', 'available');
    const wedLateNight = new Date('2026-11-25T21:15:00+08:00');
    const sundayNoon = new Date('2026-11-29T12:00:00+08:00');

    expect(AgentAvailabilityService.isAvailableForRoutingNow(sched, 0, wedLateNight)).toEqual({
      available: false,
      reason: 'OUTSIDE_SCHEDULE',
    });
    expect(AgentAvailabilityService.isAvailableForRoutingNow(sched, 0, sundayNoon)).toEqual({
      available: false,
      reason: 'OUTSIDE_SCHEDULE',
    });
  });
});
