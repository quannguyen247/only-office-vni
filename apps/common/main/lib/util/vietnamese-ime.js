/**
 * (c) Copyright Ascensio System SIA 2026
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(window, undefined) {
    'use strict';

    var STORAGE_KEY_ENABLED = 'vietnamese-ime-enabled';
    var STORAGE_KEY_MODE = 'vietnamese-ime-mode';
    var MODE_TELEX = 'telex';
    var MODE_VNI = 'vni';

    // Disabled by default to prevent unintended input mutations for international users
    var enabled = false;
    var inputMode = MODE_TELEX;

    function normalizeMode(mode) {
        return String(mode).toLowerCase() === MODE_VNI ? MODE_VNI : MODE_TELEX;
    }

    function modeLabel() {
        return inputMode === MODE_VNI ? 'VNI' : 'Telex';
    }

    // Load persisted user preference from localStorage
    try {
        if (window.localStorage) {
            var storedEnabled = window.localStorage.getItem(STORAGE_KEY_ENABLED);
            if (storedEnabled !== null) {
                enabled = (storedEnabled === 'true');
            }
            var storedMode = window.localStorage.getItem(STORAGE_KEY_MODE);
            if (storedMode !== null) {
                inputMode = normalizeMode(storedMode);
            }
        }
    } catch (e) {}

    var vowels = {
        'a': { 0: 'a', 1: 'á', 2: 'à', 3: 'ả', 4: 'ã', 5: 'ạ', 'hat': 'â', 'hat1': 'ấ', 'hat2': 'ầ', 'hat3': 'ẩ', 'hat4': 'ẫ', 'hat5': 'ậ', 'breve': 'ă', 'breve1': 'ắ', 'breve2': 'ằ', 'breve3': 'ẳ', 'breve4': 'ẵ', 'breve5': 'ặ' },
        'e': { 0: 'e', 1: 'é', 2: 'è', 3: 'ẻ', 4: 'ẽ', 5: 'ẹ', 'hat': 'ê', 'hat1': 'ế', 'hat2': 'ề', 'hat3': 'ể', 'hat4': 'ễ', 'hat5': 'ệ' },
        'i': { 0: 'i', 1: 'í', 2: 'ì', 3: 'ỉ', 4: 'ĩ', 5: 'ị' },
        'o': { 0: 'o', 1: 'ó', 2: 'ò', 3: 'ỏ', 4: 'õ', 5: 'ọ', 'hat': 'ô', 'hat1': 'ố', 'hat2': 'ồ', 'hat3': 'ổ', 'hat4': 'ỗ', 'hat5': 'ộ', 'horn': 'ơ', 'horn1': 'ớ', 'horn2': 'ờ', 'horn3': 'ở', 'horn4': 'ỡ', 'horn5': 'ợ' },
        'u': { 0: 'u', 1: 'ú', 2: 'ù', 3: 'ủ', 4: 'ũ', 5: 'ụ', 'horn': 'ư', 'horn1': 'ứ', 'horn2': 'ừ', 'horn3': 'ử', 'horn4': 'ữ', 'horn5': 'ự' },
        'y': { 0: 'y', 1: 'ý', 2: 'ỳ', 3: 'ỷ', 4: 'ỹ', 5: 'ỵ' },
        'd': { 0: 'd', 'bar': 'đ' }
    };

    var toneMap = {
        'á': ['a', 1], 'à': ['a', 2], 'ả': ['a', 3], 'ã': ['a', 4], 'ạ': ['a', 5],
        'ấ': ['a', 1, 'hat'], 'ầ': ['a', 2, 'hat'], 'ẩ': ['a', 3, 'hat'], 'ẫ': ['a', 4, 'hat'], 'ậ': ['a', 5, 'hat'],
        'ắ': ['a', 1, 'breve'], 'ằ': ['a', 2, 'breve'], 'ẳ': ['a', 3, 'breve'], 'ẵ': ['a', 4, 'breve'], 'ặ': ['a', 5, 'breve'],
        'é': ['e', 1], 'è': ['e', 2], 'ẻ': ['e', 3], 'ẽ': ['e', 4], 'ẹ': ['e', 5],
        'ế': ['e', 1, 'hat'], 'ề': ['e', 2, 'hat'], 'ể': ['e', 3, 'hat'], 'ễ': ['e', 4, 'hat'], 'ệ': ['e', 5, 'hat'],
        'í': ['i', 1], 'ì': ['i', 2], 'ỉ': ['i', 3], 'ĩ': ['i', 4], 'ị': ['i', 5],
        'ó': ['o', 1], 'ò': ['o', 2], 'ỏ': ['o', 3], 'õ': ['o', 4], 'ọ': ['o', 5],
        'ố': ['o', 1, 'hat'], 'ồ': ['o', 2, 'hat'], 'ổ': ['o', 3, 'hat'], 'ỗ': ['o', 4, 'hat'], 'ộ': ['o', 5, 'hat'],
        'ớ': ['o', 1, 'horn'], 'ờ': ['o', 2, 'horn'], 'ở': ['o', 3, 'horn'], 'ỡ': ['o', 4, 'horn'], 'ợ': ['o', 5, 'horn'],
        'ú': ['u', 1], 'ù': ['u', 2], 'ủ': ['u', 3], 'ũ': ['u', 4], 'ụ': ['u', 5],
        'ứ': ['u', 1, 'horn'], 'ừ': ['u', 2, 'horn'], 'ử': ['u', 3, 'horn'], 'ữ': ['u', 4, 'horn'], 'ự': ['u', 5, 'horn'],
        'ý': ['y', 1], 'ỳ': ['y', 2], 'ỷ': ['y', 3], 'ỹ': ['y', 4], 'ỵ': ['y', 5],
        'â': ['a', 0, 'hat'], 'ă': ['a', 0, 'breve'],
        'ê': ['e', 0, 'hat'],
        'ô': ['o', 0, 'hat'], 'ơ': ['o', 0, 'horn'],
        'ư': ['u', 0, 'horn'],
        'đ': ['d', 0, 'bar']
    };

    function decomposeChar(c) {
        var isUpper = c === c.toUpperCase() && c !== c.toLowerCase();
        var low = c.toLowerCase();
        if (toneMap[low]) {
            var info = toneMap[low];
            var base = isUpper ? info[0].toUpperCase() : info[0];
            return { base: base, tone: info[1] || 0, mod: info[2] || null };
        }
        return { base: c, tone: 0, mod: null };
    }

    function composeChar(base, tone, mod) {
        var isUpper = base === base.toUpperCase() && base !== base.toLowerCase();
        var b = base.toLowerCase();
        if (!vowels[b]) return base;
        var key = mod ? (mod + (tone > 0 ? tone : '')) : (tone > 0 ? tone : 0);
        var res = vowels[b][key] || vowels[b][mod] || vowels[b][tone] || vowels[b][0] || base;
        return isUpper ? res.toUpperCase() : res;
    }

    function isVowel(c) {
        var low = c.toLowerCase();
        return 'aáàảãạâấầẩẫậăắằẳẵặeéèẻẽẹêếềểễệiíìỉĩịoóòỏõọôốồổỗộơớờởỡợuúùủũụưứừửữựyýỳỷỹỵ'.indexOf(low) !== -1;
    }

    function isConsonant(c) {
        var low = c.toLowerCase();
        return 'bcdfghjklmnpqrstvwxzđ'.indexOf(low) !== -1;
    }

    function applyD(word, key) {
        for (var i = word.length - 1; i >= 0; i--) {
            var c = word[i];
            if (c === 'd') return word.slice(0, i) + 'đ' + word.slice(i + 1);
            if (c === 'D') return word.slice(0, i) + 'Đ' + word.slice(i + 1);
            if (c === 'đ') return word.slice(0, i) + 'd' + word.slice(i + 1) + key;
            if (c === 'Đ') return word.slice(0, i) + 'D' + word.slice(i + 1) + key;
        }
        return null;
    }

    function applyModifier(word, targetMod, key) {
        for (var i = word.length - 1; i >= 0; i--) {
            var c = word[i];
            var d = decomposeChar(c);
            var b = d.base.toLowerCase();
            if (targetMod === 'hat' && (b === 'a' || b === 'e' || b === 'o')) {
                var newMod = d.mod === 'hat' ? null : 'hat';
                var nc = composeChar(d.base, d.tone, newMod);
                return word.slice(0, i) + nc + word.slice(i + 1) + (newMod ? '' : key);
            }
            if (targetMod === 'horn' && (b === 'u' || b === 'o')) {
                if (i > 0 && decomposeChar(word[i - 1]).base.toLowerCase() === 'u' && b === 'o' &&
                    !(i > 1 && word[i - 2].toLowerCase() === 'q')) {
                    var d_u = decomposeChar(word[i - 1]);
                    var pairMod = d_u.mod === 'horn' && d.mod === 'horn' ? null : 'horn';
                    var nc_u = composeChar(d_u.base, d_u.tone, pairMod);
                    var nc_o = composeChar(d.base, d.tone, pairMod);
                    return word.slice(0, i - 1) + nc_u + nc_o + word.slice(i + 1) + (pairMod ? '' : key);
                }
                var newMod = d.mod === 'horn' ? null : 'horn';
                var nc = composeChar(d.base, d.tone, newMod);
                return word.slice(0, i) + nc + word.slice(i + 1) + (newMod ? '' : key);
            }
            if (targetMod === 'breve' && b === 'a') {
                var newMod = d.mod === 'breve' ? null : 'breve';
                var nc = composeChar(d.base, d.tone, newMod);
                return word.slice(0, i) + nc + word.slice(i + 1) + (newMod ? '' : key);
            }
        }
        return null;
    }

    function applyModifierSpecific(word, targetBase, targetMod, key) {
        for (var i = word.length - 1; i >= 0; i--) {
            var d = decomposeChar(word[i]);
            if (d.base.toLowerCase() === targetBase) {
                var newMod = d.mod === targetMod ? null : targetMod;
                var nc = composeChar(d.base, d.tone, newMod);
                return word.slice(0, i) + nc + word.slice(i + 1) + (newMod ? '' : key);
            }
        }
        return null;
    }

    function applyTelexW(word, key) {
        for (var i = word.length - 1; i >= 0; i--) {
            var d = decomposeChar(word[i]);
            var b = d.base.toLowerCase();
            if (b === 'u' || b === 'o') {
                if (i > 0 && decomposeChar(word[i - 1]).base.toLowerCase() === 'u' && b === 'o' &&
                    !(i > 1 && word[i - 2].toLowerCase() === 'q')) {
                    var d_u = decomposeChar(word[i - 1]);
                    var pairMod = d_u.mod === 'horn' && d.mod === 'horn' ? null : 'horn';
                    var nc_u = composeChar(d_u.base, d_u.tone, pairMod);
                    var nc_o = composeChar(d.base, d.tone, pairMod);
                    return word.slice(0, i - 1) + nc_u + nc_o + word.slice(i + 1) + (pairMod ? '' : key);
                }
                var newMod = d.mod === 'horn' ? null : 'horn';
                var nc = composeChar(d.base, d.tone, newMod);
                return word.slice(0, i) + nc + word.slice(i + 1) + (newMod ? '' : key);
            }
            if (b === 'a') {
                var newMod = d.mod === 'breve' ? null : 'breve';
                var nc = composeChar(d.base, d.tone, newMod);
                return word.slice(0, i) + nc + word.slice(i + 1) + (newMod ? '' : key);
            }
        }
        return null;
    }

    function findToneVowelIndex(word) {
        var vowelIndices = [];
        for (var i = 0; i < word.length; i++) {
            if (isVowel(word[i])) vowelIndices.push(i);
        }
        if (vowelIndices.length === 0) return -1;
        if (vowelIndices.length === 1) return vowelIndices[0];

        // Bamboo treats qu and most gi sequences as qualified leading
        // consonants.  The u in "quả" and the i in "già" therefore must
        // not win the tone target over the actual vowel.
        var firstVowel = vowelIndices[0];
        var firstBase = decomposeChar(word[firstVowel]).base.toLowerCase();
        if (firstVowel > 0 && word[firstVowel - 1].toLowerCase() === 'q' && firstBase === 'u') {
            vowelIndices.shift();
        } else if (firstVowel > 0 && word[firstVowel - 1].toLowerCase() === 'g' && firstBase === 'i') {
            var secondBase = decomposeChar(word[vowelIndices[1]]).base.toLowerCase();
            var rawLastVowel = vowelIndices[vowelIndices.length - 1];
            var hasRawEndConsonant = rawLastVowel < word.length - 1 && isConsonant(word[word.length - 1]);
            if (!(secondBase === 'e' && hasRawEndConsonant)) {
                vowelIndices.shift();
            }
        }

        if (vowelIndices.length === 0) return -1;

        // A marked vowel is the nucleus of the syllable.  This is the case
        // that the old first-vowel rule missed: i + ê + u must become hiếu.
        var markedVowels = vowelIndices.filter(function(idx) {
            return !!decomposeChar(word[idx]).mod;
        });
        if (markedVowels.length > 0) {
            return markedVowels[markedVowels.length - 1];
        }

        var vowelString = vowelIndices.map(function(idx) {
            return decomposeChar(word[idx]).base.toLowerCase();
        }).join('');

        // Bamboo places the tone on the middle vowel in three-vowel
        // sequences, except for uye where it is on e.
        if (vowelIndices.length === 3) {
            return vowelString === 'uye' ? vowelIndices[2] : vowelIndices[1];
        }

        var lastVowelIdx = vowelIndices[vowelIndices.length - 1];
        var hasEndConsonant = lastVowelIdx < word.length - 1 && isConsonant(word[word.length - 1]);

        if (hasEndConsonant) {
            return vowelIndices[vowelIndices.length - 1];
        } else {
            if (vowelString === 'oa' || vowelString === 'oe' || vowelString === 'uy' ||
                vowelString === 'ue' || vowelString === 'uo') {
                return vowelIndices[1];
            }
            return vowelIndices[0];
        }
    }

    function applyTone(word, targetTone, key) {
        var targetIdx = findToneVowelIndex(word);
        if (targetIdx === -1) return null;

        var escaped = targetTone > 0 && decomposeChar(word[targetIdx]).tone === targetTone;
        var newChars = [];
        for (var i = 0; i < word.length; i++) {
            var d = decomposeChar(word[i]);
            if (isVowel(word[i])) {
                var toneToSet = (i === targetIdx) ? (d.tone === targetTone ? 0 : targetTone) : 0;
                newChars.push(composeChar(d.base, toneToSet, d.mod));
            } else {
                newChars.push(word[i]);
            }
        }
        var res = newChars.join('') + (escaped ? key : '');
        return res === word ? null : res;
    }

    function normalizeTonePlacement(word) {
        var targetIdx = findToneVowelIndex(word);
        if (targetIdx === -1) return word;

        var tone = 0;
        for (var i = 0; i < word.length; i++) {
            var d = decomposeChar(word[i]);
            if (isVowel(word[i]) && d.tone > 0) {
                tone = d.tone;
                break;
            }
        }
        if (tone === 0) return word;

        var newChars = [];
        for (var j = 0; j < word.length; j++) {
            var current = decomposeChar(word[j]);
            if (isVowel(word[j])) {
                newChars.push(composeChar(current.base, j === targetIdx ? tone : 0, current.mod));
            } else {
                newChars.push(word[j]);
            }
        }
        return newChars.join('');
    }

    function finishTransformation(word, transformed) {
        if (!transformed || transformed === word) return null;
        var normalized = normalizeTonePlacement(transformed);
        return normalized === word ? null : normalized;
    }

    function processVniWord(word, key) {
        var transformed = null;
        if (key === '1') transformed = applyTone(word, 1, key);
        if (key === '2') transformed = applyTone(word, 2, key);
        if (key === '3') transformed = applyTone(word, 3, key);
        if (key === '4') transformed = applyTone(word, 4, key);
        if (key === '5') transformed = applyTone(word, 5, key);
        if (key === '0') transformed = applyTone(word, 0, key);
        if (key === '6') transformed = applyModifier(word, 'hat', key);
        if (key === '7') transformed = applyModifier(word, 'horn', key);
        if (key === '8') transformed = applyModifier(word, 'breve', key);
        if (key === '9') transformed = applyD(word, key);
        return finishTransformation(word, transformed);
    }

    function processTelexWord(word, key) {
        var transformed = null;
        var lowerKey = key.toLowerCase();
        if (lowerKey === 's') transformed = applyTone(word, 1, key);
        if (lowerKey === 'f') transformed = applyTone(word, 2, key);
        if (lowerKey === 'r') transformed = applyTone(word, 3, key);
        if (lowerKey === 'x') transformed = applyTone(word, 4, key);
        if (lowerKey === 'j') transformed = applyTone(word, 5, key);
        if (lowerKey === 'z') transformed = applyTone(word, 0, key);
        if (lowerKey === 'a') transformed = applyModifierSpecific(word, 'a', 'hat', key);
        if (lowerKey === 'e') transformed = applyModifierSpecific(word, 'e', 'hat', key);
        if (lowerKey === 'o') transformed = applyModifierSpecific(word, 'o', 'hat', key);
        if (lowerKey === 'w') transformed = applyTelexW(word, key);
        if (lowerKey === 'd') transformed = applyD(word, key);
        return finishTransformation(word, transformed);
    }

    function processWord(word, key) {
        if (!word) return null;
        return inputMode === MODE_VNI ? processVniWord(word, key) : processTelexWord(word, key);
    }

    var TELEX_WORD_PATTERN = /[a-zA-ZáàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]+$/;
    var VNI_WORD_PATTERN = new RegExp(TELEX_WORD_PATTERN.source.replace('[a-zA-Z', '[a-zA-Z0-9'));

    // Standard English Toast feedback
    var toastTimer = null;
    function showToast(text) {
        var toast = document.getElementById('vietime-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'vietime-toast';
            toast.style.cssText = 'position:fixed;top:45px;right:25px;z-index:999999;background:rgba(25,25,25,0.92);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;padding:6px 14px;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(8px);pointer-events:none;transition:opacity 0.25s ease, transform 0.25s ease;opacity:0;transform:translateY(-8px);';
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px)';
        }, 1100);
    }

    function setInputMode(mode, notify) {
        inputMode = normalizeMode(mode);
        try {
            if (window.localStorage) {
                window.localStorage.setItem(STORAGE_KEY_MODE, inputMode);
            }
        } catch (e) {}
        if (notify) {
            showToast('Vietnamese IME: ' + modeLabel());
        }
        return inputMode;
    }

    function handleKeyDown(e) {
        // F8 is unused by the editor's default shortcuts. Shift+F8 selects
        // the input method; bare F8 enables/disables Vietnamese input.
        if (e.key === 'F8' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.repeat) return;
            if (e.shiftKey) {
                setInputMode(inputMode === MODE_VNI ? MODE_TELEX : MODE_VNI, true);
            } else {
                window.VietnameseIME.setEnabled(!enabled);
                showToast(enabled ? 'Vietnamese IME: ON (' + modeLabel() + ')' : 'Vietnamese IME: OFF');
            }
            return;
        }

        if (!enabled) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.isComposing || e.keyCode === 229) return;

        var key = e.key;
        if (!key || key.length !== 1) return;

        var target = e.target || document.activeElement;
        if (!target) return;
        if (target.readOnly || target.disabled || target.type === 'password') return;

        var isInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        // The editors use a hidden textarea. Rewriting innerText of arbitrary
        // rich HTML would destroy formatting and ignore its DOM selection.
        if (!isInput) return;

        var fullText = target.value;
        if (typeof fullText !== 'string') return;

        var cursorPos = fullText.length;
        if (isInput) {
            if (typeof target.selectionStart !== 'number' || typeof target.selectionEnd !== 'number' ||
                target.selectionStart !== target.selectionEnd) {
                return;
            }
            cursorPos = target.selectionStart;
        }

        var beforeCursor = fullText.slice(0, cursorPos);
        var wordPattern = inputMode === MODE_VNI ? VNI_WORD_PATTERN : TELEX_WORD_PATTERN;
        var match = beforeCursor.match(wordPattern);

        if (!match) return;

        var currentWord = match[0];
        var transformed = processWord(currentWord, key);

        // Bamboo re-evaluates a tone when a later ordinary letter changes the
        // vowel structure.  Preserve that behavior for early-tone sequences
        // such as "hosa" -> "hoá".
        if (!transformed && wordPattern.test(currentWord + key)) {
            var insertedWord = currentWord + key;
            var normalizedWord = normalizeTonePlacement(insertedWord);
            if (normalizedWord !== insertedWord) {
                transformed = normalizedWord;
            }
        }

        if (transformed && transformed !== currentWord) {
            e.preventDefault();
            e.stopPropagation();

            var wordStart = cursorPos - currentWord.length;
            var afterCursor = fullText.slice(cursorPos);
            var newText = fullText.slice(0, wordStart) + transformed + afterCursor;
            var newCursor = wordStart + transformed.length;

            target.value = newText;
            target.setSelectionRange(newCursor, newCursor);

            var inputEvt = null;
            var InputEventCtor = window.InputEvent || (typeof InputEvent !== 'undefined' ? InputEvent : null);
            if (InputEventCtor) {
                try {
                    inputEvt = new InputEventCtor('input', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: transformed
                    });
                } catch (err) {}
            }
            if (!inputEvt && document.createEvent) {
                inputEvt = document.createEvent('Event');
                inputEvt.initEvent('input', true, true);
            }
            if (inputEvt) target.dispatchEvent(inputEvt);
        }
    }

    // Expose programmatic API for external plugins/controls
    window.VietnameseIME = {
        isEnabled: function() { return enabled; },
        getMode: function() { return inputMode; },
        setEnabled: function(val) {
            enabled = !!val;
            try { if (window.localStorage) window.localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false'); } catch (e) {}
        },
        setMode: function(mode) {
            return setInputMode(mode, false);
        },
        toggleMode: function() {
            return setInputMode(inputMode === MODE_VNI ? MODE_TELEX : MODE_VNI, false);
        }
    };

    // Register event listener
    window.addEventListener('keydown', handleKeyDown, true);

})(window);
