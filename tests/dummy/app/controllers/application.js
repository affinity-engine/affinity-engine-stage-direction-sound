import Ember from 'ember';

const { Controller } = Ember;

export default Controller.extend({
  config: {
  },
  fixtures: {
    sounds: [{
      id: 'robot',
      src: '/music/Robot Brain A.mp3'
    }, {
      id: 'solace',
      src: '/music/Solace in Imaginary Places.mp3'
    }]
  }
});
