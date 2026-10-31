import { h, bt } from '../ui.js';
import { trangNap } from '../trang.js';
import { layDanhMuc } from '../nguon.js';
import { di } from '../router.js';

export default function manHinhPhan({ i }) {
  const soPhan = Number(i);

  return trangNap({ tieuDe: 'Phần', quayVe: '/', tran: true, dai: true }, layDanhMuc, (dm, el) => {
    const phan = dm.phan[soPhan];
    if (!phan) return h('p', { class: 'mo' }, 'Không có phần này.');

    el.querySelector('h1').textContent = phan.ten;

    // Nhóm không tên nằm trước, phẳng — gói chúng vào một mục gập không tên là
    // thêm một cú bấm cho không có gì.
    const roi = phan.nhom.filter((n) => !n.ten).flatMap((n) => n.bai);
    const coTen = phan.nhom.filter((n) => n.ten);

    return h(
      'div',
      null,
      roi.length ? h('ul', { class: 'ds' }, ...roi.map(oBai)) : null,
      // <details> của trình duyệt: gập mở là việc trình duyệt làm sẵn, và nội
      // dung bên trong chỉ được dựng khi mở.
      ...coTen.map((n) =>
        h(
          'details',
          { class: 'nhom', open: coTen.length === 1 },
          h(
            'summary',
            null,
            h(
              'span',
              { class: 'noi' },
              h('span', { class: 'ten' }, n.ten),
              h('span', { class: 'phu' }, `${n.bai.length} bài`),
            ),
            bt('chevron_right', 'mui'),
          ),
          h('ul', { class: 'ds' }, ...n.bai.map(oBai)),
        ),
      ),
    );
  });
}

function oBai(b) {
  return h(
    'li',
    null,
    h(
      'button',
      { class: 'muc gon', onclick: () => di('/bai/' + b.id) },
      bt(b.youtubeId ? 'play_circle_outline' : 'menu_book'),
      h(
        'span',
        { class: 'noi' },
        h('span', { class: 'ten' }, b.ten),
        b.taiLieu.length ? h('span', { class: 'phu' }, `${b.taiLieu.length} tài liệu`) : null,
      ),
    ),
  );
}
