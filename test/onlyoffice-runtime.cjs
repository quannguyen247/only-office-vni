'use strict';

// ONLYOFFICE CEF does not implement Browser.setDownloadBehavior, so use
// its page-level CDP directly. Run only against a newly created blank document.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const kind = process.argv[2] || 'word';
const out = path.join(__dirname, '../deploy/ime-evidence');

async function main() {
    assert.ok(['word', 'cell'].includes(kind));
    let tab;
    for (let i = 0; i < 60 && !tab; i++) {
        try {
            const tabs = await (await fetch('http://127.0.0.1:8080/json/list')).json();
            tab = tabs.find(t => t.url.includes('/apps/api/documents/') && t.url.includes('doctype=' + kind));
        } catch (_) {}
        if (!tab) await delay(500);
    }
    assert.ok(tab, 'Create a blank scratch document with --new=doc/cell/slide and --ascdesktop-support-debug-info');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    const contexts = [];
    const pending = new Map();
    let sequence = 0;
    ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.method === 'Runtime.executionContextCreated') contexts.push(msg.params.context);
        if (pending.has(msg.id)) {
            const p = pending.get(msg.id);
            pending.delete(msg.id);
            clearTimeout(p.timer);
            msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
        }
    };
    function call(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++sequence;
            const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timed out')); }, 10000);
            pending.set(id, { resolve, reject, timer });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }
    let contextId;
    async function evaluate(expression, id = contextId) {
        const r = await call('Runtime.evaluate', { expression, contextId: id, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
        return r.result.value;
    }
    async function key(key, modifiers = 0, repeat = false) {
        const code = { Backspace: 8, Enter: 13, Escape: 27, ArrowLeft: 37, ArrowRight: 39,
            ArrowUp: 38, F8: 119, F9: 120, '.': 190, ',': 188, '-': 189, '/': 191 }[key] || key.toUpperCase().charCodeAt(0);
        const text = key.length === 1 && !(modifiers & 14) ? key : undefined;
        const params = { key, text, unmodifiedText: text, modifiers, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, autoRepeat: repeat };
        await call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    }
    async function type(text) { for (const k of text) await key(k); await delay(120); }
    async function read() {
        if (kind === 'cell') {
            await key('Enter');
            await key('ArrowUp');
            await delay(100);
            return evaluate('imeTestApi.asc_getCellInfo().asc_getText()');
        }
        return evaluate('imeTestApi.asc_EditSelectAll(); imeTestApi.pluginMethod_GetSelectedText({})');
    }
    async function reset() {
        if (kind === 'cell') {
            await evaluate('imeTestApi.asc_emptyCells(Asc.c_oAscCleanOptions.Text, false); document.getElementById("area_id").focus()');
            await delay(100);
            return;
        }
        await evaluate('imeTestApi.asc_EditSelectAll(); document.getElementById("area_id").focus()');
        await key('Backspace');
        await delay(100);
    }
    const results = [];
    try {
        await call('Runtime.enable');
        for (let i = 0; i < 60 && !contextId; i++) {
            for (const c of contexts.filter(c => c.auxData?.isDefault)) {
                if (await evaluate('!!(window.editor || window.Asc?.editor) && !!document.getElementById("area_id") && !!window.VietnameseIME', c.id)) contextId = c.id;
            }
            if (!contextId) await delay(500);
        }
        assert.ok(contextId, 'Editor and IME are loaded');
        await evaluate('window.imeTestApi = window.editor || window.Asc.editor; document.getElementById("area_id").focus()');
        // Explicit opt-in for rerunning on the same disposable test document.
        // Never pass this flag for a user document.
        if (process.argv.includes('--reset-scratch')) await reset();
        assert.equal((await read()).trim(), '', 'Refusing to modify a nonempty document');
        // Keep corpus assertions independent from Word's automatic sentence
        // capitalization. This changes only the scratch editor's SDK setting.
        if (kind === 'word') await evaluate('imeTestApi.asc_SetAutoCorrectFirstLetterOfSentences(false)');
        await evaluate('document.getElementById("area_id").focus(); VietnameseIME.setMode("telex"); VietnameseIME.setEnabled(true)');
        const shortcuts = await evaluate('[[false,false],[false,true]].map(p=>imeTestApi.asc_getShortcutAction(119,p[0],p[1],false))');
        assert.deepEqual(shortcuts, [0, 0], 'F8 and Shift+F8 must be unbound in the native SDK');
        await key('F8');
        assert.equal(await evaluate('VietnameseIME.isEnabled()'), false);
        await key('F8', 0, true);
        assert.equal(await evaluate('VietnameseIME.isEnabled()'), false, 'Autorepeat must not toggle');
        await type('hieeus');
        assert.equal((await read()).trim(), 'hieeus', 'Disabled IME must pass input unchanged');
        await reset();
        await key('F8');
        assert.equal(await evaluate('VietnameseIME.isEnabled()'), true);
        await key('F8', 8);
        assert.equal(await evaluate('VietnameseIME.getMode()'), 'vni');
        await key('F8', 8);
        assert.equal(await evaluate('VietnameseIME.getMode()'), 'telex');
        results.push({ test: 'F8 enable/disable, autorepeat, Shift+F8 mode', passed: true, shortcuts });
        const cases = {
            telex: [['hieeus', 'hiếu'], ['hiese', 'hiế'], ['hieesng', 'hiếng'], ['HIEEUS', 'HIẾU'],
                ['hie61u', 'hie61u'], ['nguwowif', 'người'], ['nguowif', 'người'], ['quowr', 'quở'],
                ['quys', 'quý'], ['gias', 'giá'], ['gieengs', 'giếng'], ['tuyeenr', 'tuyển'],
                ['tieengs', 'tiếng'], ['dd', 'đ'], ['aaa', 'aa'], ['ass', 'as'], ['ddd', 'dd'],
                ['aww', 'aw'], ['muwa', 'mưa'], ['muas', 'múa'], ['thuowng', 'thương'],
                ['dduowngf', 'đường'], ['hosa', 'hoá'], ['hoangf', 'hoàng'],
                ['hieeus, tieengs Vieetj Nam.', 'hiếu, tiếng Việt Nam.']],
            vni: [['hie61u', 'hiếu'], ['hieeus', 'hieeus'], ['dd', 'dd'], ['a6', 'â'], ['a8', 'ă'],
                ['u7', 'ư'], ['d9', 'đ'], ['ho1a', 'hoá'], ['qua3', 'quả'], ['gia3', 'giả'],
                ['nguo72i', 'người'], ['quo73', 'quở'], ['d9a1', 'đá'], ['a11', 'a1'],
                ['a66', 'a6'], ['d99', 'd9'], ['HIE61U', 'HIẾU'], ['A63N1', 'ẤN']]
        };
        for (const [mode, list] of Object.entries(cases)) {
            await evaluate(`VietnameseIME.setMode(${JSON.stringify(mode)})`);
            for (const [keys, expected] of list) {
                await reset();
                await type(keys);
                const actual = (await read()).replace(/\r?\n$/, '');
                const passed = actual === expected;
                results.push({ mode, keys, expected, actual, passed });
                console.log(JSON.stringify(results.at(-1)));
                assert.equal(actual, expected, mode + ': ' + keys);
            }
        }
        if (kind === 'word') {
            await reset();
            await evaluate('VietnameseIME.setMode("telex")');
            await type('hieeus');
            await key('Backspace');
            await type('u');
            assert.equal((await read()).trim(), 'hiếu', 'Backspace and retyping must preserve tone placement');
            // read() leaves the whole document selected; the first character must
            // replace the selection rather than transform the previous word.
            await type('tieengs');
            assert.equal((await read()).trim(), 'tiếng', 'Typing over selected text');
            await key('ArrowRight');
            await key('ArrowLeft');
            await type('x');
            assert.equal((await read()).trim(), 'tiếnxg', 'Cursor movement must not rewrite the trailing text');
            results.push({ test: 'Backspace, selection replacement, cursor insertion', passed: true });
        }
        // Keep a readable real-document screenshot after all assertions.
        await reset();
        await evaluate('VietnameseIME.setMode("telex")');
        await type('hieeus - tieengs Vieetj - nguowif - dduowngf');
        if (kind === 'cell') await read();
        await key('ArrowRight');
        await delay(700);
        fs.mkdirSync(out, { recursive: true });
        const screenshot = await call('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(out, kind + '.png'), Buffer.from(screenshot.data, 'base64'));
    } finally {
        fs.mkdirSync(out, { recursive: true });
        fs.writeFileSync(path.join(out, kind + '.json'), JSON.stringify({ timestamp: new Date().toISOString(), url: tab.url, results }, null, 2) + '\n');
        ws.close();
    }
    console.log('ONLYOFFICE real ' + kind + ' runtime passed: ' + results.length + ' checks');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
