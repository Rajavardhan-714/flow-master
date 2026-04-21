import { simulator } from "./simulator";
import { signalController } from "./signalController";
import { startPredictor, recordDensity } from "./predictor";
import { bus } from "./eventBus";

let booted = false;

export function bootBackend() {
  if (booted) return;
  booted = true;

  // Wire detection -> signal density + predictor buffer
  bus.subscribe((msg) => {
    if (msg.type === "detection_result") {
      signalController.setDensity(msg.detection.lane, msg.detection.density_score);
      recordDensity(msg.detection.lane, msg.detection.density_score);
    }
  });

  simulator.setScenario("normal");
  simulator.start();
  signalController.start();
  startPredictor();
}
