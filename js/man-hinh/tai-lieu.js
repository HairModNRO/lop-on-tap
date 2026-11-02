import { h, bt, nhan, dangTai, baoLoi } from '../ui.js';
import { trang, datThan } from '../trang.js';
import { layTaiLieu, layDanhMuc } from '../nguon.js';

/**
 * Đọc một tài liệu PDF.
 *
 * Tài liệu nằm ở các kho Pages riêng, đã mã hoá: 1,8 GB không vừa giới hạn
 * 1 GB mỗi site. Trình duyệt tải về rồi giải mã tại chỗ.
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
          h('button', { class: 'vien', onclick: () => moRieng(blob, duongBlob, ten) }, bt('open_in_new', 'vua'), 'Mở riêng'),
          h('button', { class: 'vien', onclick: () => taiVe(blob, duongBlob, ten) }, bt('download', 'vua'), 'Tải về'),
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
            h('button', { class: 'chinh', onclick: () => moRieng(blob, duongBlob, ten) }, 'Mở tài liệu'),
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

/**
 * Trong vỏ Android: WebView không vẽ được PDF và cũng bỏ qua `<a download>`.
 *
 * Đây là điểm nối duy nhất giữa trang và vỏ. Vỏ chỉ tiêm `__hsaThe` vào khung
 * chính, nên iframe của YouTube chạy cùng WebView không gọi được sang.
 */
const trongVo = () => typeof HsaApp !== 'undefined' && HsaApp && typeof __hsaThe === 'string';

/** Byte đi theo khúc: có tài liệu 38 MB, và `String.fromCharCode(...u8)` trên
 *  cả mảng là vượt giới hạn tham số của hàm. */
async function guiSangVo(blob, ten) {
  const u8 = new Uint8Array(await blob.arrayBuffer());
  HsaApp.batDau(__hsaThe, tenFile(ten));
  const KHUC = 3 << 20;
  for (let i = 0; i < u8.length; i += KHUC) {
    const p = u8.subarray(i, i + KHUC);
    let s = '';
    for (let j = 0; j < p.length; j += 8192) s += String.fromCharCode.apply(null, p.subarray(j, j + 8192));
    HsaApp.them(__hsaThe, btoa(s));
  }
  HsaApp.xong(__hsaThe);
}

function moRieng(blob, duong, ten) {
  if (trongVo()) {
    guiSangVo(blob, ten).catch((e) => nhan('Không mở được tài liệu: ' + e.message));
    return;
  }
  const w = open(duong, '_blank');
  if (!w) nhan('Trình duyệt chặn cửa sổ mới. Dùng nút Tải về.');
}

function taiVe(blob, duong, ten) {
  if (trongVo()) {
    guiSangVo(blob, ten).catch((e) => nhan('Không lưu được tài liệu: ' + e.message));
    return;
  }
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
