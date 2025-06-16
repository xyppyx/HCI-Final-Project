// 动态倒计时脚本
(function() {
    var el = document.getElementById('remainingTime');
    if (!el) return;
    var minutes = parseInt(el.textContent);
    if (isNaN(minutes) || minutes <= 0) return;
    var seconds = minutes * 60;
    var locked = false;
    function showLockScreen() {
        if (locked) return;
        locked = true;
        var lockDiv = document.createElement('div');
        lockDiv.id = 'timeLockScreen';
        lockDiv.style.position = 'fixed';
        lockDiv.style.top = '0';
        lockDiv.style.left = '0';
        lockDiv.style.width = '100vw';
        lockDiv.style.height = '100vh';
        lockDiv.style.background = 'radial-gradient(circle at 60% 40%, #e0e7ff 0%, #6366f1 100%)';
        lockDiv.style.zIndex = '9999';
        lockDiv.style.display = 'flex';
        lockDiv.style.flexDirection = 'column';
        lockDiv.style.alignItems = 'center';
        lockDiv.style.justifyContent = 'center';
        lockDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.92);padding:54px 38px 38px 38px;border-radius:32px;box-shadow:0 8px 32px 0 rgba(99,102,241,0.18);text-align:center;max-width:92vw;position:relative;overflow:hidden;">
                <div style='position:absolute;top:-30px;right:-30px;width:120px;height:120px;pointer-events:none;opacity:0.18;z-index:0;'>
                    <svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="#6366f1"/><text x="60" y="80" text-anchor="middle" font-size="60" fill="#fff" font-family="Segoe UI Emoji">🔒</text></svg>
                </div>
                <div style='font-size:3.2rem;line-height:1.1;margin-bottom:18px;color:#6366f1;font-family: "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif;'>⏰</div>
                <h2 style="color:#4f46e5;font-size:2.1rem;margin-bottom:12px;font-weight:900;letter-spacing:1px;">今日可用时长已用尽</h2>
                <p style="color:#64748b;font-size:1.18rem;margin-bottom:32px;">时间像沙漏一样流逝，<br>请明天再来，或由家长进入家长模式进行管理。</p>
                <a href="/parent_login" style="display:inline-block;padding:14px 38px;background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;border-radius:16px;font-size:1.18rem;font-weight:800;text-decoration:none;box-shadow:0 2px 12px #e0e7ff;transition:all 0.2s;letter-spacing:1px;">进入家长模式</a>
                <div style='margin-top:38px;font-size:1.5rem;color:#f59e0b;font-family:"Segoe UI Emoji";'>🌙 🕒 🏖️</div>
            </div>
        `;
        document.body.appendChild(lockDiv);
        document.body.style.overflow = 'hidden';
    }
    function update() {
        if (seconds <= 0) {
            el.textContent = '0';
            el.parentNode.style.color = '#ef4444';
            el.parentNode.innerHTML += '（今日可用时长已用尽）';
            clearInterval(timer);
            showLockScreen();
            return;
        }
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        el.textContent = m + (s > 0 ? ('.' + (s < 10 ? '0' : '') + s) : '');
        seconds--;
    }
    update();
    var timer = setInterval(update, 1000);
})();
