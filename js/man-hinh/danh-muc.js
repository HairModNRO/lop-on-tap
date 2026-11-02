import { h, bt } from '../ui.js';
import { trangNap } from '../trang.js';
import { layDanhMuc, demBai, demVideo } from '../nguon.js';
import { di } from '../router.js';

export default function manHinhDanhMuc() {
  return trangNap(
    {
      tieuDe: 'Khoá học',
      quayVe: false,
      tran: true,
      nut: [
        nut('quiz', 'Bài kiểm tra', () => di('/de-thi')),
        nut('shuffle', 'Thi thử theo môn', () => di('/thi-thu')),
        nut('history', 'Lịch sử làm bài', () => di('/lich-su')),
      ],
    },
    layDanhMuc,
    (dm) =>
      h(
        'ul',
        { class: 'ds' },
        ...dm.phan.map((p, i) => [
          i ? h('hr', { class: 'gach' }) : null,
          h(
            'li',
            null,
            h(
              'button',
              { class: 'muc', onclick: () => di('/phan/' + i) },
              h('span', { class: 'vong' }, String(p.thuTu)),
              h(
                'span',
                { class: 'noi' },
                h('span', { class: 'ten' }, p.ten),
                h('span', { class: 'phu' }, `${demBai(p)} bài · ${demVideo(p)} video`),
              ),
              bt('chevron_right', 'mui'),
            ),
          ),
        ]),
      ),
  );
}

function nut(ten, nhan, khiBam) {
  return h('button', { class: 'bieu-tuong', title: nhan, 'aria-label': nhan, onclick: khiBam }, bt(ten));
}
