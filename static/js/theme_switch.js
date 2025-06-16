// 主题切换脚本
(function() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect) return;
    // 读取本地存储
    const saved = localStorage.getItem('themeMode');
    if (saved) {
        themeSelect.value = saved;
        applyTheme(saved);
    }
    themeSelect.addEventListener('change', function() {
        const val = themeSelect.value;
        localStorage.setItem('themeMode', val);
        applyTheme(val);
    });
    function applyTheme(mode) {
        document.body.classList.remove('theme-dark', 'theme-eye');
        if (mode === 'dark') {
            document.body.classList.add('theme-dark');
        } else if (mode === 'eye') {
            document.body.classList.add('theme-eye');
        }
    }
})();
