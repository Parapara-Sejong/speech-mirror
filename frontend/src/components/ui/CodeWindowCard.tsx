type CodeWindowCardProps = {
  code: string;
  filename?: string;
};

export function CodeWindowCard({ code, filename }: CodeWindowCardProps) {
  // 끝의 개행 1개는 표시상 군더더기라 제거 후 줄 분리
  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div className="overflow-hidden rounded-lg bg-surface-dark">
      <div className="flex items-center gap-2 border-b border-on-dark/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-on-dark-soft/50" />
        <span className="h-3 w-3 rounded-full bg-on-dark-soft/50" />
        <span className="h-3 w-3 rounded-full bg-on-dark-soft/50" />
        {filename ? <span className="ml-2 text-body-sm text-on-dark-soft">{filename}</span> : null}
      </div>
      <pre className="overflow-x-auto bg-surface-dark-soft p-6 text-code">
        <code className="font-mono text-on-dark">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              <span className="mr-4 w-6 shrink-0 select-none text-right text-on-dark-soft">
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
