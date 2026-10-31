// Điểm vào. Dựng bảng tuyến, canh cổng mật khẩu lớp, rồi giao việc cho màn
// hình.
//
// Mỗi màn hình được `import()` lúc cần chứ không nạp hết từ đầu: học viên mở
// ứng dụng ra để xem bài giảng, và họ không phải tải mã màn hình thi, màn hình
// xem lại đáp án hay bộ dựng công thức trước khi thấy danh sách bài.

import { dat, batDau, di, duongHienTai } from './router.js';
import { daMoLop, khoiPhuc, dongLop } from './nguon.js';
import { h } from './ui.js';
import { gan as ganMoiCai } from './moi-cai.js';

const khung = document.getElementById('ung-dung');

/** Màn hình cần mở lớp trước. Chưa mở thì về màn mật khẩu và nhớ chỗ. */
function canMoLop(nap) {
  return async (tham) => {
    if (!(await khoiPhuc())) {
      sessionStorage.setItem('hsa.quay-ve', duongHienTai());
      di('/mo-khoa', { thay: true });
      return h('div');
    }
    const mo = await nap();
    return mo.default(tham);
  };
}

dat('/', canMoLop(() => import('./man-hinh/danh-muc.js')));
dat('/phan/:i', canMoLop(() => import('./man-hinh/phan.js')));
dat('/bai/:id', canMoLop(() => import('./man-hinh/bai-giang.js')));
dat('/tai-lieu/:ma', canMoLop(() => import('./man-hinh/tai-lieu.js')));

dat('/de-thi', canMoLop(() => import('./man-hinh/de-thi.js')));
dat('/de-thi/:id', canMoLop(() => import('./man-hinh/lam-bai.js')));
dat('/ket-qua/:ma', canMoLop(() => import('./man-hinh/ket-qua.js')));

dat('/thi-thu', canMoLop(() => import('./man-hinh/thi-thu.js')));
dat('/thi-thu/:mon', canMoLop(() => import('./man-hinh/lam-bai.js')));
dat('/lich-su', canMoLop(() => import('./man-hinh/lich-su.js')));
dat('/xem-lai/:ma', canMoLop(() => import('./man-hinh/xem-lai.js')));

dat('/mo-khoa', async () => (await import('./man-hinh/mo-khoa.js')).default());

/** Quên khoá lớp trên máy này. Lịch sử làm bài thì giữ — nó là của học viên,
 *  không phải của lớp. */
export function dongLai() {
  dongLop();
  sessionStorage.removeItem('hsa.quay-ve');
  di('/mo-khoa', { thay: true });
}

batDau(khung, (duong) => {
  console.warn('không có màn hình cho', duong);
  di(daMoLop() ? '/' : '/mo-khoa', { thay: true });
});

ganMoiCai(document.body);
