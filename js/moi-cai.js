// Mời cài vào màn hình chính.
//
// Bản web là đường phát hành duy nhất cho iPhone — TestFlight đã gãy — nên
// "thêm vào màn hình chính" chính là cách cài đặt, không phải một tiện ích
// thêm thắt. Safari không có nút cài và không bắn sự kiện nào để bắt, nên nếu
// không ai nói ra thì học viên dùng mãi trong một tab trình duyệt.

import { h, bt } from './ui.js';

const KHOA_TAT = 'hsa.tat-moi-cai';

/**
 * Trình duyệt nhúng trong ứng dụng khác.
 *
 * Đây là trường hợp **hay gặp nhất**, không phải hiếm: đường dẫn lớp được gửi
 * qua Zalo, học viên bấm thẳng trong Zalo, và cái mở ra là WebView của Zalo.
 * WebView đó không cài được gì lên màn hình chính và cũng không báo lỗi — nó
 * chỉ im lặng không có mục ấy. Không nhận ra chỗ này thì mọi hướng dẫn "bấm
 * Chia sẻ rồi chọn…" đều chỉ vào một menu không tồn tại.
 */
export function trongUngDungKhac(ua) {
  return /FBAN|FBAV|FB_IAB|Instagram|Messenger|Zalo|MicroMessenger|TikTok|Line\//i.test(ua);
}

/**
 * Máy Apple cầm tay, kể cả iPad đời mới.
 *
 * Từ iPadOS 13, Safari trên iPad khai mình là Macintosh để nhận bản desktop.
 * Chỉ dò chuỗi là bỏ sót toàn bộ iPad — cách phân biệt còn lại là một máy
 * "Mac" mà có cảm ứng thì không phải Mac.
 */
export function laApple(ua, soDiemCham) {
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return ua.includes('Macintosh') && soDiemCham > 1;
}

export function daCaiRoi() {
  // Safari dùng navigator.standalone, chuẩn PWA dùng media query. Không cái
  // nào đủ một mình: media query là chuẩn nhưng Safari đời cũ không có,
  // standalone thì chỉ Apple mới có.
  if (navigator.standalone === true) return true;
  return (
    matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: fullscreen)').matches
  );
}

/**
 * Nên nói gì. Viết thuần để bảng trường hợp kiểm được.
 *
 * Thứ tự là phần dễ sai nhất — nhánh "trong ứng dụng khác" phải đứng trước
 * nhánh Apple, vì WebView của Zalo trên iPhone khớp cả hai.
 */
export function loiKhuyen({ daCai, daTat, trongApp, apple, trinhDuyetCaiDuoc }) {
  if (daCai) return 'khong';
  if (daTat) return 'khong';
  if (trongApp) return 'mo-trinh-duyet';
  if (apple) return 'bang-chia-se';
  if (trinhDuyetCaiDuoc) return 'nut-cai';
  return 'khong';
}

function dang() {
  let daTat = false;
  try {
    daTat = localStorage.getItem(KHOA_TAT) === '1';
  } catch (e) {
    /* chặn localStorage thì coi như chưa tắt; nhắc thừa tốt hơn là hỏng */
  }

  return loiKhuyen({
    daCai: daCaiRoi(),
    daTat,
    trongApp: trongUngDungKhac(navigator.userAgent),
    apple: laApple(navigator.userAgent, navigator.maxTouchPoints || 0),
    trinhDuyetCaiDuoc: typeof hsaCoTheCai === 'function' && hsaCoTheCai(),
  });
}

const CHU = {
  'bang-chia-se': ['Cài vào màn hình chính để mở nhanh lần sau', 'Cách cài', 'ios_share'],
  'mo-trinh-duyet': ['Mở bằng Safari hoặc Chrome để cài được ứng dụng', 'Cách mở', 'open_in_browser'],
  'nut-cai': ['Cài ứng dụng để mở thẳng, không cần trình duyệt', 'Cài', 'install_desktop'],
};

const HUONG_DAN = {
  'bang-chia-se': {
    tieuDe: 'Thêm vào màn hình chính',
    buoc: [
      'Bấm nút Chia sẻ — ô vuông có mũi tên hướng lên. Trên iPhone nó ở giữa thanh dưới, trên iPad ở góc trên bên phải.',
      'Vuốt xuống trong bảng vừa mở, chọn "Thêm vào MH chính" (Add to Home Screen).',
      'Bấm "Thêm" ở góc trên bên phải.',
    ],
    cuoi:
      'Sau đó mở từ biểu tượng ngoài màn hình chính — nó chạy toàn màn hình, không còn thanh địa chỉ. ' +
      'Không thấy mục đó nghĩa là trang đang mở bằng trình duyệt khác Safari.',
  },
  'mo-trinh-duyet': {
    tieuDe: 'Mở bằng trình duyệt',
    buoc: [
      'Bấm dấu ⋯ (hoặc ⋮) ở góc màn hình.',
      'Chọn "Mở trong Safari" trên iPhone, hoặc "Mở bằng trình duyệt" trên Android.',
    ],
    cuoi:
      'Bạn đang xem trong trình duyệt gắn sẵn của Zalo hoặc Facebook. ' +
      'Trình duyệt đó không có mục thêm vào màn hình chính.',
  },
};

export function gan(noi) {
  // Chrome bắn `beforeinstallprompt` muộn hơn lúc ứng dụng khởi động, nên lần
  // hỏi đầu gần như luôn trả lời "chưa cài được". Nghe sự kiện rồi hỏi lại.
  addEventListener('hsa-co-the-cai', () => {
    if (!noi.querySelector('.moi-cai')) gan(noi);
  }, { once: true });

  const kieu = dang();
  if (kieu === 'khong') return;

  const [loi, nhanNut, bieuTuong] = CHU[kieu];

  const dai = h(
    'div',
    { class: 'moi-cai' },
    bt(bieuTuong, 'vua'),
    h('div', { class: 'noi' }, loi),
    h('button', { class: 'phang', onclick: () => bam(kieu, dai) }, nhanNut),
    h(
      'button',
      {
        class: 'bieu-tuong',
        'aria-label': 'Không nhắc nữa',
        onclick: () => {
          try {
            localStorage.setItem(KHOA_TAT, '1');
          } catch (e) {
            /* tắt được trong phiên này là đủ */
          }
          dai.remove();
        },
      },
      bt('close', 'vua'),
    ),
  );

  // Đặt trên cùng, đẩy ứng dụng xuống — không nổi đè. Một dải nổi ở đáy sẽ che
  // đúng thanh nộp bài của màn hình thi.
  noi.prepend(dai);
}

async function bam(kieu, dai) {
  if (kieu === 'nut-cai') {
    let xong = false;
    try {
      xong = await hsaCai();
    } catch (e) {
      // Chrome đòi lời mời phải nằm trong ngữ cảnh một thao tác người dùng và
      // ném nếu không; gọi lần hai cũng ném. Cả hai là "không cài được lần
      // này", không phải lỗi đáng làm vỡ màn hình.
    }
    if (xong) dai.remove();
    return;
  }

  const { tieuDe, buoc, cuoi } = HUONG_DAN[kieu];
  const hop = h(
    'dialog',
    { class: 'huong-dan' },
    h('h3', null, tieuDe),
    h('ol', null, ...buoc.map((b) => h('li', null, b))),
    h('p', { class: 'mo' }, cuoi),
    h(
      'div',
      { class: 'cuoc' },
      h(
        'button',
        {
          class: 'vien',
          onclick: async () => {
            await navigator.clipboard.writeText(location.href).catch(() => {});
            const { nhan } = await import('./ui.js');
            nhan('Đã chép đường dẫn');
          },
        },
        'Chép đường dẫn',
      ),
      h('button', { class: 'chinh', onclick: () => hop.close() }, 'Đã hiểu'),
    ),
  );
  hop.addEventListener('close', () => hop.remove());
  document.body.append(hop);
  hop.showModal();
}
