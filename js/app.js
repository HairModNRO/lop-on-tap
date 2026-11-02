// Điểm vào. Dựng bảng tuyến rồi giao việc cho màn hình.
//
// Mỗi màn hình được `import()` lúc cần chứ không nạp hết từ đầu: học viên mở
// ứng dụng ra để xem bài giảng, và họ không phải tải mã màn hình thi, màn hình
// xem lại đáp án hay bộ dựng công thức trước khi thấy danh sách bài.
//
// Không còn cổng mật khẩu. Khoá giải mã đi kèm bản dựng, nên mọi tuyến mở
// được ngay — xem `nguon.js` về chuyện đó bảo vệ được tới đâu.

import { dat, batDau, di } from './router.js';
import { gan as ganMoiCai } from './moi-cai.js';

const khung = document.getElementById('ung-dung');

const man = (nap) => async (tham) => (await nap()).default(tham);

dat('/', man(() => import('./man-hinh/danh-muc.js')));
dat('/phan/:i', man(() => import('./man-hinh/phan.js')));
dat('/bai/:id', man(() => import('./man-hinh/bai-giang.js')));
dat('/tai-lieu/:ma', man(() => import('./man-hinh/tai-lieu.js')));

dat('/de-thi', man(() => import('./man-hinh/de-thi.js')));
dat('/de-thi/:id', man(() => import('./man-hinh/lam-bai.js')));
dat('/ket-qua/:ma', man(() => import('./man-hinh/ket-qua.js')));

dat('/thi-thu', man(() => import('./man-hinh/thi-thu.js')));
dat('/thi-thu/:mon', man(() => import('./man-hinh/lam-bai.js')));
dat('/lich-su', man(() => import('./man-hinh/lich-su.js')));
dat('/xem-lai/:ma', man(() => import('./man-hinh/xem-lai.js')));

batDau(khung, (duong) => {
  console.warn('không có màn hình cho', duong);
  di('/', { thay: true });
});

ganMoiCai(document.body);
