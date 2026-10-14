'use strict';

// Use the current Wistia player so speed is configured on the player itself.
function createOverviewPlayer(mediaId,title,color){
 const player=document.createElement('wistia-player');
 player.setAttribute('media-id',mediaId);
 player.setAttribute('playback-rate','1.25');
 player.setAttribute('player-color',color);
 player.setAttribute('autoplay','');
 player.setAttribute('playsinline','');
 player.setAttribute('settings-control','true');
 player.setAttribute('playback-rate-control','true');
 player.setAttribute('aria-label',title);
 player.tabIndex=0;
 // Set the default at initialization and first playback, not on later resumes.
 player.addEventListener('api-ready',()=>{player.playbackRate=1.25;},{once:true});
 player.addEventListener('play',()=>{player.playbackRate=1.25;},{once:true});
 return player;
}

const $=id=>document.getElementById(id);
const full=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const short=n=>Math.abs(n)>=1e6?'$'+(n/1e6).toFixed(2)+'M':Math.abs(n)>=1000?'$'+(n/1000).toFixed(n%1000===0?0:1)+'K':full(n);
const controls=['income','stop','retention','horizon'];
let announceTimer;
function makeChart(rows,horizon,stop){
 const mobile=window.matchMedia('(max-width:600px)').matches;
 const W=mobile?340:700,H=280,left=mobile?58:62,right=mobile?12:20,top=30,bottom=43,w=W-left-right,h=H-top-bottom;
 $('income-chart').setAttribute('viewBox',`0 0 ${W} ${H}`);
 const data=rows.slice(0,horizon),max=Math.max(...data.map(r=>r.renewal),...data.map(r=>r.transactional))*1.15;
 const x=year=>left+(year-1)/(horizon-1)*w,y=value=>top+h-(value/max)*h;
 const points=key=>data.map(r=>`${x(r.year).toFixed(2)},${y(r[key]).toFixed(2)}`).join(' ');
 let svg='<title id="chart-title">Annual income comparison</title><desc id="chart-description">'+`Transactional and renewal income for ${horizon} years, with new business added for ${stop} years. The detailed table follows the chart.`+'</desc><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5eebcd" stop-opacity=".3"/><stop offset="1" stop-color="#5eebcd" stop-opacity="0"/></linearGradient></defs>';
 for(let i=0;i<=4;i++){
  const value=max*i/4,py=y(value);
  svg+=`<line x1="${left}" y1="${py}" x2="${W-right}" y2="${py}" stroke="#294253" stroke-width="1" stroke-dasharray="3 5"/><text x="${left-12}" y="${py+4}" fill="#8ba7ba" font-size="12" text-anchor="end">${short(value)}</text>`;
 }
 const tickYears=[1,...Array.from({length:mobile?3:5},(_,i)=>Math.round((i+1)*horizon/(mobile?3:5)))];
 [...new Set(tickYears)].forEach(year=>{svg+=`<text x="${x(year)}" y="${H-18}" fill="#8ba7ba" font-size="12" text-anchor="middle">${year===1?'Year 1':year}</text>`});
 if(stop<horizon){const px=x(stop+.5);svg+=`<line x1="${px}" y1="${top}" x2="${px}" y2="${top+h}" stroke="#789998" stroke-width="1" stroke-dasharray="4 5"/><text x="${Math.min(px+7,W-150)}" y="${top+5}" fill="#bdc9c4" font-size="10">New business stops</text>`;}
 svg+=`<polygon points="${left},${top+h} ${points('renewal')} ${x(horizon)},${top+h}" fill="url(#area)"/><polyline points="${points('renewal')}" fill="none" stroke="#25ffcc" stroke-width="4" stroke-linejoin="round"/><polyline points="${points('transactional')}" fill="none" stroke="#ff7759" stroke-width="3.5" stroke-dasharray="6 4" stroke-linejoin="round"/>`;
 const last=data[data.length-1];svg+=`<circle cx="${x(horizon)}" cy="${y(last.renewal)}" r="4" fill="#a5ffe5"/>`;
 $('income-chart').innerHTML=svg;
}
function render(){
 const income=Number($('income').value),stop=Number($('stop').value),retention=Number($('retention').value),horizon=Number($('horizon').value);
 const rows=calculateScenario(income,stop,retention),last=rows[horizon-1];
 $('income-value').textContent=full(income);$('stop-value').textContent=stop+' '+(stop===1?'year':'years');$('retention-value').textContent=retention+'%';
 ['income','stop','retention'].forEach(id=>{const el=$(id);el.style.setProperty('--fill',100*(Number(el.value)-Number(el.min))/(Number(el.max)-Number(el.min))+'%');el.setAttribute('aria-valuetext',id==='income'?full(income):id==='stop'?stop+' years':retention+' percent');});
 $('horizon-label').textContent=horizon;$('total-t').textContent=short(last.totalTransactional);$('total-r').textContent=short(last.totalRenewal);$('difference-value').textContent='+'+short(last.totalRenewal-last.totalTransactional);
 $('result-story').textContent=`After year ${stop}, no new business is added. At ${retention}% annual income retention, illustrated renewal income in year ${Math.min(stop+1,50)} is ${full(rows[stop].renewal)}.`;
 makeChart(rows,horizon,stop);
 $('table-caption').textContent=`Year-by-year details for the full ${horizon}-year scenario. Amounts rounded to the nearest dollar.`;
 $('year-table').innerHTML=rows.slice(0,horizon).map(r=>`<tr><th scope="row">${r.year}</th><td>${full(r.transactional)}</td><td>${full(r.renewal)}</td><td>${full(r.gap)}</td><td>${full(r.totalRenewal)}</td></tr>`).join('');
 $('horizon-totals').innerHTML=[10,20,30,50].map(n=>{const r=rows[n-1];return `<div class="horizon-item"><span>${n}-YEAR TOTALS</span><p>Transactional <strong>${short(r.totalTransactional)}</strong></p><p>Renewal <strong>${short(r.totalRenewal)}</strong></p></div>`}).join('');
 clearTimeout(announceTimer);announceTimer=setTimeout(()=>{$('live-status').textContent=`${horizon}-year totals: transactional income ${full(last.totalTransactional)}, renewal income ${full(last.totalRenewal)}. Illustration only.`;},300);
}
controls.forEach(id=>$(id).addEventListener('input',render));
window.matchMedia('(max-width:600px)').addEventListener('change',render);
$('reset').addEventListener('click',()=>{$('income').value=250000;$('stop').value=6;$('retention').value=100;$('horizon').value=30;render();});
let currentVideo='intro';
const videoCover=$('video-frame').innerHTML;
function playVideo(){
 if(currentVideo==='intro'){
  const video=document.createElement('video');video.src='assets/intro.mp4';video.controls=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label','The Income You Keep — 2-minute introduction');
  $('video-frame').replaceChildren(video);video.focus();const play=video.play();if(play)play.catch(()=>{$('video-hint').textContent='Use the player controls to start the introduction.';});
 }else{
  const frame=createOverviewPlayer('mvpjltt2t2','Renewals for Life full overview','#ffd15a');$('video-frame').replaceChildren(frame);frame.focus();
 }
}
function selectVideo(kind){
 currentVideo=kind;
 const active=$('video-frame').querySelector('video,wistia-player');if(active&&typeof active.pause==='function')active.pause();
 $('video-frame').innerHTML=videoCover;
 const intro=kind==='intro';
 $('play-video').classList.add('image-cover');
 const artwork=$('play-video').querySelector('.intro-cover-art');
 artwork.src=intro?'assets/intro-cover.png':'assets/overview-cover.png';
 artwork.hidden=false;
 const cover=$('play-video');cover.setAttribute('aria-label',intro?'Play The Income You Keep, 2-minute introduction':'Play the Renewals for Life full overview');
 cover.querySelector('.video-label').textContent=intro?'THE INCOME YOU KEEP · 2-MINUTE INTRO':'THE RENEWALS FOR LIFE FULL OVERVIEW';
 cover.querySelector('.video-title').innerHTML=intro?'The income<br><em>you keep.</em>':'What are you<br><em>really building?</em>';
 cover.querySelector('.video-bottom span').textContent=intro?'WATCH THE 2-MINUTE INTRO':'WATCH THE FULL OVERVIEW';
 $('video-hint').textContent='Press the play arrow to begin';
 document.querySelectorAll('[data-video]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.video===kind)));
 cover.addEventListener('click',playVideo);
}
document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>selectVideo(button.dataset.video)));
$('play-video').addEventListener('click',playVideo);

render();

// Accessible, swipeable infographic gallery with a larger reading view.
(()=>{
 const root=$('insight-carousel'),slides=[...root.querySelectorAll('.insight-slide')],dots=[...root.querySelectorAll('[data-slide]')];
 const titles=slides.map(s=>s.querySelector('img').alt.replace(/ infographic$/,''));
 const dialog=$('gallery-dialog'),scroll=dialog.querySelector('.gallery-image-scroll');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,paused=reduced.matches,timer=null,hover=false,inView=false;
 function syncTimer(){clearInterval(timer);timer=null;if(!paused&&!hover&&inView&&!dialog.open&&!document.hidden)timer=setInterval(()=>show(index+1,false),10000);}
 function updatePause(){ $('gallery-pause').textContent=paused?'Play ▶':'Pause ⏸';$('gallery-pause').setAttribute('aria-pressed',String(paused));syncTimer();}
 function show(n,manual=true){
  index=(n+slides.length)%slides.length;
  slides.forEach((slide,i)=>{slide.hidden=i!==index;dots[i].setAttribute('aria-pressed',String(i===index));});
  $('gallery-title').textContent=titles[index];$('gallery-count').textContent=String(index+1).padStart(2,'0')+' / 09';
  $('gallery-full-image').src=slides[index].querySelector('img').getAttribute('src');$('gallery-full-image').alt=titles[index]+' infographic';
  $('gallery-dialog-title').textContent=titles[index];$('gallery-full-count').textContent=(index+1)+' / 9';
  scroll.classList.remove('is-zoomed');scroll.scrollTop=0;scroll.scrollLeft=0;$('gallery-zoom').textContent='Zoom in +';$('gallery-zoom').setAttribute('aria-pressed','false');
  if(manual){paused=true;$('gallery-status').textContent=`Slide ${index+1} of 9: ${titles[index]}`;}updatePause();
 }
 $('gallery-prev').addEventListener('click',()=>show(index-1));$('gallery-next').addEventListener('click',()=>show(index+1));
 $('gallery-full-prev').addEventListener('click',()=>show(index-1));$('gallery-full-next').addEventListener('click',()=>show(index+1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
 $('gallery-pause').addEventListener('click',()=>{paused=!paused;updatePause();});
 root.addEventListener('mouseenter',()=>{hover=true;syncTimer();});root.addEventListener('mouseleave',()=>{hover=false;syncTimer();});
 root.addEventListener('focusin',e=>{if(e.target!==$('gallery-pause')){paused=true;updatePause();}});
 root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}});
 let start=null;const stage=$('insight-stage');stage.addEventListener('touchstart',e=>{start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 stage.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1));start=null;},{passive:true});
 $('gallery-expand').addEventListener('click',()=>{paused=true;updatePause();dialog.showModal();document.body.classList.add('gallery-open');});
 $('gallery-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.classList.remove('gallery-open');$('gallery-expand').focus();syncTimer();});
 $('gallery-zoom').addEventListener('click',()=>{const zoom=scroll.classList.toggle('is-zoomed');$('gallery-zoom').textContent=zoom?'Fit image −':'Zoom in +';$('gallery-zoom').setAttribute('aria-pressed',String(zoom));});
 dialog.addEventListener('keydown',e=>{if(!scroll.classList.contains('is-zoomed')&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}});
 document.addEventListener('visibilitychange',syncTimer);reduced.addEventListener('change',()=>{if(reduced.matches){paused=true;updatePause();}});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncTimer();},{threshold:.2}).observe(root);else{inView=true;}
 updatePause();
})();

// A still alternative keeps the looping GIF optional.
(()=>{const image=document.getElementById('comparison-animation');const toggle=document.getElementById('comparison-motion');if(!image||!toggle)return;let moving=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;function update(){image.src=moving?'assets/income-comparison.gif':'assets/income-comparison-still.png';toggle.textContent=moving?'Show still image':'Play animation';}toggle.addEventListener('click',()=>{moving=!moving;update();});update();})();
