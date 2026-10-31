import { h, bt, soDiem, ngayGio, khoangThoiGian, trong } from '../ui.js';
import { trang } from '../trang.js';
import { timBaiDaLam } from '../thi.js';
import { veToan } from '../toan.js';

/**
 * Xem lại một bài đã nộp, kèm đáp án.
 *
 * Ba trạng thái chứ không phải hai, và đây là chỗ dễ làm sai nhất: **đúng**,
 * **sai**, và **bỏ trống**. Chỉ nhìn "đúng/không đúng" thì mọi câu bỏ trống bị
 * xếp vào ô sai — và bảo học viên đi ôn lại một chủ đề họ có thể nắm rất chắc
 * mà chỉ hết giờ.
 */
export default function manHinhXemLai({ ma }) {
  const b = timBaiDaLam(ma);

  if (!b) {
    return trang(
      { tieuDe: 'Xem lại đáp án', quayVe: '/lich-su' },
      trong('Không tìm thấy bài này.'),
    );
  }

  return trang(
    { tieuDe: 'Xem lại đáp án', quayVe: '/lich-su', dai: true },
    h('h2', { style: { margin: '0', fontSize: '18px', fontWeight: '500' } }, b.ten),
    h(
      'p',
      { class: 'mo nho' },
      `${ngayGio(b.nopLuc)} · ${soDiem(b.diem)} điểm · đúng ${b.dung}/${b.soCau}` +
        ` · làm ${khoangThoiGian(b.giay)}`,
    ),
    ...b.cau.map(veCau),
  );
}

function veCau(c, i) {
  const daLam = c.daChon !== null && c.daChon !== undefined && String(c.daChon) !== '';
  const [lop, nhan] = c.dung ? ['dung', 'Đúng'] : daLam ? ['sai', 'Sai'] : ['trong', 'Bỏ trống'];

  const than = h(
    'div',
    { class: 'cau-xem ' + lop },
    h(
      'div',
      { class: 'dau-cau' },
      h('span', { class: 'so-cau' }, 'Câu ' + (i + 1)),
      h('span', { class: 'nhan-nho ' + lop }, nhan),
    ),
    veToan(c.deBai || '', { khoi: true }),
  );

  if (c.dapAn.length) {
    than.append(
      h(
        'div',
        null,
        ...c.dapAn.map((d) =>
          h(
            'div',
            // Hai sự thật rời nhau: "đáp án đúng là cái nào" và "bạn đã chọn
            // cái nào". Gộp làm một thì không nói được "bạn chọn cái này và nó
            // sai" cùng lúc với "cái đúng là cái kia".
            {
              class:
                'pa' + (d.dung ? ' dung' : '') + (c.daChon === d.nhan && !d.dung ? ' sai' : ''),
            },
            h('span', { class: 'nhan-pa' }, d.nhan + '.'),
            veToan(d.chu || '', { khoi: false }),
            c.daChon === d.nhan ? h('span', { class: 'nhan-nho' }, 'bạn chọn') : null,
            d.dung ? bt('check', 'vua dau-dung') : null,
          ),
        ),
      ),
    );
  } else {
    than.append(
      h(
        'table',
        { class: 'bang' },
        h('tr', null, h('td', null, 'Bạn điền'), h('td', { class: 'so' }, daLam ? c.daChon : '—')),
        h('tr', null, h('td', null, 'Đáp án'), h('td', { class: 'so' }, c.chuDung || '—')),
      ),
    );
  }

  return than;
}
