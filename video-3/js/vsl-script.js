(function(){
  "use strict";
  function onReady(fn){
    if(document.readyState==="loading"){
      document.addEventListener("DOMContentLoaded",fn,{once:true});
    } else {
      setTimeout(fn,0);
    }
  }
  onReady(initAll);
  function initAll(){
    var walletKey="vsl_wallet_amount";
    var MODAL_CREDIT=53.17;
    var MAX_BALANCE=213.99;
    var PAGE_TARGETS={vsl1:0,vsl2:53.17,vsl3:124.65,withdraw:213.99,final:213.99};
    var PAGE_TARGETS_PREV={vsl1:0,vsl2:0,vsl3:53.17,withdraw:124.65,final:213.99};
    function readWallet(){
      try{return parseFloat(sessionStorage.getItem(walletKey)||"0")||0;}catch(e){return 0;}
    }
    function writeWallet(value){
      try{
        var clamped=Math.max(0,Math.min(MAX_BALANCE,Number(value)||0));
        sessionStorage.setItem(walletKey,clamped.toFixed(2));
        renderWallet(clamped);
      }catch(e){}
    }
    function renderWallet(value){
      try{
        var v=(typeof value==="number")?value:readWallet();
        var el=document.getElementById("walletAmount");
        if(el)el.textContent="US$ "+v.toFixed(2);
      }catch(e){}
    }
    function animateWalletDisplay(fromVal,toVal,duration){
      duration=duration||700;
      var el=document.getElementById("walletAmount");
      if(!el)return Promise.resolve();
      var start=performance.now();
      return new Promise(function(resolve){
        function frame(now){
          var elapsed=now-start;
          var t=Math.min(1,Math.max(0,elapsed/duration));
          var ease=1-Math.pow(1-t,3);
          var current=fromVal+(toVal-fromVal)*ease;
          el.textContent="US$ "+current.toFixed(2);
          if(t<1)requestAnimationFrame(frame);
          else{el.textContent="US$ "+toVal.toFixed(2);resolve();}
        }
        requestAnimationFrame(frame);
      });
    }
    async function autoCreditAndAnimateIfNeeded(){
      try{
        var PAGE_ID=window.PAGE_ID||(window.location.pathname.replace(/^.*\//,"")||"vsl1");
        var target=PAGE_TARGETS[PAGE_ID];
        if(typeof target==="undefined"){renderWallet();return;}
        var fromVal = PAGE_TARGETS_PREV[PAGE_ID] || 0;
        writeWallet(fromVal); // define saldo inicial
        await animateWalletDisplay(fromVal,target,700);
        writeWallet(target);

      }catch(e){}
    }
    function showRewardModal(amount){
      try{
        var rewardModal=document.getElementById("rewardModal");
        if(!rewardModal)return;
        var modalAmountBox=rewardModal.querySelector(".amount-box");
        var modalCheck=rewardModal.querySelector(".modal-check");
        // NOTE: do not modify modalAmountBox contents here — text is controlled by static HTML
        var PAGE_ID=window.PAGE_ID||(window.location.pathname.replace(/^.*\//,"")||"vsl1");
        rewardModal.classList.add("show");
        rewardModal.setAttribute("aria-hidden","false");
        if(modalCheck){
          modalCheck.classList.remove("animate");
          void modalCheck.offsetWidth;
          modalCheck.classList.add("animate");
          // if there's a canvas inside modalCheck, animate it
          try{
            var canvas = modalCheck.querySelector('canvas.success-canvas');
            if(canvas){
              try{ animateSuccessCanvas(canvas); }catch(e){}
            }
          }catch(e){}
        }
        var NEXT_PAGE=window.NEXT_PAGE||null;
        setTimeout(function(){
          if(NEXT_PAGE){
            try{window.location.href=NEXT_PAGE;}catch(e){}
          } else {
            rewardModal.classList.remove("show");
            rewardModal.setAttribute("aria-hidden","true");
          }
        },1300);
      }catch(e){}
    }

    // Draw animated ring + check into a canvas element (sizes expect 168x168)
    function animateSuccessCanvas(canvas){
      if(!canvas || !canvas.getContext) return;
      var ctx = canvas.getContext('2d');

      // make canvas crisp on HiDPI screens by resizing backing store
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var displayW = Math.max(1, rect.width || canvas.width);
      var displayH = Math.max(1, rect.height || canvas.height);
      canvas.width = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      // scale drawing so coordinates use CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var w = displayW;
      var h = displayH;
      // center and radius (a little smaller to give margin for the check)
      var cx = w/2, cy = h/2, r = Math.min(w,h)*0.40;
      var ringDuration = 420; // ms
      var innerDelay = 320; // ms after start
      var innerDuration = 220; // ms
      var checkDelay = 420; // ms
      var checkDuration = 480; // ms
      var start = performance.now();

  // prepare check path points (based on SVG coords scaled to 168)
  var scale = w/64;
  // shift the check slightly upward so the short leg overlaps/extends past the ring (like reference)
  var yOffset = -4 * scale;
  var p1 = {x:20*scale, y:34*scale + yOffset};
  var p2 = {x:28*scale, y:42*scale + yOffset};
  var p3 = {x:44*scale, y:26*scale + yOffset};

      // smoothing
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      function clear(){
        // clear using CSS pixel dims (transform already set)
        ctx.clearRect(0,0,w,h);
      }

      function draw(now){
        var t = Math.max(0, now - start);
        clear();

  // ring background (subtle)
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(11,155,58,0.12)';
  ctx.lineWidth = 8;
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.stroke();

        // ring draw progress
        var ringT = Math.min(1, t / ringDuration);
        if(ringT>0){
          ctx.beginPath();
          ctx.strokeStyle = '#0b9b3a';
          ctx.lineWidth = 8;
          var startAngle = -Math.PI/2;
          var endAngle = startAngle + (Math.PI*2) * ringT;
          ctx.arc(cx, cy, r, startAngle, endAngle);
          ctx.stroke();
        }

        // inner fill appears after innerDelay
        if(t > innerDelay){
          var tt = Math.min(1, (t - innerDelay) / innerDuration);
          ctx.save();
          ctx.globalAlpha = tt;
          ctx.fillStyle = '#e9fff3';
          ctx.beginPath();
          ctx.arc(cx, cy, r - 12, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }

        // check drawing
        if(t > checkDelay){
          var ct = Math.min(1, (t - checkDelay) / checkDuration);
          // draw partial two-segment polyline p1->p2->p3
          ctx.beginPath();
          ctx.strokeStyle = '#0b9b3a';
          ctx.lineWidth = 7;
          // total lengths
          function dist(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);} 
          var L1 = dist(p1,p2), L2 = dist(p2,p3), LT = L1+L2;
          var drawLen = LT * ct;
          if(drawLen <= L1){
            var u = drawLen / L1;
            var ix = p1.x + (p2.x - p1.x) * u;
            var iy = p1.y + (p2.y - p1.y) * u;
            ctx.moveTo(p1.x,p1.y);
            ctx.lineTo(ix, iy);
          } else {
            var u = (drawLen - L1)/L2;
            var ix = p2.x + (p3.x - p2.x) * u;
            var iy = p2.y + (p3.y - p2.y) * u;
            ctx.moveTo(p1.x,p1.y);
            ctx.lineTo(p2.x,p2.y);
            ctx.lineTo(ix,iy);
          }
          ctx.stroke();
        }

        if(t < (checkDelay + checkDuration)){
          requestAnimationFrame(draw);
        }
      }

      requestAnimationFrame(draw);
    }
    function hideRewardModal(){
      try{
        var rewardModal=document.getElementById("rewardModal");
        if(!rewardModal)return;
        rewardModal.classList.remove("show");
        rewardModal.setAttribute("aria-hidden","true");
        var modalCheck=rewardModal.querySelector(".modal-check");
        if(modalCheck)modalCheck.classList.remove("animate");
      }catch(e){}
    }
    function replyClickHandler(){
      try{showRewardModal(MODAL_CREDIT);disableReplyButtons();}catch(e){}
    }
    function bindReplyButtons(){
      try{
        var btnYes=document.getElementById("btnYes"),btnNot=document.getElementById("btnNot");
        if(btnYes){btnYes.removeEventListener("click",replyClickHandler);btnYes.addEventListener("click",replyClickHandler);}
        if(btnNot){btnNot.removeEventListener("click",replyClickHandler);btnNot.addEventListener("click",replyClickHandler);}
      }catch(e){}
    }
    function disableReplyButtons(){
      try{
        var btnYes=document.getElementById("btnYes"),btnNot=document.getElementById("btnNot");
        if(btnYes)btnYes.disabled=true;
        if(btnNot)btnNot.disabled=true;
        var replyCard=document.getElementById("replyCard");
        if(replyCard){
          var q=replyCard.querySelector(".question");
          if(q)q.textContent="Thank you — your response was recorded.";
        }
      }catch(e){}
    }
    function ensurePartnerChecks(){
      try{
        var nodes=Array.from(document.querySelectorAll('.partner-verified'));
        nodes.forEach(function(n){
          if(!n.querySelector('.pv-check')){
            var span=document.createElement('div');
            span.className='pv-check';
            span.setAttribute('aria-hidden','true');
            span.textContent='✓';
            n.appendChild(span);
          }
        });
      }catch(e){}
    }
    function initVsl4Extras(){
      try{
        var PAGE_ID=window.PAGE_ID||(window.location.pathname.replace(/^.*\//,"")||"vsl1");
        if(PAGE_ID!=="vsl4")return;
        var withdrawBtn=document.getElementById("withdrawNowBtn");
        if(withdrawBtn)withdrawBtn.classList.add("hidden");
        function startExtras(){
          try{
            if(withdrawBtn)setTimeout(function(){withdrawBtn.classList.remove("hidden");},10000);
            var wrap=document.querySelector(".comments-wrap");
            if(!wrap)return;
            var COUNT_LABELS=Array.from(document.querySelectorAll(".comments-count"));
            var INTERVAL=10000;
            var timer=null;
            var current=0;
            function collect(){
              return {progressNodes:Array.from(wrap.querySelectorAll(".comment-progress")),rowNodes:Array.from(wrap.querySelectorAll(".comment-row"))};
            }
            function updateCountLabel(index,total){COUNT_LABELS.forEach(function(el){el.textContent=index+" of "+total+" comments";});}
            function showIndex(i){
              var data=collect();
              var progressNodes=data.progressNodes;
              var rowNodes=data.rowNodes;
              var total=rowNodes.length;
              if(total===0){updateCountLabel(0,0);return;}
              i=((i%total)+total)%total;
              current=i;
              progressNodes.forEach(function(p){p.style.display="none";});
              rowNodes.forEach(function(r){r.style.display="none";});
              var p=progressNodes[i],r=rowNodes[i];
              if(p){
                p.style.display="block";
                var fill=p.querySelector(".fill");
                if(fill){fill.style.animation="none";void fill.offsetWidth;fill.style.animation="progressFill 10s linear forwards";}
              }
              if(r)r.style.display="flex";
              updateCountLabel(i+1,total);
            }
            function next(){var data=collect();if(data.rowNodes.length===0)return;current=(current+1)%data.rowNodes.length;showIndex(current);}
            function start(){stop();showIndex(current);timer=setInterval(next,INTERVAL);}
            function stop(){if(timer){clearInterval(timer);timer=null;}}
            var mo=new MutationObserver(function(){var data=collect();if(data.rowNodes.length===0){stop();updateCountLabel(0,0);return;}if(current>=data.rowNodes.length)current=0;setTimeout(start,60);});
            (function initialHide(){var data=collect();data.progressNodes.forEach(function(p){p.style.display='none'});data.rowNodes.forEach(function(r){r.style.display='none'});})();
            setTimeout(start,300);
            mo.observe(wrap,{childList:true,subtree:true});
            window.addEventListener("pagehide",stop);
            window.addEventListener("beforeunload",stop);
          }catch(e){}
        }
        if(document.readyState==="complete"){startExtras();}else{window.addEventListener("load",function onLoad(){window.removeEventListener("load",onLoad);startExtras();},{once:true});setTimeout(startExtras,700);}
      }catch(e){}
    }
    function bindWithdrawRedirect(){
      try{
        var page=window.PAGE_ID||(window.location.pathname.replace(/^.*\//,"")||"vsl1");
        if(page==="withdraw"){var wb=document.getElementById("withdrawBtn");if(wb){wb.removeEventListener("click",withdrawRedirectHandler);wb.addEventListener("click",withdrawRedirectHandler);}}
      }catch(e){}
    }
    function withdrawRedirectHandler(){try{window.location.href="/final/"}catch(e){}}
    bindReplyButtons();
    renderWallet();
    autoCreditAndAnimateIfNeeded();
    ensurePartnerChecks();
    initVsl4Extras();
    bindWithdrawRedirect();
    (function bindModalClosers(){try{document.addEventListener("click",function(e){var rewardModal=document.getElementById("rewardModal");if(!rewardModal)return;if(e.target===rewardModal){rewardModal.classList.remove("show");rewardModal.setAttribute("aria-hidden","true");}},false);document.addEventListener("keydown",function(e){if(e.key==="Escape"){var rm=document.getElementById("rewardModal");if(rm){rm.classList.remove("show");rm.setAttribute("aria-hidden","true");}}});var modalClose=document.getElementById("modalClose");if(modalClose)modalClose.addEventListener("click",function(){var rm=document.getElementById("rewardModal");if(rm){rm.classList.remove("show");rm.setAttribute("aria-hidden","true");}});}catch(e){};})();
  }
})();