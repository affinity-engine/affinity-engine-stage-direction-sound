import Ember from 'ember';
import { registrant } from 'affinity-engine';
import { Direction, cmd } from 'affinity-engine-stage';
import multiton from 'ember-multiton-service';

const {
  assign,
  get,
  set,
  typeOf
} = Ember;

export default Direction.extend({
  config: multiton('affinity-engine/fixture-store', 'engineId'),
  fixtureStore: multiton('affinity-engine/fixture-store', 'engineId'),
  preloader: registrant('affinity-engine/preloader'),
  soundManager: registrant('affinity-engine/sound-manager'),

  _setup: cmd({ async: true }, function(fixtureOrId, options) {
    const fixtureStore = get(this, 'fixtureStore');
    const fixture = typeOf(fixtureOrId) === 'object' ? fixtureOrId : fixtureStore.find('sounds', fixtureOrId);
    const audioId = get(this, 'preloader').idFor(fixture, 'src');
    const soundManager = get(this, 'soundManager');
    const soundInstance = soundManager.findOrCreateInstance(audioId);

    this.applyFixture(fixture);
    this.configure(assign({
      audioId,
      soundInstance
    }, options));

    this.on('complete', () => {
      this.resolve();
    });
  }),

  setInstance: cmd(function(instanceId) {
    const soundManager = get(this, 'soundManager');
    const audioId = this.getConfiguration('audioId');
    const soundInstance = soundManager.findOrCreateInstance(audioId, instanceId);

    this.configure('soundInstance', soundInstance);
  }),

  setVolume: cmd(function(volume) {
    const soundInstance = this.getConfiguration('soundInstance');

    this.stopFade(soundInstance);

    soundInstance.volume = volume;
  }),

  on: cmd(function(event, callback) {
    this.getConfiguration('soundInstance').on(event, callback);
  }),

  play: cmd(function() {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.paused = false;
    soundInstance.play();
  }),

  stop: cmd(function() {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.stop();
  }),

  pause: cmd(function() {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.paused = true;
  }),

  unpause: cmd(function() {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.paused = false;
  }),

  position: cmd(function(position) {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.position = position;
  }),

  loop: cmd(function(loop = true) {
    const soundInstance = this.getConfiguration('soundInstance');
    const infiniteLoop = -1;

    soundInstance.loop = loop === true ? infiniteLoop : loop;
  }),

  mute: cmd(function() {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.muted = true;
  }),

  unmute: cmd(function() {
    const soundInstance = this.getConfiguration('soundInstance');

    soundInstance.muted = false;
  }),

  fadeTo: cmd(function(volume, duration, callback = Ember.K) {
    const soundInstance = this.getConfiguration('soundInstance');

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
    const soundInstance = this.getConfiguration('soundInstance');

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
    const soundInstance = this.getConfiguration('soundInstance');

    clearInterval(soundInstance.currentFade);
  })
});
