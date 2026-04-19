import { Global, Module } from '@nestjs/common';
import { SecurityObservabilityService } from './security-observability.service';
import { SecurityAnomalyTrackerService } from './security-anomaly-tracker.service';

@Global()
@Module({
  providers: [SecurityObservabilityService, SecurityAnomalyTrackerService],
  exports: [SecurityObservabilityService, SecurityAnomalyTrackerService],
})
export class ObservabilityModule {}
