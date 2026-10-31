import { h, soDiem, trong } from '../ui.js';
import { trangNap } from '../trang.js';
import { tinhMon, layLichSu } from '../thi.js';
import { di } from '../router.js';

export default function manHinhThiThu() {
  return trangNap({ tieuDe: 'Thi thử theo môn', quayVe: '/' }, tinhMon, (ds) => {
    if (!ds.length) return trong('Chưa có môn nào.');

    const cao = new Map();
    for (const b of layLichSu()) {
      if (b.mon) cao.set(b.mon, Math.max(cao.get(b.mon) ?? 0, b.diem));
    }

    return h(
      'div',
      null,
      ...ds.map((m) =>
        h(
          'div',
          { class: 'the' },
          h(
            'h3',
            null,
            m.ten,
            cao.has(m.ma) ? h('span', { class: 'nhan-nho' }, 'cao nhất ' + soDiem(cao.get(m.ma))) : null,
          ),
          h('p', null, `${m.soCau} câu · ${m.phut} phút`),
          // Nói ra ngân sách thay vì để học viên phát hiện lúc hết: "không
          // trùng" chỉ hứa được tới khi ngân hàng còn câu chưa gặp.
          h(
            'p',
            null,
            m.sanSang
              ? `Còn ${m.conDe} đề không trùng · ${m.chuaGap}/${m.tong} câu chưa gặp`
              : `Ngân hàng mới có ${m.tong} câu, chưa đủ một đề.`,
          ),
          h(
            'div',
            { class: 'cuoc deu tren' },
            h(
              'button',
              { class: 'chinh', disabled: !m.sanSang, onclick: () => m.sanSang && di('/thi-thu/' + m.ma) },
              'Vào thi',
            ),
          ),
        ),
      ),
      h(
        'p',
        { class: 'mo nho', style: { marginTop: '20px' } },
        'Mỗi lần bấm là một đề trộn riêng, không trùng câu nào bạn đã gặp trên máy này. ' +
          'Hết câu mới thì ứng dụng nói ra chứ không lặng lẽ phát lại.',
      ),
    );
  });
}
