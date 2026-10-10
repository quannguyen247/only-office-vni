# Vietnamese IME for ONLYOFFICE Desktop

## Dùng bản đã cài

Bản IME đã được áp dụng trực tiếp vào ONLYOFFICE Desktop Editors Flatpak 9.4.0 của tài khoản `quan`. Mở ONLYOFFICE bằng launcher bình thường hoặc:

```sh
flatpak run org.onlyoffice.desktopeditors
```

F8 bật/tắt bộ gõ nội bộ. Shift+F8 đổi VNI/Telex; thông báo góc trên cho biết chế độ. Ctrl+Shift không còn bật/tắt IME. Giữ F8 không đảo trạng thái liên tục.

Cấu hình bàn giao là VNI bật. [Kiểm tra đóng/mở app](test/evidence/2026-10-10/preferences-restart.json) xác nhận mode và trạng thái bật được giữ trong phiên Word mới.

F9 vẫn dành cho cập nhật field trong Word và tính lại công thức trong Spreadsheet. SDK đang cài trả về shortcut action `0` cho F8 và Shift+F8 ở cả hai editor; cấu hình KDE hiện tại cũng không có binding F8.

Chỉ dùng một bộ gõ tại một thời điểm: khi bật IME nội bộ, để UniKey hệ thống ở chế độ English cho ONLYOFFICE. Khi dùng UniKey hệ thống, tắt IME nội bộ bằng F8. Event đang composition được bỏ qua để tránh xử lý hai lần; kiểm tra này không thay thế thử nghiệm mọi bộ gõ Wayland.

Trong Telex, `hieeus` → `hiếu`, còn `hie61u` giữ nguyên. Trong VNI, `hie61u` → `hiếu`, còn `hieeus` và `dd` giữ nguyên. Phím thoát dấu lặp cũng được giữ: `aaa` → `aa`, `ass` → `as`, `ddd` → `dd`; VNI `a11` → `a1`, `a66` → `a6`, `d99` → `d9`.

## Build và áp dụng lại

Phần thay đổi là asset JavaScript độc lập, được dùng bởi SDK/CEF đã cài. Đây là build gói IME, không phải biên dịch lại C++ DesktopEditors hay toàn bộ Grunt web-apps.

Từ gốc repo:

```sh
node build/vietnamese-ime.cjs
```

Build chạy kiểm tra cú pháp, regression rồi tạo `deploy/web-apps/apps/common/main/lib/util/vietnamese-ime.js` và manifest SHA-256 `deploy/vietnamese-ime.json`. Không cần tải dependency.

Đóng ONLYOFFICE bình thường trước khi áp dụng. Các lệnh sau chỉ phù hợp với bản desktop đã có hook `vietnamese-ime.js` trong `index.html`, như bản 9.4.0 đã kiểm tra:

```sh
ime_deployment="$(flatpak info --show-location org.onlyoffice.desktopeditors)"
ime_apps="$ime_deployment/files/bin/opt/onlyoffice/desktopeditors/editors/web-apps/apps"
ime_target="$ime_apps/common/main/lib/util/vietnamese-ime.js"
test -f "$ime_target" || exit 1
rg -q 'vietnamese-ime.js' "$ime_apps/documenteditor/main/index.html" || exit 1
rg -q 'vietnamese-ime.js' "$ime_apps/spreadsheeteditor/main/index.html" || exit 1
mkdir -p deploy/ime-backup
cp -n -p "$ime_target" "deploy/ime-backup/vietnamese-ime.$(date +%Y%m%d-%H%M%S).js"
install -m 644 deploy/web-apps/apps/common/main/lib/util/vietnamese-ime.js "$ime_target"
cmp deploy/web-apps/apps/common/main/lib/util/vietnamese-ime.js "$ime_target"
flatpak run org.onlyoffice.desktopeditors
```

Flatpak update/repair có thể thay thế file đã patch. Khi đó kiểm tra hook và áp dụng lại; không ghi đè mù một phiên bản mới. Trong checkout này, 11 template `.html.deploy` cũng có hook inline để các lần Grunt build sau không bỏ sót IME.

Bản trước khi áp dụng được giữ tại `deploy/ime-backup/vietnamese-ime.before-2026-10-10.js`. Muốn khôi phục, đóng app, lấy đúng deployment như trên rồi `install -m 644` file backup vào đúng `ime_target`.

## Bằng chứng ngày 2026-10-10

ONLYOFFICE Desktop Editors 9.4.0, Flatpak user deployment commit:

```text
5806f4728bd3e2bc5314c2c0dfbc59d10dcac33516b5536ac12ceae2e79f98c1
```

SHA-256 của source, asset build và file đang cài giống nhau:

```text
ceb7b61f54638a1992249482c1212118f4597a4f428bb1220311d4d1b09dbae9
```

`node build/vietnamese-ime.cjs`, `node --check test/onlyoffice-runtime.cjs` và `git diff --check` đã qua.

Bài kiểm tra runtime gửi keyDown/keyUp qua CDP vào CEF của app đang chạy, không tiêm source sửa đổi vào trang. Word được đọc lại từ `pluginMethod_GetSelectedText`; Spreadsheet được đọc từ `asc_getCellInfo().asc_getText()` sau Enter, không lấy textarea làm kết quả.

- Word: 45 kiểm tra qua, gồm 43 chuỗi gõ, hotkey và nhóm Backspace/thay vùng chọn/chèn con trỏ. [Log](test/evidence/2026-10-10/word.json), [ảnh](test/evidence/2026-10-10/word.png).
- Spreadsheet: 44 kiểm tra qua, gồm 43 chuỗi gõ và hotkey. [Log](test/evidence/2026-10-10/cell.json), [ảnh](test/evidence/2026-10-10/cell.png).

Các chuỗi bao phủ `hiếu`, dấu sớm, chữ hoa, `người`, `quở`, `giếng`, `tuyển`, `đường`, phím lặp, phân cách và cách ly hai mode. Bài Word tắt AutoCorrect viết hoa đầu câu trong tài liệu thử để tránh lẫn tính năng đó với IME. Các check SDK có action `0` chỉ xác nhận binding mặc định, không đảm bảo mọi shortcut tùy biến của người dùng đều trống.

Quy tắc dấu và phím lặp được đối chiếu với Bamboo trong source UniKey-Wayland tại `/home/quan/Desktop/Temp/Unikey-Wayland-Final/wayland-client/src/vendor/github.com/BambooEngine/bamboo-core`, đặc biệt `findToneTarget`, `refreshLastToneTarget` và `generateTransformations`. Không chuyển cả engine Go thành dependency của web-apps.

CEF của bản này không hỗ trợ `Browser.setDownloadBehavior` mà Playwright cần khi attach. Vì vậy test dùng CDP page-level với Node WebSocket có sẵn. Đây là kiểm chứng runtime editor thật bằng bàn phím tự động, không phải tuyên bố đã thử mọi tổ hợp phím vật lý/bộ gõ ngoài. Slide/PDF/Visio mới được kiểm tra hook, chưa có corpus runtime riêng.

## Chạy lại runtime test

Chỉ chạy trên tài liệu thử mới, trống. Không attach vào tài liệu làm việc: test gõ rồi xóa nội dung thử.

```sh
flatpak run org.onlyoffice.desktopeditors --new=doc --ascdesktop-support-debug-info
```

Trong terminal khác, từ repo:

```sh
node test/onlyoffice-runtime.cjs word
```

Đóng phiên thử rồi mở bảng tính trống:

```sh
flatpak run org.onlyoffice.desktopeditors --new=cell --ascdesktop-support-debug-info
node test/onlyoffice-runtime.cjs cell
```

CEF debug dùng cổng 8080. Test ghi JSON/PNG vào `deploy/ime-evidence`; mặc định từ chối nội dung không trống. `--reset-scratch` chỉ dành cho chạy lại đúng tài liệu thử dùng một lần. Đóng phiên debug sau kiểm tra, mở app bình thường để sử dụng.
