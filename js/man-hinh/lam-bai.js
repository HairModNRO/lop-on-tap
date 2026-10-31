import { h, dongHo, dangTai, baoLoi, nhan } from '../ui.js';
import { trang, datThan } from '../trang.js';
import { di } from '../router.js';
import { veToan } from '../toan.js';
import { batDauDe, batDauThiThu, layDangLam, ghiTraLoi, conLai, cham } from '../thi.js';

/**
 * Làm một đề.
 *
 * Dùng chung cho đề cố định (`/de-thi/:id`) và thi thử theo môn
 * (`/thi-thu/:mon`) — từ sau khi sinh đề thì không còn gì khác nhau.
 *
 * Bài đang làm nằm trong localStorage, nên đóng tab rồi mở lại vẫn đúng bài đó
 * với thời gian còn lại. Nhưng đồng hồ chạy bằng đồng hồ máy, và máy thì vặn
 * được — không có máy chủ thì không có đồng hồ nào khác.
 */
export default function manHinhLamBai(tham) {
  const el = trang({ tieuDe: 'Đang vào thi…', quayVe: false, dai: true }, dangTai());
  const trangThai = { dongHo: null };

  el.__manHinh = {
    dong() {
      clearInterval(trangThai.dongHo);
    },
  };

  // Mở lại đúng bài đang dở thay vì phát đề mới: với thi thử, sinh một đề mới
  // là tiêu thêm một phần ngân sách "không trùng" của học viên.
  const dang = layDangLam();
  const hopLe = dang && (tham.mon ? dang.mon === tham.mon : dang.ma === 'de-' + tham.id);

  const vao = hopLe
    ? Promise.resolve(dang)
    : tham.mon
      ? batDauThiThu(tham.mon)
      : batDauDe(tham.id);

  vao.then(
    (bai) => dung(el, trangThai, bai, hopLe),
    (loi) => {
      console.error(loi);
      datThan(
        el,
        baoLoi(loi, null),
        h('button', { class: 'vien', onclick: () => di(tham.mon ? '/thi-thu' : '/de-thi') }, 'Quay lại'),
      );
    },
  );

  return el;
}

function dung(el, trangThai, bai, laMoLai) {
  if (bai.dungLai) nhan('Ngân hàng đã hết câu mới — đề này có câu bạn từng gặp.');
  if (laMoLai) nhan('Mở lại bài đang làm dở.');

  const cau = [];
  bai.phan.forEach((p, iP) => p.cau.forEach((q, iQ) => cau.push({ q, p, iP, iQ })));

  let viTri = 0;
  let dangNop = false;

  el.querySelector('h1').textContent = bai.ten;

  const oDongHo = h('span', { class: 'dem-nguoc' }, dongHo(conLai(bai)));
  const oTienDo = h('span', { class: 'mo' });
  const thanhThi = h(
    'div',
    { class: 'thanh-thi' },
    oDongHo,
    oTienDo,
    h('button', { class: 'phang', onclick: moLuoi }, 'Danh sách câu'),
  );

  const oCau = h('div');
  const nutTruoc = h('button', { class: 'vien', onclick: () => nhay(viTri - 1) }, '‹ Trước');
  const nutSau = h('button', { class: 'vien', onclick: () => nhay(viTri + 1) }, 'Sau ›');
  const nutNop = h('button', { class: 'chinh', onclick: () => nop(false) }, 'Nộp bài');

  datThan(el, thanhThi, oCau);
  el.append(h('div', { class: 'day-nut' }, nutTruoc, nutSau, nutNop));

  trangThai.dongHo = setInterval(() => {
    const con = conLai(bai);
    oDongHo.textContent = dongHo(con);
    oDongHo.classList.toggle('gap', con <= 300);
    // Hết giờ thì nộp hộ chứ không đóng băng màn hình: những câu đã làm vẫn
    // đáng được chấm.
    if (con === 0 && !dangNop) nop(true);
  }, 1000);

  ve();

  /* ------------------------------------------------------------------ vẽ */

  function ve() {
    const { q, p, iQ } = cau[viTri];

    oTienDo.textContent =
      bai.phan.length > 1
        ? `${p.ten} · câu ${iQ + 1}/${p.cau.length}`
        : `Câu ${iQ + 1}/${p.cau.length}`;

    const daChon = bai.traLoi[q.id];

    const than = h('div', null, veToan(q.deBai || '', { khoi: true }));
    than.firstChild.classList.add('de-bai');

    if (q.dapAn.length) {
      than.append(
        h(
          'div',
          null,
          ...q.dapAn.map((d) =>
            h(
              'button',
              {
                class: 'pa' + (daChon === d.nhan ? ' chon' : ''),
                onclick: () => {
                  bai.traLoi[q.id] = d.nhan;
                  ghiTraLoi(q.id, d.nhan);
                  ve();
                },
              },
              h('span', { class: 'nhan-pa' }, d.nhan + '.'),
              veToan(d.chu || '', { khoi: false }),
            ),
          ),
        ),
      );
    } else {
      const o = h('input', {
        type: 'text',
        value: daChon || '',
        placeholder: 'Số nguyên hoặc phân số, ví dụ -3/4',
        oninput: (e) => {
          // Ô đáp án nhận số, dấu phân số và dấu thập phân, không gì khác.
          e.target.value = e.target.value.replace(/[^0-9/.,-]/g, '');
          bai.traLoi[q.id] = e.target.value;
          ghiTraLoi(q.id, e.target.value);
        },
      });
      than.append(h('label', { class: 'o' }, h('span', null, 'Đáp án'), o));
    }

    oCau.replaceChildren(than);
    nutTruoc.disabled = viTri === 0;
    nutSau.disabled = viTri === cau.length - 1;
  }

  function nhay(toi) {
    if (toi < 0 || toi >= cau.length) return;
    viTri = toi;
    ve();
    scrollTo(0, 0);
  }

  /* -------------------------------------------------------------- lưới */

  function moLuoi() {
    const xong = (q) => {
      const v = bai.traLoi[q.id];
      return v !== undefined && v !== null && String(v) !== '';
    };

    const hop = h(
      'dialog',
      { class: 'luoi-hop' },
      h('h3', null, 'Danh sách câu'),
      ...bai.phan.map((p) =>
        h(
          'div',
          null,
          bai.phan.length > 1 ? h('p', { class: 'mo nho' }, p.ten) : null,
          h(
            'div',
            { class: 'luoi-cau' },
            ...p.cau.map((q, iQ) => {
              const chiSo = cau.findIndex((c) => c.q.id === q.id);
              return h(
                'button',
                {
                  class: 'o-cau' + (xong(q) ? ' xong' : '') + (chiSo === viTri ? ' day' : ''),
                  onclick: () => {
                    hop.close();
                    nhay(chiSo);
                  },
                },
                iQ + 1,
              );
            }),
          ),
        ),
      ),
      h('p', { class: 'mo nho' }, `Đã làm ${cau.filter((c) => xong(c.q)).length}/${cau.length} câu`),
      h('div', { class: 'cuoc' }, h('button', { class: 'chinh', onclick: () => hop.close() }, 'Đóng')),
    );
    hop.addEventListener('close', () => hop.remove());
    document.body.append(hop);
    hop.showModal();
  }

  /* --------------------------------------------------------------- nộp */

  function nop(tuDong) {
    if (dangNop) return;

    const chuaLam = cau.filter((c) => {
      const v = bai.traLoi[c.q.id];
      return v === undefined || v === null || String(v) === '';
    }).length;

    if (!tuDong && chuaLam > 0 && !confirm(`Còn ${chuaLam} câu chưa làm. Nộp bài luôn?`)) return;

    dangNop = true;
    clearInterval(trangThai.dongHo);

    const banGhi = cham(bai);
    di('/ket-qua/' + encodeURIComponent(banGhi.ma), { thay: true });
  }
}
