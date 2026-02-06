(function(){
  var currentSessionId=null;
  var historyOpen=false;

  function initAIChat(){
    var input=document.getElementById('ai-chat-input');
    var sendBtn=document.getElementById('ai-send-btn');
    var msgs=document.getElementById('ai-chat-messages');
    var quickActions=document.getElementById('ai-quick-actions');
    var aiWidget=document.getElementById('asthera-ai-widget');
    if(!input||!sendBtn||!msgs||!aiWidget)return;
    if(aiWidget.dataset.init==='1')return;
    aiWidget.dataset.init='1';
    var loading=false;

    // Find the inner container (msgs parent)
    var innerContainer=msgs.parentElement;

    // Create history button row
    var historyRow=document.createElement('div');
    historyRow.style.cssText='display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px;';
    historyRow.innerHTML='<button id="ai-new-chat-btn" style="display:none;padding:6px 14px;border-radius:20px;border:1px solid rgba(0,212,170,0.2);background:rgba(0,212,170,0.08);color:hsl(185,85%,50%);font-size:11px;font-family:Inter,sans-serif;cursor:pointer;">+ New Chat</button><button id="ai-history-btn" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(0,212,170,0.15);background:rgba(15,23,42,0.5);color:hsl(215,20%,55%);font-size:11px;font-family:Inter,sans-serif;cursor:pointer;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>History</button>';
    innerContainer.insertBefore(historyRow,innerContainer.firstChild);

    var historyBtn=document.getElementById('ai-history-btn');
    var newChatBtn=document.getElementById('ai-new-chat-btn');

    // Create history panel
    var historyPanel=document.createElement('div');
    historyPanel.id='ai-history-panel';
    historyPanel.style.cssText='display:none;max-height:280px;overflow-y:auto;margin-bottom:12px;padding:8px;border-radius:12px;background:rgba(15,23,42,0.8);border:1px solid rgba(0,212,170,0.1);';
    innerContainer.insertBefore(historyPanel,msgs);

    function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
    function fmt(t){
      var h=esc(t);
      h=h.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
      h=h.replace(/\n/g,'<br>');
      return h;
    }
    function addMsg(text,role){
      msgs.classList.remove('hidden');msgs.style.display='block';
      var d=document.createElement('div');
      d.style.cssText='margin-bottom:12px;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6;word-wrap:break-word;font-family:Inter,sans-serif;';
      if(role==='user'){d.style.background='linear-gradient(135deg,rgba(0,212,170,0.15),rgba(139,92,246,0.15))';d.style.border='1px solid rgba(0,212,170,0.2)';d.style.marginLeft='40px'}
      else{d.style.background='rgba(30,41,59,0.8)';d.style.border='1px solid rgba(100,116,139,0.2)';d.style.marginRight='40px'}
      var label=role==='user'?'You':'Asthera AI';
      var lc=role==='user'?'hsl(185,85%,50%)':'hsl(270,70%,60%)';
      d.innerHTML='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;color:'+lc+'">'+label+'</div>'+(role==='ai'?fmt(text):esc(text));
      d.style.color='hsl(210,40%,98%)';
      msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
    }
    function clearMsgs(){
      msgs.innerHTML='';msgs.style.display='none';
      if(quickActions)quickActions.style.display='flex';
      currentSessionId=null;
      newChatBtn.style.display='none';
    }
    function showTyping(){
      var d=document.createElement('div');d.id='ai-typing';
      d.style.cssText='margin-bottom:12px;padding:10px 14px;border-radius:12px;background:rgba(30,41,59,0.8);border:1px solid rgba(100,116,139,0.2);margin-right:40px;color:hsl(210,40%,98%);font-family:Inter,sans-serif;';
      d.innerHTML='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;color:hsl(270,70%,60%)">Asthera AI</div><div style="display:flex;gap:4px"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>';
      msgs.classList.remove('hidden');msgs.style.display='block';
      msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
    }
    function rmTyping(){var e=document.getElementById('ai-typing');if(e)e.remove()}
    function getLang(){try{return localStorage.getItem('astherafi-lang')||'en'}catch(e){return'en'}}
    var translations={
      'q1':{en:'What is Asthera and how does it help in crypto?',zh:'什么是Asthera，它如何帮助加密货币？',ar:'ما هو Asthera وكيف يساعد في العملات المشفرة؟'},
      'q2':{en:'Explain blockchain technology simply',zh:'\u7528\u7b80\u5355\u7684\u65b9\u5f0f\u89e3\u91ca\u533a\u5757\u94fe\u6280\u672f',ar:'\u0627\u0634\u0631\u062d \u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0628\u0644\u0648\u0643\u0634\u064a\u0646 \u0628\u0628\u0633\u0627\u0637\u0629'},
      'q3':{en:'What are the top DeFi protocols and how do they work?',zh:'\u76ee\u524d\u6700\u70ed\u95e8\u7684DeFi\u534f\u8bae\u6709\u54ea\u4e9b\uff0c\u5b83\u4eec\u5982\u4f55\u8fd0\u4f5c\uff1f',ar:'\u0645\u0627 \u0647\u064a \u0623\u0641\u0636\u0644 \u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644\u0627\u062a DeFi \u0648\u0643\u064a\u0641 \u062a\u0639\u0645\u0644\u061f'},
      'q4':{en:'How to read crypto charts and do technical analysis?',zh:'\u5982\u4f55\u9605\u8bfb\u52a0\u5bc6\u8d27\u5e01\u56fe\u8868\u5e76\u8fdb\u884c\u6280\u672f\u5206\u6790\uff1f',ar:'\u0643\u064a\u0641 \u062a\u0642\u0631\u0623 \u0645\u062e\u0637\u0637\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u062a \u0627\u0644\u0645\u0634\u0641\u0631\u0629 \u0648\u062a\u062c\u0631\u064a \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0641\u0646\u064a\u061f'},
      'q5':{en:'What is the difference between CEX and DEX?',zh:'\u4e2d\u5fc3\u5316\u4ea4\u6613\u6240\u548c\u53bb\u4e2d\u5fc3\u5316\u4ea4\u6613\u6240\u6709\u4ec0\u4e48\u533a\u522b\uff1f',ar:'\u0645\u0627 \u0627\u0644\u0641\u0631\u0642 \u0628\u064a\u0646 \u0627\u0644\u0628\u0648\u0631\u0635\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064a\u0629 \u0648\u0627\u0644\u0644\u0627\u0645\u0631\u0643\u0632\u064a\u0629\u061f'}
    };
    function getQ(key){var lang=getLang();var t=translations[key];return t?(t[lang]||t.en):key}

    function timeAgo(ts){
      var diff=Date.now()-ts;
      var mins=Math.floor(diff/60000);
      if(mins<1)return 'Just now';
      if(mins<60)return mins+'m ago';
      var hrs=Math.floor(mins/60);
      if(hrs<24)return hrs+'h ago';
      var days=Math.floor(hrs/24);
      return days+'d ago';
    }

    async function loadHistory(){
      try{
        var res=await fetch('/api/chat/history');
        var data=await res.json();
        historyPanel.innerHTML='';
        if(!data.sessions||data.sessions.length===0){
          historyPanel.innerHTML='<div style="text-align:center;padding:20px;color:hsl(215,20%,55%);font-size:12px;font-family:Inter,sans-serif;">No chat history yet</div>';
          return;
        }
        var header=document.createElement('div');
        header.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:4px 8px 10px;border-bottom:1px solid rgba(0,212,170,0.1);margin-bottom:8px;';
        header.innerHTML='<span style="font-size:12px;font-weight:600;color:hsl(185,85%,50%);font-family:Inter,sans-serif;">Chat History</span><span style="font-size:10px;color:hsl(215,20%,55%);font-family:Inter,sans-serif;">'+data.sessions.length+' conversations</span>';
        historyPanel.appendChild(header);
        data.sessions.forEach(function(s){
          var item=document.createElement('div');
          item.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:10px 12px;margin-bottom:4px;border-radius:10px;cursor:pointer;transition:background 0.15s;font-family:Inter,sans-serif;';
          item.innerHTML='<div style="flex:1;min-width:0;"><div style="font-size:12px;color:hsl(210,40%,98%);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(s.title)+'</div><div style="font-size:10px;color:hsl(215,20%,55%);margin-top:2px;">'+s.messageCount+' messages &middot; '+timeAgo(s.updatedAt)+'</div></div><button class="ai-history-del" data-sid="'+s.id+'" style="flex-shrink:0;margin-left:8px;background:none;border:none;color:hsl(215,20%,55%);cursor:pointer;padding:4px;font-size:14px;line-height:1;" title="Delete">&times;</button>';
          item.addEventListener('mouseenter',function(){item.style.background='rgba(0,212,170,0.06)'});
          item.addEventListener('mouseleave',function(){item.style.background='none'});
          item.addEventListener('click',function(e){
            if(e.target.classList.contains('ai-history-del'))return;
            restoreSession(s.id);
          });
          var delBtn=item.querySelector('.ai-history-del');
          delBtn.addEventListener('click',function(e){
            e.stopPropagation();
            deleteSession(s.id);
          });
          historyPanel.appendChild(item);
        });
      }catch(e){
        historyPanel.innerHTML='<div style="text-align:center;padding:20px;color:hsl(215,20%,55%);font-size:12px;font-family:Inter,sans-serif;">Could not load history</div>';
      }
    }

    async function restoreSession(sid){
      try{
        var res=await fetch('/api/chat/history/'+sid);
        var data=await res.json();
        if(data.session&&data.session.messages&&data.session.messages.length>0){
          msgs.innerHTML='';
          msgs.classList.remove('hidden');
          msgs.style.display='block';
          currentSessionId=sid;
          data.session.messages.forEach(function(m){addMsg(m.text,m.role)});
          if(quickActions)quickActions.style.display='none';
          newChatBtn.style.display='inline-flex';
          historyPanel.style.display='none';
          historyOpen=false;
        }
      }catch(e){console.error('restoreSession error:',e)}
    }

    async function deleteSession(sid){
      try{
        await fetch('/api/chat/history/'+sid,{method:'DELETE'});
        loadHistory();
        if(currentSessionId===sid){clearMsgs()}
      }catch(e){}
    }

    historyBtn.addEventListener('click',function(){
      historyOpen=!historyOpen;
      if(historyOpen){
        historyPanel.style.display='block';
        loadHistory();
      }else{
        historyPanel.style.display='none';
      }
    });
    historyBtn.addEventListener('mouseenter',function(){historyBtn.style.borderColor='hsl(185,85%,50%)';historyBtn.style.color='hsl(210,40%,98%)'});
    historyBtn.addEventListener('mouseleave',function(){historyBtn.style.borderColor='rgba(0,212,170,0.15)';historyBtn.style.color='hsl(215,20%,55%)'});

    newChatBtn.addEventListener('click',function(){clearMsgs()});
    newChatBtn.addEventListener('mouseenter',function(){newChatBtn.style.background='rgba(0,212,170,0.15)'});
    newChatBtn.addEventListener('mouseleave',function(){newChatBtn.style.background='rgba(0,212,170,0.08)'});

    async function send(){
      var msg=input.value.trim();if(!msg||loading)return;
      loading=true;sendBtn.style.opacity='0.5';input.value='';
      if(quickActions)quickActions.style.display='none';
      if(historyPanel)historyPanel.style.display='none';
      historyOpen=false;
      newChatBtn.style.display='inline-flex';
      addMsg(msg,'user');showTyping();
      try{
        var body={message:msg,lang:getLang()};
        if(currentSessionId)body.sessionId=currentSessionId;
        var res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        var data=await res.json();rmTyping();
        if(data.sessionId)currentSessionId=data.sessionId;
        addMsg(data.reply||data.error||'Error','ai');
      }catch(e){rmTyping();addMsg('Unable to connect. Try again.','ai')}
      loading=false;sendBtn.style.opacity='1';input.focus();
    }
    sendBtn.addEventListener('click',send);
    input.addEventListener('keydown',function(e){if(e.key==='Enter')send()});
    if(quickActions){
      quickActions.querySelectorAll('.ai-quick-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
          var qKey=btn.getAttribute('data-q');
          input.value=getQ(qKey);send();
        });
        btn.addEventListener('mouseenter',function(){btn.style.borderColor='hsl(185,85%,50%)';btn.style.color='hsl(210,40%,98%)'});
        btn.addEventListener('mouseleave',function(){btn.style.borderColor='rgba(0,212,170,0.15)';btn.style.color='hsl(215,20%,55%)'});
      });
    }
  }
  var style=document.createElement('style');
  style.textContent='@keyframes ai-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}.ai-dot{width:6px;height:6px;border-radius:50%;background:hsl(270,70%,60%);display:inline-block;animation:ai-bounce 1.4s infinite}.ai-dot:nth-child(2){animation-delay:0.2s}.ai-dot:nth-child(3){animation-delay:0.4s}#ai-chat-messages::-webkit-scrollbar{width:4px}#ai-chat-messages::-webkit-scrollbar-thumb{background:rgba(0,212,170,0.3);border-radius:2px}#ai-history-panel::-webkit-scrollbar{width:4px}#ai-history-panel::-webkit-scrollbar-thumb{background:rgba(0,212,170,0.3);border-radius:2px}';
  document.head.appendChild(style);
  var obs=new MutationObserver(function(){if(document.getElementById('ai-chat-input')){initAIChat();obs.disconnect()}});
  obs.observe(document.body,{childList:true,subtree:true});
  if(document.getElementById('ai-chat-input')){initAIChat()}
})();
