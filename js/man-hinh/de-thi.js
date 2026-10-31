import { h, trong } from '../ui.js';
import { trangNap } from '../trang.js';
import { layDeThi } from '../nguon.js';
import { layLichSu } from '../thi.js';
import { di } from '../router.js';
import { soDiem } from '../ui.js';

export default function manHinhDeThi() {
  return trangNap({ tieuDe: 'Bài kiểm tra', quayVe: '/' }, layDeThi, (ds) => {
    if (!ds.length) return trong('Chưa có đề thi nào.');

    // Điểm cao nhất lấy từ lịch sử trên chính máy này. Không còn bảng xếp
    // hạng — nó cần một chỗ chung để so, mà chỗ chung đó là máy chủ.
    const cao = new Map();
    for (const b of layLichSu()) {
      if (!b.ma.startsWith('de-')) continue;
      const id = Number(b.ma.slice(3));
      cao.set(id, Math.max(cao.get(id) ?? 0, b.diem));
    }

    return h(
      'div',
      null,
      ...ds.map((d) => {
        const soCau = d.phan.reduce((t, p) => t + p.cau.length, 0);
        return h(
          'div',
          { class: 'the' },
          h('h3', null, d.ten),
          h(
            'p',
            null,
            `${soCau} câu · ${d.phut} phút`,
            cao.has(d.id) ? ` · điểm cao nhất ${soDiem(cao.get(d.id))}` : ' · chưa làm',
          ),
          h(
            'div',
            { class: 'cuoc deu tren' },
            h('button', { class: 'chinh', onclick: () => di('/de-thi/' + d.id) }, 'Vào thi'),
          ),
        );
      }),
      h(
        'p',
        { class: 'mo nho', style: { marginTop: '20px' } },
        'Bấm vào một đề là đồng hồ bắt đầu chạy. Bỏ dở giữa chừng thì lần sau mở lại ' +
          'đúng bài đó với thời gian còn lại — bài đang làm nằm trong máy này, nên đổi ' +
          'máy là mất.',
      ),
    );
  });
}
