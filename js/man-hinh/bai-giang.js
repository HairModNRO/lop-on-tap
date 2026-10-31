import { h, bt } from '../ui.js';
import { trangNap } from '../trang.js';
import { timBai } from '../nguon.js';
import { di } from '../router.js';

export default function manHinhBaiGiang({ id }) {
  return trangNap({ tieuDe: 'Bài giảng', quayVe: '/', tran: true, dai: true }, () => timBai(id), (tim, el) => {
    if (!tim) return h('p', { class: 'mo' }, 'Không tìm thấy bài này.');

    const { bai } = tim;
    el.querySelector('h1').textContent = bai.ten;

    const taiLieu = h(
      'div',
      null,
      h('h2', { class: 'ten-bai' }, bai.ten),
      h('h3', { class: 'muc-de' }, `Tài liệu (${bai.taiLieu.length})`),
      bai.taiLieu.length
        ? h(
            'ul',
            { class: 'ds' },
            ...bai.taiLieu.map((t) =>
              h(
                'li',
                null,
                h(
                  'button',
                  {
                    class: 'muc gon',
                    // `ma` là tên file trên Releases; `url` là đường dẫn
                    // gốc trên trang HSA, dùng khi tài liệu không có bản
                    // tải về — mở ra đó còn hơn một mục bấm vào không ra gì.
                    onclick: () =>
                      t.ma
                        ? di('/tai-lieu/' + t.ma)
                        : t.url && open(t.url, '_blank', 'noopener'),
                  },
                  bt('picture_as_pdf'),
                  h('span', { class: 'noi' }, h('span', { class: 'ten' }, t.ten)),
                  bt('chevron_right', 'nho mui'),
                ),
              ),
            ),
          )
        : h('p', { class: 'mo nho', style: { padding: '0 16px' } }, 'Bài này không có tài liệu kèm theo.'),
    );

    if (!bai.youtubeId) return taiLieu;

    // iframe thẳng, không qua lớp bọc nào. Đây chính là chỗ bản Flutter phải
    // nhét một "platform view" vào giữa canvas và trả giá bằng hiệu năng; ở
    // đây nó chỉ là một phần tử bình thường của trang.
    const video = h(
      'div',
      { class: 'video' },
      h('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(bai.youtubeId)}?rel=0&hl=vi&cc_lang_pref=vi`,
        title: bai.ten,
        loading: 'lazy',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
        allowfullscreen: true,
        referrerpolicy: 'strict-origin-when-cross-origin',
      }),
    );

    return h('div', { class: 'doi-cot' }, video, taiLieu);
  });
}
