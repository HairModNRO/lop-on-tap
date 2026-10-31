import { h } from '../ui.js';
import { moLop } from '../nguon.js';
import { di } from '../router.js';

/**
 * Mở lớp bằng mật khẩu chung.
 *
 * Thay cho màn hình đăng nhập cũ. Không có tài khoản, không có máy chủ — chỉ
 * có một mật khẩu giải mã dữ liệu đã nằm sẵn trong bản dựng. Gõ một lần, trình
 * duyệt nhớ khoá đã dẫn.
 */
export default function manHinhMoKhoa() {
  const o = h('input', {
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'mật khẩu lớp',
    autocapitalize: 'none',
    autocorrect: 'off',
    spellcheck: 'false',
  });

  const loi = h('p', { class: 'loi', style: { display: 'none' } });
  const nut = h('button', { class: 'chinh rong', type: 'submit' }, 'Mở lớp');

  const form = h(
    'form',
    {
      class: 'cot-hep',
      onsubmit: async (e) => {
        e.preventDefault();
        loi.style.display = 'none';
        nut.disabled = true;
        // Dẫn khoá mất gần một giây trên điện thoại — nói ra, nếu không nó
        // trông như bấm hụt.
        nut.textContent = 'Đang mở…';

        try {
          await moLop(o.value);
          const ve = sessionStorage.getItem('hsa.quay-ve');
          sessionStorage.removeItem('hsa.quay-ve');
          di(ve && ve !== '/mo-khoa' ? ve : '/', { thay: true });
        } catch (e2) {
          loi.textContent = e2.message;
          loi.style.display = '';
          nut.disabled = false;
          nut.textContent = 'Mở lớp';
          o.select();
        }
      },
    },
    h('h2', { class: 'hieu' }, 'HSA'),
    h('p', { class: 'mo giua-chu' }, 'Nhập mật khẩu lớp để xem bài giảng'),
    h('label', { class: 'o' }, h('span', null, 'Mật khẩu lớp'), o),
    loi,
    h('div', { style: { marginTop: '8px' } }, nut),
    h(
      'p',
      { class: 'mo nho', style: { marginTop: '28px', textAlign: 'center' } },
      'Mật khẩu do giáo viên phát. Gõ một lần, máy này nhớ cho lần sau.',
    ),
  );

  return h('div', { class: 'man-giua' }, form);
}
