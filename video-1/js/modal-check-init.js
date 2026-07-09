(function(){
  'use strict';

  // Utility: play video from start and show it
  function playVideoFromStart(vid, mcEl){
    try{
      vid.pause();
      vid.currentTime = 0;
    }catch(e){}
    try{ vid.style.visibility = 'visible'; }catch(e){}
    try{ console && console.debug && console.debug('modal-check-init: playVideoFromStart', vid && vid.id); }catch(e){}
    var p = vid.play();
    if (p && typeof p.then === 'function') {
      p.then(function(){ if(mcEl) mcEl.classList.add('animate'); }).catch(function(){ if(mcEl) mcEl.classList.add('animate'); });
    } else {
      if (mcEl) mcEl.classList.add('animate');
    }
  }

  // Utility: stop and reset video
  function stopAndResetVideo(vid){
    try{ vid.pause(); vid.currentTime = 0; vid.style.visibility = 'hidden'; }catch(e){}
    try{ console && console.debug && console.debug('modal-check-init: stopAndResetVideo', vid && vid.id); }catch(e){}
  }

  // Initialize a single modal element's check animation behavior
  function initModalCheck(modal){
    if (!modal) { try{ console && console.warn && console.warn('modal-check-init: initModalCheck called with null modal'); }catch(e){}; return; }
    var mc = modal.querySelector('.modal-check');
    if (!mc) { try{ console && console.warn && console.warn('modal-check-init: modal has no .modal-check child', modal); }catch(e){}; return; }
    try{ console && console.debug && console.debug('modal-check-init: initModalCheck for', modal.id || modal); }catch(e){}

    var lottieContainer = mc.querySelector('.lottie-container') || mc.querySelector('#lottie-check');
    var video = mc.querySelector('video');
    var lottieAnim = null;

    // Handler when modal gets shown (class .show added)
    function handleShow(){
      try{ console && console.debug && console.debug('modal-check-init: handleShow triggered for', modal.id || modal); }catch(e){}
      // Ensure the modal-check reveal class is added early so CSS transitions make the container visible
      try{ if (mc) mc.classList.add('animate'); }catch(e){}
      // Prefer Lottie via fetching the JSON and using animationData
      if (lottieContainer) {
        try{ console && console.debug && console.debug('modal-check-init: fetching animation JSON from scripts/check.json'); }catch(e){}
        // try fetch
        fetch('scripts/check.json').then(function(res){
          try{ console && console.debug && console.debug('modal-check-init: fetch response', res && res.status); }catch(e){}
          if (!res.ok) throw new Error('no-json');
          return res.json();
        }).then(function(animData){
          try{ console && console.debug && console.debug('modal-check-init: animationData received'); }catch(e){}
          if (typeof lottie !== 'undefined'){
            try{
              // clear container
              try{ lottieContainer.innerHTML = ''; }catch(e){}
              lottieAnim = lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                animationData: animData,
                rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
              });
              // small instrumentation + ensure animation becomes visible when ready
              try{ console && console.debug && console.debug('modal-check-init: lottie animation created', lottieAnim); }catch(e){}
              // give the renderer a tick to inject svg elements, then play; a slightly larger delay helps
              setTimeout(function(){
                try{ lottieAnim.goToAndPlay(0, true); }catch(e){ try{ lottieAnim.play(); }catch(e){} }
                // log basic svg info for debugging
                try{
                  var svgEl = lottieContainer.querySelector('svg');
                  console && console.debug && console.debug('modal-check-init: svg present?', !!svgEl, svgEl && svgEl.children.length, 'outerHTML-snippet', svgEl && (svgEl.innerHTML||'').slice(0,200));
                }catch(e){}
              }, 80);
              // safety check: if the svg was injected but stays visually faint, force visibility after a short timeout
              setTimeout(function(){
                try{
                  var svgEl2 = lottieContainer.querySelector('svg');
                  if (svgEl2){
                    var comp = window.getComputedStyle(svgEl2);
                    var op = parseFloat(comp.opacity || '1');
                    if (op < 0.25){
                      console && console.warn && console.warn('modal-check-init: svg appears faint (opacity=' + op + '), forcing visibility');
                      try{ svgEl2.style.opacity = 1; }catch(e){}
                    }
                  }
                }catch(e){}
              }, 300);
            }catch(err){
              // fallback to video
              try{ console && console.warn && console.warn('modal-check-init: lottie.loadAnimation failed, falling back to video', err); }catch(e){}
              if (video) playVideoFromStart(video, mc);
              else if (mc) mc.classList.add('animate');
            }
          } else {
            try{ console && console.debug && console.debug('modal-check-init: lottie not available, fallback to video'); }catch(e){}
            if (video) playVideoFromStart(video, mc);
            else if (mc) mc.classList.add('animate');
          }
        }).catch(function(){
          // fetch failed (likely file://) - fallback to video
          try{ console && console.warn && console.warn('modal-check-init: fetch check.json failed, using video fallback'); }catch(e){}
          if (video) playVideoFromStart(video, mc);
          else if (mc) mc.classList.add('animate');
        });
      } else {
        // no lottie container, just play video if present
        try{ console && console.debug && console.debug('modal-check-init: no lottieContainer found, using video or animate class'); }catch(e){}
        if (video) playVideoFromStart(video, mc);
        else if (mc) mc.classList.add('animate');
      }
    }

    // Handler when modal hides
    function handleHide(){
      if (lottieAnim){
        try{ lottieAnim.stop(); lottieAnim.goToAndStop(0,true); }catch(e){}
        lottieAnim = null;
      }
      if (video) stopAndResetVideo(video);
      if (mc) mc.classList.remove('animate');
    }

    // Observe class changes on modal to detect .show add/remove
    var obs = new MutationObserver(function(muts){
      muts.forEach(function(m){
        if (m.attributeName === 'class'){
          var cls = modal.className || '';
          try{ console && console.debug && console.debug('modal-check-init: mutation observed, class now=', cls); }catch(e){}
          if (cls.indexOf('show') !== -1){
            handleShow();
          } else {
            handleHide();
          }
        }
      });
    });
    obs.observe(modal, { attributes: true });

    // Also expose a manual trigger if modal already has .show on init
    if (modal.classList.contains('show')) handleShow();

    // Wire close button to hide modal (and reset)
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn){
      closeBtn.addEventListener('click', function(){
        modal.classList.remove('show');
        // handleHide will be called by observer
      });
    }
  }

  // Initialize all modals on DOMContentLoaded
  function initAll(){
    var modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(function(modal){ initModalCheck(modal); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
