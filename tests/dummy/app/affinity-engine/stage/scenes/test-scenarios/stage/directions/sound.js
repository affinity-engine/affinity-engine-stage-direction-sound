import { Scene, step } from 'affinity-engine-stage';
import { task, timeout } from 'ember-concurrency';

export default Scene.extend({
  name: 'Sound Direction Test',

  start: task(function * (script) {
    script.sound('robot').play();
  })
});
