(function(){
  // Audio do popup de recompensa
  var audioSrc = '0402.mp3';
  var modalSound = new Audio(audioSrc);
  modalSound.preload = 'auto';
  modalSound.load();

  function playSound() {
    try {
      modalSound.currentTime = 0;
      var p = modalSound.play();
      if (p && typeof p.then === 'function') {
        p.catch(function(err){
          if (window.console && console.warn) console.warn('reaction-sound: play failed', err);
        });
      }
    } catch (e) {
      if (window.console && console.warn) console.warn('reaction-sound: error playing sound', e);
    }
  }

  // Observa quando o modal de recompensa aparece (classe .show)
  var rewardModal = document.getElementById('rewardModal');
  if (rewardModal) {
    var obs = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        if (m.attributeName === 'class') {
          if (rewardModal.classList.contains('show')) {
            playSound();
          }
        }
      });
    });
    obs.observe(rewardModal, { attributes: true });
  }

})();
