import { h, bt, soDiem, ngayGio, khoangThoiGian, trong, nhan } from '../ui.js';
import { trang } from '../trang.js';
import { layLichSu, layDangLam, xoaLichSu } from '../thi.js';
import { di } from '../router.js';

export default function manHinhLichSu() {
  const ds = layLichSu();
  const dang = layDangLam();

  const than = [];

  // Bài bỏ dở hiện trước và hiện rõ: nó đang giữ đồng hồ, và học viên cần biết
  // nó còn đó.
  if (dang) {
    than.push(
      h(
        'button',
        { class: 'muc', onclick: () => di(dang.mon ? '/thi-thu/' + dang.mon : '/de-thi/' + dang.ma.slice(3)) },
        bt('hourglass_empty'),
        h(
          'span',
          { class: 'noi' },
          h('span', { class: 'ten' }, dang.ten),
          h('span', { class: 'phu' }, `Bắt đầu ${ngayGio(dang.batDauLuc)} · chưa nộp`),
        ),
        bt('chevron_right', 'mui'),
      ),
    );
  }

  if (!ds.length && !dang) {
    return trang({ tieuDe: 'Lịch sử làm bài', quayVe: '/' }, trong('Bạn chưa làm bài nào.'));
  }

  than.push(...ds.map(mot));

  // Lịch sử nằm trong máy này, không đồng bộ đi đâu. Nói ra chứ đừng để học
  // viên đổi máy rồi tưởng mất bài.
  than.push(
    h(
      'p',
      { class: 'mo nho', style: { padding: '16px' } },
      'Lịch sử lưu trên máy này. Đổi máy hoặc xoá dữ liệu trang là mất.',
    ),
  );

  if (ds.length) {
    than.push(
      h(
        'div',
        { style: { padding: '0 16px' } },
        h(
          'button',
          {
            class: 'vien',
            onclick: () => {
              if (!confirm('Xoá toàn bộ lịch sử và danh sách câu đã gặp?')) return;
              xoaLichSu();
              nhan('Đã xoá');
              di('/');
            },
          },
          'Xoá lịch sử',
        ),
      ),
    );
  }

  return trang({ tieuDe: 'Lịch sử làm bài', quayVe: '/', tran: true }, h('ul', { class: 'ds' }, ...than));
}

function mot(b) {
  const ty = b.soCau ? b.dung / b.soCau : 0;
  const mau = ty >= 0.8 ? 'var(--luc)' : ty >= 0.5 ? 'var(--vang)' : 'var(--error)';

  return h(
    'li',
    null,
    h(
      'button',
      { class: 'muc', onclick: () => di('/xem-lai/' + encodeURIComponent(b.ma)) },
      h('span', { class: 'diem-tron', style: { color: mau } }, soDiem(b.diem)),
      h(
        'span',
        { class: 'noi' },
        h('span', { class: 'ten' }, b.ten),
        h(
          'span',
          { class: 'phu' },
          `${ngayGio(b.nopLuc)} · đúng ${b.dung}/${b.soCau} · ${khoangThoiGian(b.giay)}`,
        ),
      ),
      bt('chevron_right', 'mui'),
    ),
  );
}
