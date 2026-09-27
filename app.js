const tasks = [
  { name: 'Practice scales', detail: '10 minutes on piano or violin', color: '#f05b48', reward: 60 },
  { name: 'Club meeting prep', detail: 'Write down the three things to cover', color: '#3553c8', reward: 75 },
  { name: 'Reply to emails', detail: 'Clear the two messages you keep avoiding', color: '#f6c84c', reward: 50 },
  { name: 'Finish history reading', detail: 'Pages 42–58, no highlights required', color: '#62a878', reward: 90 },
  { name: 'Tidy your desk', detail: 'A five-minute reset for future you', color: '#d77bb2', reward: 45 },
  { name: 'Plan tomorrow', detail: 'Pick three priorities before bed', color: '#7bb7d7', reward: 55 },
  { name: 'Make the phone call', detail: 'Do the one call you keep postponing', color: '#f28f54', reward: 80 },
  { name: 'Study sprint', detail: '25 focused minutes, no multitasking', color: '#8f78c7', reward: 100 },
  { name: 'Practice a song', detail: 'Run through one song from start to finish', color: '#e486a9', reward: 70 },
  { name: 'Reset your inbox', detail: 'Archive or answer ten messages', color: '#72b89b', reward: 65 }
];
const prizes = [
  { name: 'Snack break', detail: '15 minutes of guilt-free nothing', emoji: '🍪', cost: 250 },
  { name: 'Fancy coffee', detail: 'Your favorite drink, on the house', emoji: '☕', cost: 450 },
  { name: 'Game time', detail: '30 minutes of play, no guilt attached', emoji: '🕹️', cost: 700 },
  { name: 'Big reward', detail: 'A small thing you have been wanting', emoji: '🎁', cost: 1000 }
];
let tickets = 120, streak = 0, activeIndex = null, spinning = false, wheelRotation = 0;
let lastVisitDate = '', lastCompletedDate = '', dailyBonusClaimed = false;
try {
  const saved = JSON.parse(localStorage.getItem('hard-workers-arcade'));
  if (saved?.tasks?.length) tasks.splice(0, tasks.length, ...saved.tasks);
  if (Number.isFinite(saved?.tickets)) tickets = saved.tickets;
  if (Number.isFinite(saved?.streak)) streak = saved.streak;
  lastVisitDate = saved?.lastVisitDate || '';
  lastCompletedDate = saved?.lastCompletedDate || '';
  dailyBonusClaimed = saved?.dailyBonusClaimed === true;
} catch (error) { /* Storage can be unavailable in private file previews. */ }
const today = new Date().toISOString().slice(0,10);
if (lastVisitDate !== today) dailyBonusClaimed = false;
lastVisitDate = today;
function saveState(){try{localStorage.setItem('hard-workers-arcade',JSON.stringify({tasks,tickets,streak,lastVisitDate,lastCompletedDate,dailyBonusClaimed}));}catch(error){}}
const $ = id => document.getElementById(id);
const wheel = $('wheel'), ctx = wheel.getContext('2d');

function drawWheel() {
  const r = 245, cx = 250, cy = 250, slice = Math.PI * 2 / Math.max(tasks.length, 1);
  ctx.clearRect(0, 0, 500, 500); ctx.save(); ctx.translate(cx, cy);
  if (!tasks.length) { ctx.fillStyle = '#d8d3c8'; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.restore(); return; }
  tasks.forEach((task, i) => { const start = -Math.PI/2 + i*slice; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,start,start+slice); ctx.closePath(); ctx.fillStyle=task.color; ctx.fill(); ctx.strokeStyle='#26252a'; ctx.lineWidth=2; ctx.stroke(); ctx.save(); ctx.rotate(start+slice/2); ctx.translate(r*.66,0); ctx.rotate(Math.PI/2); ctx.fillStyle='#fffdf7'; ctx.font='600 12px Space Grotesk'; ctx.textAlign='center'; ctx.fillText(task.name.length>17 ? task.name.slice(0,16)+'…' : task.name,0,0); ctx.restore(); });
  ctx.restore();
}
function renderTasks() {
  $('task-count').textContent = tasks.length;
  $('spin-hint').textContent = tasks.length ? `You have ${tasks.length} task${tasks.length === 1 ? '' : 's'} queued. The wheel is ready.` : 'Add a mission to put it on the wheel.';
  $('task-list').innerHTML = tasks.length ? tasks.map((t,i)=>`<div class="task-card ${activeIndex===i?'selected':''}"><input class="task-check" type="checkbox" aria-label="Complete ${t.name}" data-check="${i}"><div class="task-copy"><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.detail || 'Ready when you are.')}</small></div><span class="task-reward">+${t.reward} TIX</span><button class="remove-task" data-remove="${i}" aria-label="Remove ${escapeHtml(t.name)}">×</button></div>`).join('') : '<div class="task-card" style="grid-column:1/-1;justify-content:center;color:#77746d;font-size:13px">The queue is empty. Add a mission to start playing.</div>';
  document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>removeTask(+b.dataset.remove)));
  document.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('change',()=>{ if(b.checked) completeTask(+b.dataset.check); }));
  drawWheel();
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function spin() { if(spinning || !tasks.length) { if(!tasks.length) showToast('Add a mission before you spin.'); return; } spinning=true; $('spin-btn').disabled=true; const index=Math.floor(Math.random()*tasks.length); activeIndex=index; const slice=360/tasks.length; wheelRotation += 1440 + (360 - (index*slice + slice/2) - (wheelRotation%360)); wheel.style.transform=`rotate(${wheelRotation}deg)`; setTimeout(()=>{spinning=false; $('spin-btn').disabled=false; showActive(tasks[index]); showToast(`Locked in: ${tasks[index].name}`); renderTasks();},4100); }
function showActive(task){$('empty-active').classList.add('hidden');$('task-active').classList.remove('hidden');$('active-name').textContent=task.name;$('active-detail').textContent=task.detail;$('active-reward').textContent=`+${task.reward} tickets`;}
function celebrate(task){
  $('celebration-copy').textContent=`+${task.reward} TICKETS`;
  const colors=['#f05b48','#f6c84c','#3553c8','#62a878','#d77bb2'];
  $('confetti').innerHTML=Array.from({length:28},(_,i)=>`<i style="--x:${Math.random()*100}%;--delay:${Math.random()*.25}s;--color:${colors[i%colors.length]}"></i>`).join('');
  $('celebration').classList.remove('show'); void $('celebration').offsetWidth; $('celebration').classList.add('show');
  clearTimeout(celebrate.timer); celebrate.timer=setTimeout(()=>$('celebration').classList.remove('show'),2400);
}
function completeTask(index){
  const task=tasks[index]; const firstToday=!dailyBonusClaimed; const bonus=firstToday?50:0; const earned=task.reward+bonus;
  tickets+=earned;
  if(lastCompletedDate!==today){streak=lastCompletedDate && Math.round((new Date(today)-new Date(lastCompletedDate))/86400000)<=1?streak+1:1;lastCompletedDate=today;}
  dailyBonusClaimed=true; $('ticket-count').textContent=tickets; $('streak-count').textContent=streak; updateDailyStatus(); updateProgress(); celebrate({...task,reward:earned}); showToast(firstToday?`Mission complete! +${task.reward} + 50 BONUS tickets`:`Mission complete! +${task.reward} tickets`);
  if(activeIndex===index){$('task-active').classList.add('hidden');$('empty-active').classList.remove('hidden');activeIndex=null;} tasks.splice(index,1); saveState(); renderTasks();
}
function removeTask(index){const name=tasks[index].name; tasks.splice(index,1); if(activeIndex===index){activeIndex=null;$('task-active').classList.add('hidden');$('empty-active').classList.remove('hidden');} else if(activeIndex>index) activeIndex--; saveState(); renderTasks(); showToast(`${name} removed from the queue.`);}
function updateProgress(){
  const next = prizes.find(prize=>tickets < prize.cost) || prizes[prizes.length-1];
  const previous = prizes[prizes.indexOf(next)-1]?.cost || 0;
  const pct = Math.min(100, Math.max(0, (tickets-previous)/(next.cost-previous)*100));
  $('progress-fill').style.width=pct+'%'; $('progress-text').textContent=`${tickets} / ${next.cost}`;
  $('next-prize-label').textContent = tickets >= prizes[prizes.length-1].cost ? 'ALL PRIZES UNLOCKED' : 'NEXT PRIZE';
  $('redeem-btn').disabled=tickets<next.cost;
  $('prize-shelf').innerHTML=prizes.map(prize=>`<div class="prize-row ${tickets>=prize.cost?'unlocked':''}"><span class="prize-emoji">${prize.emoji}</span><div><strong>${prize.name}</strong><small>${prize.detail}</small></div><span class="prize-cost">${tickets>=prize.cost?'✓':prize.cost}</span></div>`).join('');
}
function updateDailyStatus(){
  $('return-title').textContent=dailyBonusClaimed?'BONUS CLAIMED — NICE WORK':'TODAY\'S BONUS IS READY';
  $('return-message').textContent=dailyBonusClaimed?'Come back tomorrow to protect your streak and unlock another +50 ticket bonus.':'Complete your first mission today for +50 bonus tickets.';
  $('return-strip').classList.toggle('claimed',dailyBonusClaimed);
}
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2800);}
$('spin-btn').addEventListener('click',spin); window.addEventListener('keydown',e=>{if(e.code==='Space' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();spin();}});
$('complete-btn').addEventListener('click',()=>{if(activeIndex!==null) completeTask(activeIndex);});
$('open-add').addEventListener('click',()=>{$('task-dialog').showModal();setTimeout(()=>$('new-task').focus(),50);});
$('task-form').addEventListener('submit',e=>{e.preventDefault();const name=$('new-task').value.trim(),detail=$('new-detail').value.trim();if(name){tasks.push({name,detail,color:['#f05b48','#3553c8','#f6c84c','#62a878','#d77bb2'][tasks.length%5],reward:40+Math.floor(Math.random()*5)*10});saveState();renderTasks();$('task-dialog').close();$('task-form').reset();showToast('Mission added to the queue.');}});
$('redeem-btn').addEventListener('click',()=>{const next=prizes.find(prize=>tickets>=prize.cost && !prize.redeemed);if(next){next.redeemed=true;tickets-=next.cost;$('ticket-count').textContent=tickets;saveState();updateProgress();showToast(`${next.name} redeemed! Nice work.`);}});
renderTasks(); updateProgress(); updateDailyStatus(); saveState();
