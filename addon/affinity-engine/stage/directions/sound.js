import Ember from 'ember';
import { registrant } from 'affinity-engine';
import { Direction, cmd } from 'affinity-engine-stage';
import multiton from 'ember-multiton-service';

const {
  get,
  set,
  typeOf
} = Ember;

export default Direction.extend({
  config: multiton('affinity-engine/fixture-store', 'engineId'),
  fixtureStore: multiton('affinity-engine/fixture-store', 'engineId'),
  preloader: registrant('affinity-engine/preloader'),
  soundManager: registrant('affinity-engine/sound-manager'),

  _setup: cmd({ async: true }, function(fixtureOrId) {
    const fixtureStore = get(this, 'fixtureStore');
    const fixture = typeOf(fixtureOrId) === 'object' ? fixtureOrId : fixtureStore.find('sounds', fixtureOrId);
    const audioId = get(this, 'preloader').idFor(fixture, 'src');
    const soundManager = get(this, 'soundManager');
    const soundInstance = soundManager.findOrCreateInstance(audioId);

    set(this, 'attrs.audioId', audioId);
    set(this, 'attrs.soundInstance', soundInstance);

    this.on('complete', () => {
      this.resolve();
    });
  }),

  instance: cmd(function(instanceId) {
    const soundManager = get(this, 'soundManager');
    const audioId = get(this, 'attrs.audioId');
    const soundInstance = soundManager.findOrCreateInstance(audioId, instanceId);

    set(this, 'attrs.soundInstance', soundInstance);
  }),

  on: cmd(function(event, callback) {
    get(this, 'attrs.soundInstance').on(event, callback);
  }),

  play: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.paused = false;
    soundInstance.play();
  }),

  stop: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.stop();
  }),

  pause: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.paused = true;
  }),

  unpause: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.paused = false;
  }),

  position: cmd(function(position) {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.position = position;
  }),

  loop: cmd(function(loop = true) {
    const soundInstance = get(this, 'attrs.soundInstance');
    const infiniteLoop = -1;

    soundInstance.loop = loop === true ? infiniteLoop : loop;
  }),

  mute: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.muted = true;
  }),

  unmute: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.muted = false;
  }),

  volume: cmd(function(volume) {
    const soundInstance = get(this, 'attrs.soundInstance');

    this.stopFade(soundInstance);

    soundInstance.volume = volume;
  }),

  fadeTo: cmd(function(volume, duration, callback = Ember.K) {
    const soundInstance = get(this, 'attrs.soundInstance');

    this.stopFade(soundInstance);

    const fromVolume = soundInstance.volume;
    const toVolume = volume;
    const volumeDistance = toVolume - fromVolume;

    const interval = 10;
    const fadeDuration = duration || 1000;
    const stepSize = volumeDistance / (fadeDuration / interval);

    soundInstance.currentFade = setInterval(() => {
      soundInstance.volume += stepSize;

      if (soundInstance.volume >= 1) {
        this.stopFade(soundInstance);

        return callback();
      }
    }, interval);
  }),

  fadeIn: cmd(function(volume = 1, duration) {
    const soundInstance = get(this, 'attrs.soundInstance');

    soundInstance.volume = 0;

    this.fadeTo(volume, duration);
    this.play();
  }),

  fadeOut: cmd(function(duration) {
    this.fadeTo(0, duration, () => {
      this.stop();
    });
  }),

  stopFade: cmd(function() {
    const soundInstance = get(this, 'attrs.soundInstance');

    clearInterval(soundInstance.currentFade);
  })
});
