type FooterColumn = { title: string; links: string[] };

type FooterProps = {
  columns?: FooterColumn[];
};

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: 'Product', links: ['모의 면접', '피드백', '가격'] },
  { title: 'Company', links: ['소개', '블로그', '채용'] },
  { title: 'Resources', links: ['가이드', 'FAQ', '문의'] },
  { title: 'Legal', links: ['이용약관', '개인정보', '쿠키'] },
];

export function Footer({ columns = DEFAULT_COLUMNS }: FooterProps) {
  return (
    <footer className="rounded-lg bg-surface-dark px-8 py-16 text-on-dark-soft">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-title-sm font-medium text-on-dark">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-2 text-body-sm">
              {column.links.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
