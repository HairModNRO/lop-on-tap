import { h, bt, nhan, dangTai, baoLoi } from '../ui.js';
import { trang, datThan } from '../trang.js';
import { layTaiLieu, layDanhMuc } from '../nguon.js';

/**
 * Đọc một tài liệu PDF.
 *
 * Tài liệu nằm ở Releases của repo, đã mã hoá: 1,8 GB không vừa giới hạn 1 GB
 * của GitHub Pages, và để trần thì ai mở trang Releases cũng tải được cả khoá.
 * Trình duyệt tải về rồi giải mã tại chỗ.
 *
 * Phần hiển thị giao lại cho trình duyệt — nó đã có sẵn một trình đọc PDF tốt
 * hơn bất cứ thứ gì đáng mang theo.
 */
export default function manHinhTaiLieu({ ma }) {
  const el = trang({ tieuDe: 'Tài liệu', quayVe: false, dai: true }, dangTai());
  let duongBlob = null;

  const chay = async () => {
    datThan(el, dangTai('Đang tải và giải mã tài liệu…'));
    try {
      const [blob, ten] = await Promise.all([layTaiLieu(ma), timTen(ma)]);

      el.querySelector('h1').textContent = ten;
      if (duongBlob) URL.revokeObjectURL(duongBlob);
      duongBlob = URL.createObjectURL(blob);

      datThan(
        el,
        h(
          'div',
          { class: 'cuoc deu tren' },
          h('button', { class: 'vien', onclick: () => moRieng(duongBlob) }, bt('open_in_new', 'vua'), 'Mở riêng'),
          h('button', { class: 'vien', onclick: () => taiVe(duongBlob, ten) }, bt('download', 'vua'), 'Tải về'),
        ),
        // <object> chứ không <iframe>: nội dung thay thế bên trong chỉ hiện khi
        // trình duyệt KHÔNG dựng được PDF, nên iPhone — nơi Safari từ chối vẽ
        // blob PDF nhúng — nhận được một câu hướng dẫn thay vì một ô trắng.
        h(
          'object',
          { class: 'khung-pdf', data: duongBlob, type: 'application/pdf' },
          h(
            'div',
            { class: 'giua' },
            h('p', { class: 'mo' }, 'Trình duyệt này không mở PDF ngay trong trang.'),
            h('button', { class: 'chinh', onclick: () => moRieng(duongBlob) }, 'Mở tài liệu'),
          ),
        ),
      );
    } catch (loi) {
      console.error(loi);
      datThan(el, baoLoi(loi, chay));
    }
  };

  chay();

  el.__manHinh = {
    dong() {
      // Trả lại bộ nhớ. Một tài liệu vài trăm KB nhân với mỗi lần ra vào sẽ ở
      // lại cho tới khi tải lại trang; có file tới 38 MB.
      if (duongBlob) URL.revokeObjectURL(duongBlob);
    },
  };
  return el;
}

function moRieng(duong) {
  const w = open(duong, '_blank');
  if (!w) nhan('Trình duyệt chặn cửa sổ mới. Dùng nút Tải về.');
}

function taiVe(duong, ten) {
  const a = h('a', { href: duong, download: tenFile(ten), style: { display: 'none' } });
  document.body.append(a);
  a.click();
  a.remove();
}

/** Dấu gạch chéo là dấu tách thư mục trên cả ba hệ, và Windows còn cấm thêm
 *  một nắm ký tự nữa. Dấu tiếng Việt thì giữ — chúng hợp lệ. */
function tenFile(ten) {
  const sach = ten
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '')
    .trim();
  if (!sach) return 'tai-lieu.pdf';
  return /\.pdf$/i.test(sach) ? sach : sach + '.pdf';
}

async function timTen(ma) {
  try {
    const dm = await layDanhMuc();
    for (const p of dm.phan) {
      for (const n of p.nhom) {
        for (const b of n.bai) {
          for (const t of b.taiLieu) if (t.ma === ma) return t.ten;
        }
      }
    }
  } catch (e) {
    /* không tra được tên thì vẫn mở được tài liệu */
  }
  return 'Tài liệu';
}
