// Service worker.
//
// Ba việc, theo thứ tự quan trọng:
//
//  1. Chrome, Edge và Chrome trên Android chỉ mời cài ứng dụng khi trang có
//     một service worker biết xử lý `fetch`. Không có file này thì không có
//     nút "Cài ứng dụng".
//  2. Mất mạng thì vỏ ứng dụng vẫn mở được.
//  3. Mở lại nhanh hơn.
//
// **Ưu tiên mạng, không ưu tiên bộ đệm.** Bản Flutter trước đây làm ngược lại
// và cái giá là sau mỗi lần triển khai, lần mở đầu tiên vẫn chạy mã cũ — phải
// tải lại hai lần mới thấy bản mới, và chính tôi đã mất nửa tiếng vì tưởng bản
// vừa đẩy không ăn. Ở đây cả ứng dụng chỉ khoảng 80 KB, nên hỏi mạng trước gần
// như không tốn gì, và đổi lại là đẩy xong một lần tải lại là thấy.
//
// Riêng `vendor/` thì lấy từ bộ đệm trước: KaTeX và font của nó không bao giờ
// đổi mà không đổi tên.

const DEM = 'hsa-web';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (su) => {
  su.waitUntil(
    (async () => {
      for (const ten of await caches.keys()) {
        if (ten !== DEM) await caches.delete(ten);
      }
      await self.clients.claim();
    })(),
  );
});

/** Phản hồi của API gắn với tài khoản đang đăng nhập và với thời điểm gọi.
 *  Đệm chúng là phát bài làm của người này cho người kia. */
function laSong(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin');
}

self.addEventListener('fetch', (su) => {
  const yc = su.request;
  if (yc.method !== 'GET') return;

  const url = new URL(yc.url);
  if (url.origin !== self.location.origin) return;
  if (laSong(url)) return;

  if (url.pathname.includes('/vendor/')) su.respondWith(demTruoc(yc));
  else su.respondWith(mangTruoc(yc));
});

async function mangTruoc(yc) {
  const dem = await caches.open(DEM);
  try {
    const res = await fetch(yc);
    if (res && res.status === 200 && res.type === 'basic') dem.put(yc, res.clone());
    return res;
  } catch (loi) {
    const luu = await dem.match(yc);
    if (luu) return luu;
    // Điều hướng lúc mất mạng: trả trang chính đã lưu, để vỏ ứng dụng vẫn mở
    // ra và tự nói là không gọi được máy chủ, thay vì khủng long của trình
    // duyệt.
    if (yc.mode === 'navigate') {
      const goc = await dem.match(new URL('index.html', self.registration.scope).toString());
      if (goc) return goc;
    }
    throw loi;
  }
}

async function demTruoc(yc) {
  const dem = await caches.open(DEM);
  const luu = await dem.match(yc);
  if (luu) return luu;

  const res = await fetch(yc);
  if (res && res.status === 200 && res.type === 'basic') dem.put(yc, res.clone());
  return res;
}
