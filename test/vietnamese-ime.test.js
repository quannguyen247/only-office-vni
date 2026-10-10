'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.join(__dirname, '../apps/common/main/lib/util/vietnamese-ime.js'),
    'utf8'
);

function createIme(mode) {
    const listeners = {};
    const storage = new Map();
    const document = {
        getElementById: () => null,
        createElement: () => ({ style: {} }),
        body: { appendChild() {} }
    };
    const window = {
        localStorage: {
            getItem: (key) => storage.has(key) ? storage.get(key) : null,
            setItem: (key, value) => storage.set(key, value)
        },
        addEventListener: (name, handler) => { listeners[name] = handler; }
    };

    vm.runInNewContext(source, {
        window,
        document,
        setTimeout,
        clearTimeout
    });

    const api = window.VietnameseIME;
    api.setMode(mode);
    api.setEnabled(true);

    function dispatch(event) {
        listeners.keydown(event);
    }

    function type(text, options = {}) {
        const target = {
            tagName: 'INPUT',
            type: 'text',
            value: '',
            selectionStart: 0,
            selectionEnd: 0,
            setSelectionRange(start, end) {
                this.selectionStart = start;
                this.selectionEnd = end;
            },
            dispatchEvent() {},
            ...options.target
        };

        for (const key of text) {
            const event = {
                key,
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                target,
                preventDefault() { this.defaultPrevented = true; },
                stopPropagation() {},
                ...options.event
            };
            dispatch(event);
            if (!event.defaultPrevented) {
                const start = target.selectionStart;
                const end = target.selectionEnd;
                target.value = target.value.slice(0, start) + key + target.value.slice(end);
                target.setSelectionRange(start + key.length, start + key.length);
            }
        }
        return target.value;
    }

    return { api, dispatch, type };
}

const telex = createIme('telex');
assert.equal(telex.type('hieeus'), 'hiếu');
assert.equal(telex.type('hiese'), 'hiế');
assert.equal(telex.type('hieesng'), 'hiếng');
assert.equal(telex.type('nguwowif'), 'người');
assert.equal(telex.type('dd'), 'đ');
assert.equal(telex.type('HIEEUS'), 'HIẾU');
assert.equal(telex.type('hosa'), 'hoá');
assert.equal(telex.type('hie61u'), 'hie61u');
for (const [keys, expected] of [['aaa', 'aa'], ['ass', 'as'], ['ddd', 'dd'],
    ['aww', 'aw'], ['muwa', 'mưa'], ['muas', 'múa'], ['thuowng', 'thương'],
    ['duowngf', 'dường'], ['quowr', 'quở'], ['quys', 'quý'], ['gias', 'giá'],
    ['gieengs', 'giếng'], ['tuyeenr', 'tuyển'], ['tieengs', 'tiếng'], ['nguowif', 'người'],
    ['muwas', 'mứa'], ['dduowngf', 'đường'], ['khuyar', 'khuỷa'],
    ['hoaf', 'hoà'], ['hoangf', 'hoàng']]) {
    assert.equal(telex.type(keys), expected, keys);
}
assert.equal(telex.type('ddax'), 'đã');
assert.equal(telex.type('asz'), 'a');
assert.equal(telex.type('asf'), 'à');
assert.equal(telex.type('hieeuj'), 'hiệu');
assert.equal(telex.api.getMode(), 'telex');
assert.equal(telex.type('aas', { target: { type: 'password' } }), 'aas');
assert.equal(telex.type('aas', { target: { readOnly: true } }), 'aas');
assert.equal(telex.type('aas', { event: { isComposing: true } }), 'aas');
assert.equal(telex.type('aas', { event: { keyCode: 229 } }), 'aas');
assert.equal(telex.type('aas', { target: { tagName: 'DIV', isContentEditable: true, innerText: 'a' } }), 'aas');

const switched = { key: 'F8', ctrlKey: false, altKey: false, shiftKey: true, metaKey: false,
    preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() {} };
telex.dispatch(switched);
assert.equal(telex.api.getMode(), 'vni');
assert.equal(switched.defaultPrevented, true);
telex.dispatch({ ...switched, repeat: true });
assert.equal(telex.api.getMode(), 'vni');
telex.dispatch({ ...switched, shiftKey: false });
assert.equal(telex.api.isEnabled(), false);
telex.dispatch({ ...switched, shiftKey: false });
assert.equal(telex.api.isEnabled(), true);
const fieldShortcut = { ...switched, key: 'F9' };
delete fieldShortcut.defaultPrevented;
telex.dispatch(fieldShortcut);
assert.equal(fieldShortcut.defaultPrevented, undefined);
const previousShortcut = { ...switched, key: 'Shift', ctrlKey: true };
delete previousShortcut.defaultPrevented;
telex.dispatch(previousShortcut);
assert.equal(previousShortcut.defaultPrevented, undefined);
assert.equal(telex.api.isEnabled(), true);

const vni = createIme('vni');
assert.equal(vni.type('hie61u'), 'hiếu');
assert.equal(vni.type('a6'), 'â');
assert.equal(vni.type('a8'), 'ă');
assert.equal(vni.type('u7'), 'ư');
assert.equal(vni.type('d9'), 'đ');
assert.equal(vni.type('ho1a'), 'hoá');
assert.equal(vni.type('qua3'), 'quả');
assert.equal(vni.type('gia3'), 'giả');
assert.equal(vni.type('nguo72i'), 'người');
assert.equal(vni.type('hieeus'), 'hieeus');
assert.equal(vni.type('dd'), 'dd');
for (const [keys, expected] of [['a11', 'a1'], ['a66', 'a6'], ['d99', 'd9'],
    ['quo73', 'quở'], ['d9a1', 'đá'], ['A63N1', 'ẤN']]) {
    assert.equal(vni.type(keys), expected, keys);
}
assert.equal(vni.api.getMode(), 'vni');
assert.equal(vni.type('d9a4'), 'đã');
assert.equal(vni.type('a10'), 'a');
assert.equal(vni.type('a12'), 'à');
assert.equal(vni.type('hie6u5'), 'hiệu');

console.log('Vietnamese IME regression tests passed');
