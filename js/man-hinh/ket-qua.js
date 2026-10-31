import { h, soDiem, khoangThoiGian, trong } from '../ui.js';
import { trang } from '../trang.js';
import { timBaiDaLam } from '../thi.js';
import { di } from '../router.js';

export default function manHinhKetQua({ ma }) {
  const kq = timBaiDaLam(ma);

  if (!kq) {
    return trang(
      { tieuDe: 'Kết quả', quayVe: '/' },
      trong('Không tìm thấy bài này. Lịch sử chỉ nằm trên máy đã làm bài.'),
    );
  }

  const ty = kq.soCau ? kq.dung / kq.soCau : 0;
  const mau = ty >= 0.8 ? 'var(--luc)' : ty >= 0.5 ? 'var(--vang)' : 'var(--error)';

  return trang(
    { tieuDe: 'Kết quả', quayVe: '/' },
    h(
      'div',
      { class: 'giua' },
      h('div', { class: 'diem-to', style: { color: mau } }, soDiem(kq.diem)),
      h('p', { class: 'mo' }, kq.ten),
    ),
    h(
      'table',
      { class: 'bang' },
      hang('Số câu đúng', `${kq.dung}/${kq.soCau}`),
      hang('Số câu đã làm', `${kq.daLam}/${kq.soCau}`),
      hang('Thời gian làm', khoangThoiGian(kq.giay)),
    ),
    kq.phan.length > 1
      ? h(
          'div',
          null,
          h('h3', { style: { margin: '24px 0 4px', fontSize: '15px' } }, 'Theo từng phần'),
          h(
            'table',
            { class: 'bang' },
            ...kq.phan.map((p) => hang(p.ten, `${p.dung}/${p.soCau} đúng`)),
          ),
        )
      : null,
    h(
      'div',
      { class: 'cuoc deu tren' },
      h('button', { class: 'chinh', onclick: () => di('/xem-lai/' + encodeURIComponent(kq.ma)) }, 'Xem lại đáp án'),
      h('button', { class: 'vien', onclick: () => di('/lich-su') }, 'Lịch sử'),
    ),
  );
}

function hang(ten, giaTri) {
  return h('tr', null, h('td', null, ten), h('td', { class: 'so' }, giaTri));
}
